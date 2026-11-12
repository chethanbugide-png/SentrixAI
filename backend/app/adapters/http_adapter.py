"""HTTP API target adapter for testing real HTTP endpoints."""

from __future__ import annotations

import time
from typing import Optional

import httpx

from app.adapters.base import BaseAdapter, AdapterResponse


class HttpAdapter(BaseAdapter):
    """Adapter that sends prompts to an HTTP API endpoint."""

    def __init__(self, endpoint: str, headers: dict | None = None, timeout: float = 30.0):
        self.endpoint = endpoint
        self.headers = headers or {"Content-Type": "application/json"}
        self.timeout = timeout

    def is_available(self) -> bool:
        try:
            with httpx.Client(timeout=5.0) as client:
                resp = client.get(self.endpoint)
                return resp.status_code < 500
        except Exception:
            return False

    def send_prompt(self, prompt: str, context: dict | None = None) -> AdapterResponse:
        start = time.perf_counter()
        try:
            payload = {"prompt": prompt, "context": context or {}}
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(
                    self.endpoint,
                    json=payload,
                    headers=self.headers,
                )
                elapsed_ms = int((time.perf_counter() - start) * 1000)

                if resp.status_code == 200:
                    data = resp.json()
                    text = data.get("response", data.get("text", str(data)))
                    return AdapterResponse(text=text, latency_ms=elapsed_ms, success=True)
                else:
                    return AdapterResponse(
                        text="",
                        latency_ms=elapsed_ms,
                        success=False,
                        error=f"HTTP {resp.status_code}: {resp.text[:200]}",
                    )
        except httpx.TimeoutException:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            return AdapterResponse(text="", latency_ms=elapsed_ms, success=False, error="Request timed out")
        except Exception as exc:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            return AdapterResponse(text="", latency_ms=elapsed_ms, success=False, error=str(exc))
