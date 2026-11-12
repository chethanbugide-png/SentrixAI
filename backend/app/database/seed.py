"""Seed the database with demo data on first run."""

from __future__ import annotations

from datetime import datetime, timezone, timedelta

from sqlalchemy.orm import Session

from app.database.models import User, Target, Assessment, TestResult, Finding
from app.engine.runner import run_assessment as _run


def seed_if_empty(db: Session) -> None:
    """Create demo data only when the database has no targets."""
    if db.query(Target).count() > 0:
        return

    # ── Demo user ────────────────────────────────────────────────
    user = User(
        email="admin@sentrix.ai",
        username="admin",
        password_hash="pbkdf2:sha256:demo_hash_not_for_production",
        is_active=True,
    )
    db.add(user)
    db.flush()

    # ── Targets ──────────────────────────────────────────────────
    t_vuln = Target(
        name="Customer Support Bot (Vulnerable)",
        description="Simulated customer support chatbot configured with known vulnerabilities for testing purposes.",
        target_type="simulated_vulnerable",
        owner_id=user.id,
    )
    t_prot = Target(
        name="Customer Support Bot (Protected)",
        description="Simulated customer support chatbot with security hardening and safety controls enabled.",
        target_type="simulated_protected",
        owner_id=user.id,
    )
    t_doc = Target(
        name="Document Assistant (Vulnerable)",
        description="Simulated document assistant with weak safety controls – used for baseline comparison.",
        target_type="simulated_vulnerable",
        owner_id=user.id,
    )
    db.add_all([t_vuln, t_prot, t_doc])
    db.flush()

    # ── Generate test suite JSON if missing ──────────────────────
    from app.generators.test_cases import generate_default_suite
    generate_default_suite()

    # ── Run assessments against the first two targets ────────────
    a_vuln = Assessment(
        target_id=t_vuln.id,
        status="pending",
        test_profile="default",
    )
    db.add(a_vuln)
    db.flush()
    _run(db=db, assessment=a_vuln, target=t_vuln)

    a_prot = Assessment(
        target_id=t_prot.id,
        status="pending",
        test_profile="default",
    )
    db.add(a_prot)
    db.flush()
    _run(db=db, assessment=a_prot, target=t_prot)

    db.commit()
