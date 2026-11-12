"""SENTRIX AI – FastAPI application entry point with unified React SPA serving."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import APP_NAME, APP_DESCRIPTION, APP_VERSION, CORS_ORIGINS
from app.database.connection import create_tables, SessionLocal
from app.database.seed import seed_if_empty

# Import routers
from app.api.health import router as health_router
from app.api.targets import router as targets_router
from app.api.assessments import router as assessments_router
from app.api.findings import router as findings_router
from app.api.reports import router as reports_router
from app.api.dashboard import router as dashboard_router
from app.api.playground import router as playground_router
from app.api.matrix import router as matrix_router
from app.api.remediation import router as remediation_router
from app.api.cli import router as cli_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    create_tables()
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    yield


# Ensure database tables exist
create_tables()

app = FastAPI(
    title=APP_NAME,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers under /api
app.include_router(health_router, prefix="/api")
app.include_router(targets_router, prefix="/api")
app.include_router(assessments_router, prefix="/api")
app.include_router(findings_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(playground_router, prefix="/api")
app.include_router(matrix_router, prefix="/api")
app.include_router(remediation_router, prefix="/api")
app.include_router(cli_router, prefix="/api")

# Locate compiled React frontend bundle
DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))

if os.path.exists(DIST_DIR):
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API endpoints
        if full_path.startswith("api/"):
            return None
        file_path = os.path.join(DIST_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
