"""Universal Target Adapter supporting Real LLMs, Local Models (Ollama, LM Studio), and Advanced Simulation."""

from __future__ import annotations
import json
import time
import httpx
from typing import Optional, Dict, Any

from app.adapters.base import BaseAdapter, AdapterResponse
from app.adapters.simulated import SimulatedTarget, SYNTHETIC_SECRET


class UniversalModelAdapter(BaseAdapter):
    """Adapter capable of connecting to:
    - Simulated targets (vulnerable / protected with probabilistic defense simulation)
    - Local Ollama / vLLM / LM Studio instances
    - OpenAI-compatible hosted APIs (OpenAI, DeepSeek, Groq, Anthropic proxies)
    - Custom REST endpoints
    """

    def __init__(
        self,
        target_type: str = "simulated_vulnerable",
        endpoint: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None,
    ):
        self.target_type = target_type
        self.endpoint = endpoint
        self.config = config or {}
        self.simulated = SimulatedTarget(
            mode="protected" if target_type == "simulated_protected" else "vulnerable"
        )

    def is_available(self) -> bool:
        if self.target_type.startswith("simulated"):
            return True
        if not self.endpoint:
            return False
        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.get(self.endpoint)
                return res.status_code < 500
        except Exception:
            return False

    def send_prompt(self, prompt: str, context: Optional[dict] = None) -> AdapterResponse:
        start = time.perf_counter()

        # If simulated target
        if self.target_type in ("simulated_vulnerable", "simulated_protected"):
            return self.simulated.send_prompt(prompt, context)

        # If Local Ollama instance
        if self.target_type == "local_model" or (self.endpoint and "11434" in self.endpoint):
            return self._call_ollama(prompt, start)

        # If OpenAI-compatible or HTTP endpoint
        if self.endpoint:
            return self._call_http_api(prompt, start, context)

        # Fallback to simulated
        return self.simulated.send_prompt(prompt, context)

    def _call_ollama(self, prompt: str, start_time: float) -> AdapterResponse:
        url = self.endpoint or "http://localhost:11434/api/generate"
        model_name = self.config.get("model", "llama3")
        system_prompt = self.config.get("system_prompt", "You are a helpful assistant.")

        try:
            with httpx.Client(timeout=45.0) as client:
                resp = client.post(
                    url,
                    json={
                        "model": model_name,
                        "prompt": prompt,
                        "system": system_prompt,
                        "stream": False,
                    },
                )
                elapsed = int((time.perf_counter() - start_time) * 1000)
                if resp.status_code == 200:
                    text = resp.json().get("response", "")
                    return AdapterResponse(text=text, latency_ms=elapsed, success=True)
                return AdapterResponse(
                    text="",
                    latency_ms=elapsed,
                    success=False,
                    error=f"Ollama HTTP {resp.status_code}: {resp.text[:150]}",
                )
        except Exception as e:
            elapsed = int((time.perf_counter() - start_time) * 1000)
            return AdapterResponse(text="", latency_ms=elapsed, success=False, error=str(e))

    def _call_http_api(
        self, prompt: str, start_time: float, context: Optional[dict]
    ) -> AdapterResponse:
        headers = self.config.get("headers", {"Content-Type": "application/json"})
        api_key = self.config.get("api_key")
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        # Standard OpenAI chat completions format if endpoint looks like v1/chat/completions
        is_chat_completions = "chat/completions" in (self.endpoint or "")
        model_name = self.config.get("model", "gpt-3.5-turbo")

        if is_chat_completions:
            payload = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": self.config.get("system_prompt", "You are a customer assistant.")},
                    {"role": "user", "content": prompt},
                ],
                "temperature": float(self.config.get("temperature", 0.7)),
            }
        else:
            payload = {"prompt": prompt, "context": context or {}}

        try:
            with httpx.Client(timeout=45.0) as client:
                resp = client.post(self.endpoint, json=payload, headers=headers)
                elapsed = int((time.perf_counter() - start_time) * 1000)
                if resp.status_code == 200:
                    data = resp.json()
                    if is_chat_completions:
                        choices = data.get("choices", [])
                        text = choices[0]["message"]["content"] if choices else ""
                    else:
                        text = data.get("response", data.get("text", str(data)))
                    return AdapterResponse(text=text, latency_ms=elapsed, success=True)
                return AdapterResponse(
                    text="",
                    latency_ms=elapsed,
                    success=False,
                    error=f"HTTP {resp.status_code}: {resp.text[:200]}",
                )
        except Exception as exc:
            elapsed = int((time.perf_counter() - start_time) * 1000)
            return AdapterResponse(text="", latency_ms=elapsed, success=False, error=str(exc))
