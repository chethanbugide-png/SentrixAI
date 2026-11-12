"""Pydantic schemas for request/response models."""

from __future__ import annotations
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


# ── Health ──────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    uptime_seconds: float
    database: str = "connected"


# ── Target ──────────────────────────────────────────────────────────

class TargetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    target_type: str = Field(..., pattern=r"^(simulated_vulnerable|simulated_protected|http_api|local_model)$")
    endpoint: Optional[str] = None
    config_json: Optional[str] = None
    owner_id: Optional[int] = None


class TargetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_type: Optional[str] = None
    endpoint: Optional[str] = None
    config_json: Optional[str] = None
    is_active: Optional[bool] = None


class TargetResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    target_type: str
    endpoint: Optional[str]
    config_json: Optional[str]
    owner_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    is_active: bool

    model_config = {"from_attributes": True}


# ── Assessment ──────────────────────────────────────────────────────

class AssessmentCreate(BaseModel):
    target_id: int
    test_profile: str = "default"
    categories: Optional[list[str]] = None


class AssessmentSummary(BaseModel):
    id: int
    target_id: int
    target_name: Optional[str] = None
    status: str
    started_at: datetime
    completed_at: Optional[datetime]
    total_tests: int
    passed_tests: int
    failed_tests: int
    inconclusive_tests: int
    error_tests: int
    summary_score: Optional[float]
    test_profile: Optional[str]
    categories: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class AssessmentDetail(AssessmentSummary):
    test_results: list[TestResultResponse] = []
    findings: list[FindingResponse] = []


class AssessmentCompare(BaseModel):
    assessment_a: AssessmentSummary
    assessment_b: AssessmentSummary
    score_delta: Optional[float]
    new_findings: int
    resolved_findings: int
    category_comparison: dict[str, Any]


# ── Test Result ─────────────────────────────────────────────────────

class TestResultResponse(BaseModel):
    id: int
    assessment_id: int
    test_case_id: str
    category: str
    test_name: str
    input_prompt: str
    response: Optional[str]
    status: str
    severity: str
    confidence: float
    evidence: Optional[str]
    latency_ms: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Finding ─────────────────────────────────────────────────────────

class FindingResponse(BaseModel):
    id: int
    assessment_id: int
    category: str
    severity: str
    title: str
    description: Optional[str]
    evidence: Optional[str]
    remediation: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class FindingUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern=r"^(open|acknowledged|resolved|false_positive)$")


# ── Dashboard ───────────────────────────────────────────────────────

class RecentAssessment(BaseModel):
    id: int
    target_name: str
    status: str
    summary_score: Optional[float]
    started_at: datetime
    total_tests: int
    failed_tests: int


class DashboardStats(BaseModel):
    total_targets: int
    total_assessments: int
    total_findings: int
    high_severity_findings: int
    critical_findings: int
    recent_assessments: list[RecentAssessment]
    category_distribution: dict[str, int]
    risk_trend: list[dict[str, Any]]
    pass_rate: float
    fail_rate: float


# ── Test Case ───────────────────────────────────────────────────────

class TestCaseDefinition(BaseModel):
    __test__ = False
    id: str
    category: str
    name: str
    objective: str
    input: str
    expected_behavior: str
    severity_rationale: str
    evaluation_method: str
    metadata: dict[str, Any] = {}


# ── Detection ───────────────────────────────────────────────────────

class DetectionResult(BaseModel):
    vulnerability_detected: bool
    severity: str = "none"
    confidence: float = 0.0
    evidence: str = ""
    category: str = ""


# ── Report ──────────────────────────────────────────────────────────

class ReportRequest(BaseModel):
    format: str = "json"  # json or pdf
