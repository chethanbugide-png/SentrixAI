"""Assessment runner – orchestrates test execution against a target."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.adapters.base import BaseAdapter
from app.adapters.universal_model import UniversalModelAdapter
from app.adapters.simulated import SimulatedTarget
from app.adapters.http_adapter import HttpAdapter
from app.database.models import Assessment, TestResult, Finding, Target
from app.detectors.secret_exposure import SecretExposureDetector
from app.detectors.prompt_injection import PromptInjectionDetector
from app.detectors.hallucination import HallucinationDetector
from app.detectors.compliance import ComplianceDetector
from app.detectors.unsafe_output import UnsafeOutputDetector
from app.detectors.robustness import RobustnessDetector
from app.engine.test_loader import load_test_suite
from app.engine.scorer import compute_security_score

# Map category names to detector instances
DETECTORS = {
    "secret_exposure": SecretExposureDetector(),
    "prompt_injection": PromptInjectionDetector(),
    "hallucination": HallucinationDetector(),
    "compliance": ComplianceDetector(),
    "unsafe_output": UnsafeOutputDetector(),
    "robustness": RobustnessDetector(),
}

# Remediation templates per category
REMEDIATIONS = {
    "secret_exposure": (
        "Implement output filtering to prevent credential leakage. "
        "Use secrets management and never include secrets in prompts or system instructions. "
        "Add post-processing checks to redact sensitive patterns before returning responses."
    ),
    "prompt_injection": (
        "Implement robust input validation and instruction hierarchy. "
        "Use delimiters to clearly separate system instructions from user input. "
        "Apply prompt hardening techniques and test with adversarial inputs regularly."
    ),
    "hallucination": (
        "Implement retrieval-augmented generation (RAG) for factual queries. "
        "Add confidence calibration and uncertainty quantification. "
        "Instruct the model to cite sources and say 'I don't know' when unsure."
    ),
    "compliance": (
        "Add output validation / schema enforcement before returning responses. "
        "Implement structured output modes (e.g., function calling, JSON mode). "
        "Use explicit format instructions in the system prompt with examples."
    ),
    "unsafe_output": (
        "Implement content safety filters on both input and output. "
        "Use a moderation API or classifier to screen responses. "
        "Add guardrails to prevent generation of harmful, discriminatory, or dangerous content."
    ),
    "robustness": (
        "Ensure consistent behavior by grounding responses in retrieved knowledge. "
        "Implement deterministic settings (low temperature) for factual queries. "
        "Add response caching for semantically similar queries."
    ),
}


def _build_adapter(target: Target) -> BaseAdapter:
    """Create the appropriate adapter for the target type."""
    cfg = {}
    if target.config_json:
        try:
            cfg = json.loads(target.config_json)
        except json.JSONDecodeError:
            pass

    return UniversalModelAdapter(
        target_type=target.target_type,
        endpoint=target.endpoint,
        config=cfg,
    )


build_adapter = _build_adapter


def run_assessment(
    db: Session,
    assessment: Assessment,
    target: Target,
    categories: list[str] | None = None,
) -> Assessment:
    """Execute a full assessment against the given target.

    Steps:
      1. Load test cases (optionally filtered by category)
      2. For each test case, send input to target adapter
      3. Run appropriate detector on response
      4. Store TestResult
      5. Create Findings for failures
      6. Update Assessment totals and score
    """
    assessment.status = "running"
    assessment.started_at = datetime.now(timezone.utc)
    db.commit()

    adapter = _build_adapter(target)

    try:
        test_cases = load_test_suite(categories=categories)
    except FileNotFoundError:
        assessment.status = "failed"
        db.commit()
        return assessment

    passed = 0
    failed = 0
    inconclusive = 0
    error_count = 0
    result_dicts: list[dict] = []

    # For robustness tests, we may need to track first responses
    robustness_references: dict[str, str] = {}

    for tc in test_cases:
        tc_id = tc.get("id", "UNKNOWN")
        category = tc.get("category", "unknown")
        test_name = tc.get("name", "Unnamed Test")
        input_prompt = tc.get("input", "")
        metadata = tc.get("metadata", {})

        # Prepare context for the adapter
        context = {"category": category, "metadata": metadata}

        # For robustness variant tests, set variant_index and reference
        if category == "robustness":
            variant_group = metadata.get("variant_group", "")
            variant_index = metadata.get("variant_index", 0)
            context["metadata"]["variant_index"] = variant_index
            if variant_group and variant_group in robustness_references:
                metadata["reference_response"] = robustness_references[variant_group]

        # Send prompt to target
        adapter_resp = adapter.send_prompt(input_prompt, context=context)

        if not adapter_resp.success:
            # Target error
            tr = TestResult(
                assessment_id=assessment.id,
                test_case_id=tc_id,
                category=category,
                test_name=test_name,
                input_prompt=input_prompt,
                response=adapter_resp.error or "",
                status="error",
                severity="none",
                confidence=0.0,
                evidence=f"Adapter error: {adapter_resp.error}",
                latency_ms=adapter_resp.latency_ms,
            )
            db.add(tr)
            error_count += 1
            result_dicts.append({"status": "error", "severity": "none"})
            continue

        response_text = adapter_resp.text

        # Store robustness reference for first variant
        if category == "robustness":
            variant_group = metadata.get("variant_group", "")
            if variant_group and variant_group not in robustness_references:
                robustness_references[variant_group] = response_text

        # Run detector
        detector = DETECTORS.get(category)
        if detector is None:
            # Unknown category – mark inconclusive
            tr = TestResult(
                assessment_id=assessment.id,
                test_case_id=tc_id,
                category=category,
                test_name=test_name,
                input_prompt=input_prompt,
                response=response_text,
                status="inconclusive",
                severity="none",
                confidence=0.0,
                evidence="No detector available for this category.",
                latency_ms=adapter_resp.latency_ms,
            )
            db.add(tr)
            inconclusive += 1
            result_dicts.append({"status": "inconclusive", "severity": "none"})
            continue

        detection = detector.detect(response_text, tc, target_config=None)

        if detection.vulnerability_detected:
            status = "failed"
            severity = detection.severity
            failed += 1
        else:
            status = "passed"
            severity = "none"
            passed += 1

        tr = TestResult(
            assessment_id=assessment.id,
            test_case_id=tc_id,
            category=category,
            test_name=test_name,
            input_prompt=input_prompt,
            response=response_text,
            status=status,
            severity=severity,
            confidence=detection.confidence,
            evidence=detection.evidence,
            latency_ms=adapter_resp.latency_ms,
        )
        db.add(tr)
        result_dicts.append({"status": status, "severity": severity})

        # Create Finding for failures
        if detection.vulnerability_detected:
            severity_label = detection.severity.upper()
            finding = Finding(
                assessment_id=assessment.id,
                category=category,
                severity=detection.severity,
                title=f"[{severity_label}] {test_name}",
                description=(
                    f"Test '{tc_id}' detected a {category} vulnerability.\n"
                    f"Objective: {tc.get('objective', 'N/A')}\n"
                    f"Severity rationale: {tc.get('severity_rationale', 'N/A')}"
                ),
                evidence=detection.evidence,
                remediation=REMEDIATIONS.get(category, "Review and address the identified vulnerability."),
                status="open",
            )
            db.add(finding)

    # Update assessment totals
    total = passed + failed + inconclusive + error_count
    assessment.total_tests = total
    assessment.passed_tests = passed
    assessment.failed_tests = failed
    assessment.inconclusive_tests = inconclusive
    assessment.error_tests = error_count
    assessment.summary_score = compute_security_score(result_dicts)
    assessment.status = "completed"
    assessment.completed_at = datetime.now(timezone.utc)
    if categories:
        assessment.categories = json.dumps(categories)

    db.commit()
    db.refresh(assessment)
    return assessment
