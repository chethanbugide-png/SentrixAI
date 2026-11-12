"""Health check endpoint."""

import time
from fastapi import APIRouter
from app.config import APP_VERSION, APP_NAME
from app.models.schemas import HealthResponse

router = APIRouter(tags=["Health"])

_start_time = time.time()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        version=APP_VERSION,
        uptime_seconds=round(time.time() - _start_time, 2),
        database="connected",
    )
