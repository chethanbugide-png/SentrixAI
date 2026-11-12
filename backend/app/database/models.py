"""ORM models for all database tables."""

from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from app.database.connection import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=utcnow)
    is_active = Column(Boolean, default=True)

    targets = relationship("Target", back_populates="owner")


class Target(Base):
    __tablename__ = "targets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    target_type = Column(
        String(50), nullable=False
    )  # simulated_vulnerable, simulated_protected, http_api, local_model
    endpoint = Column(String(500), nullable=True)
    config_json = Column(Text, nullable=True)  # JSON config string
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    is_active = Column(Boolean, default=True)

    owner = relationship("User", back_populates="targets")
    assessments = relationship(
        "Assessment", back_populates="target", cascade="all, delete-orphan"
    )


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    target_id = Column(Integer, ForeignKey("targets.id"), nullable=False)
    status = Column(
        String(20), nullable=False, default="pending"
    )  # pending, running, completed, failed, cancelled
    started_at = Column(DateTime, default=utcnow)
    completed_at = Column(DateTime, nullable=True)
    total_tests = Column(Integer, default=0)
    passed_tests = Column(Integer, default=0)
    failed_tests = Column(Integer, default=0)
    inconclusive_tests = Column(Integer, default=0)
    error_tests = Column(Integer, default=0)
    summary_score = Column(Float, nullable=True)
    test_profile = Column(String(100), nullable=True, default="default")
    categories = Column(Text, nullable=True)  # JSON array of categories
    created_at = Column(DateTime, default=utcnow)

    target = relationship("Target", back_populates="assessments")
    test_results = relationship(
        "TestResult", back_populates="assessment", cascade="all, delete-orphan"
    )
    findings = relationship(
        "Finding", back_populates="assessment", cascade="all, delete-orphan"
    )


class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    test_case_id = Column(String(50), nullable=False)
    category = Column(String(50), nullable=False)
    test_name = Column(String(255), nullable=False)
    input_prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=True)
    status = Column(
        String(20), nullable=False
    )  # passed, failed, inconclusive, skipped, error
    severity = Column(
        String(20), nullable=False, default="none"
    )  # critical, high, medium, low, info, none
    confidence = Column(Float, default=0.0)
    evidence = Column(Text, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    assessment = relationship("Assessment", back_populates="test_results")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    category = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    evidence = Column(Text, nullable=True)
    remediation = Column(Text, nullable=True)
    status = Column(
        String(20), nullable=False, default="open"
    )  # open, acknowledged, resolved, false_positive
    created_at = Column(DateTime, default=utcnow)

    assessment = relationship("Assessment", back_populates="findings")
