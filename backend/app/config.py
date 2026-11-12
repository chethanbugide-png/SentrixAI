"""Application configuration and settings."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend directory
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Database
DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'sentrix.db'}")

# Security
SECRET_KEY: str = os.getenv("SECRET_KEY", "sentrix-dev-secret-key-change-in-prod")

# Debug
DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("true", "1", "yes")

# CORS
CORS_ORIGINS: list[str] = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000"
).split(",")

# App info
APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
APP_NAME: str = "SENTRIX AI"
APP_DESCRIPTION: str = "Intelligent AI Vulnerability Discovery & Assessment Platform"

# Test cases path
TEST_CASES_DIR: Path = BASE_DIR / "test_cases"
DEFAULT_SUITE_PATH: Path = TEST_CASES_DIR / "default_suite.json"
