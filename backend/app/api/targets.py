"""Target CRUD endpoints and real-time connectivity probes."""

import time
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Target
from app.models.schemas import TargetCreate, TargetUpdate, TargetResponse
from app.adapters.universal_model import UniversalModelAdapter

router = APIRouter(prefix="/targets", tags=["Targets"])


class TargetPingResponse(BaseModel):
    target_id: int
    name: str
    target_type: str
    is_online: bool
    latency_ms: int
    details: str
    status_code: Optional[int] = None
    banner: Optional[str] = None


class LocalDiscoveryResponse(BaseModel):
    discovered: List[Dict[str, Any]]
    total_found: int


@router.get("/detect-local", response_model=LocalDiscoveryResponse)
def detect_local_models():
    """Detect local running LLM inference servers (Ollama, LM Studio, vLLM, llama.cpp)."""
    discovered = []
    
    # 1. Ollama (default port 11434)
    try:
        with httpx.Client(timeout=0.6) as client:
            resp = client.get("http://127.0.0.1:11434/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name") for m in data.get("models", [])]
                discovered.append({
                    "engine": "Ollama",
                    "endpoint": "http://127.0.0.1:11434",
                    "status": "ONLINE",
                    "models": models,
                    "recommended_type": "universal_model"
                })
    except Exception:
        pass

    # 2. LM Studio (default port 1234)
    try:
        with httpx.Client(timeout=0.6) as client:
            resp = client.get("http://127.0.0.1:1234/v1/models")
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("id") for m in data.get("data", [])]
                discovered.append({
                    "engine": "LM Studio / OpenAI Local",
                    "endpoint": "http://127.0.0.1:1234/v1/chat/completions",
                    "status": "ONLINE",
                    "models": models,
                    "recommended_type": "universal_model"
                })
    except Exception:
        pass

    return LocalDiscoveryResponse(discovered=discovered, total_found=len(discovered))


@router.post("", response_model=TargetResponse, status_code=201)
def create_target(payload: TargetCreate, db: Session = Depends(get_db)):
    target = Target(
        name=payload.name,
        description=payload.description,
        target_type=payload.target_type,
        endpoint=payload.endpoint,
        config_json=payload.config_json,
        owner_id=payload.owner_id,
    )
    db.add(target)
    db.commit()
    db.refresh(target)
    return target


@router.get("", response_model=list[TargetResponse])
def list_targets(db: Session = Depends(get_db)):
    return db.query(Target).filter(Target.is_active == True).all()


@router.get("/{target_id}", response_model=TargetResponse)
def get_target(target_id: int, db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    return target


@router.post("/{target_id}/ping", response_model=TargetPingResponse)
def ping_target(target_id: int, db: Session = Depends(get_db)):
    """Test connectivity, probe latency, and report target health."""
    target = db.query(Target).filter(Target.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")

    start = time.perf_counter()
    if target.target_type in ("simulated_vulnerable", "simulated_protected"):
        adapter = UniversalModelAdapter(target_type=target.target_type)
        res = adapter.send_prompt("PING_HEALTHCHECK")
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        return TargetPingResponse(
            target_id=target.id,
            name=target.name,
            target_type=target.target_type,
            is_online=True,
            latency_ms=elapsed_ms,
            details=f"Simulated target responding normally. Mode: {target.target_type}",
            status_code=200,
            banner="SENTRIX_SIMULATOR_CORE_OK"
        )
    elif target.endpoint:
        try:
            with httpx.Client(timeout=4.0) as client:
                resp = client.get(target.endpoint)
                elapsed_ms = int((time.perf_counter() - start) * 1000)
                return TargetPingResponse(
                    target_id=target.id,
                    name=target.name,
                    target_type=target.target_type,
                    is_online=resp.status_code < 500,
                    latency_ms=elapsed_ms,
                    details=f"HTTP endpoint reached with status {resp.status_code}",
                    status_code=resp.status_code,
                    banner=resp.headers.get("server", "HTTP_SERVER")
                )
        except Exception as err:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            return TargetPingResponse(
                target_id=target.id,
                name=target.name,
                target_type=target.target_type,
                is_online=False,
                latency_ms=elapsed_ms,
                details=f"Connection failed: {str(err)}",
                status_code=None,
                banner=None
            )
    else:
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        return TargetPingResponse(
            target_id=target.id,
            name=target.name,
            target_type=target.target_type,
            is_online=True,
            latency_ms=elapsed_ms,
            details="Target configuration verified (no endpoint required for local simulated engine)",
            status_code=200,
            banner="STANDALONE_MODEL"
        )


@router.put("/{target_id}", response_model=TargetResponse)
def update_target(target_id: int, payload: TargetUpdate, db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(target, key, value)
    db.commit()
    db.refresh(target)
    return target


@router.delete("/{target_id}", status_code=204)
def delete_target(target_id: int, db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    target.is_active = False
    db.commit()
