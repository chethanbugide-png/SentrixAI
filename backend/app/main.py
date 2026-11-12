"""SENTRIX AI – FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    # Startup
    create_tables()
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    yield
    # Shutdown (nothing to do)


# Ensure database tables exist
create_tables()

app = FastAPI(
    title=APP_NAME,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
    lifespan=lifespan,
)

@app.get("/")
def root_status():
    """Root endpoint to confirm backend is healthy and direct users to docs or UI."""
    return {
        "status": "online",
        "service": APP_NAME,
        "version": APP_VERSION,
        "api_docs": "/docs",
        "health_check": "/api/health",
        "dashboard_stats": "/api/dashboard/stats",
        "frontend_url": "http://127.0.0.1:5173",
        "message": "Sentrix AI Backend Engine is operational."
    }

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
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
