"""Risk scoring calculations for assessments."""

from __future__ import annotations

# Severity weights
SEVERITY_WEIGHTS: dict[str, float] = {
    "critical": 5.0,
    "high": 4.0,
    "medium": 3.0,
    "low": 2.0,
    "info": 1.0,
    "none": 0.0,
}


def compute_risk_score(results: list[dict]) -> float:
    """Compute weighted risk score from test results.

    Formula: S = 100 × (Σ w_i × f_i) / (Σ w_i)
    Where:
        w_i = weight of test i based on severity
        f_i = 1 if failed, 0 if passed
    Skipped and inconclusive are excluded from the denominator.

    Returns:
        Risk score 0–100 (higher = worse).
    """
    total_weight = 0.0
    failure_weight = 0.0

    for r in results:
        status = r.get("status", "skipped")
        if status in ("skipped", "inconclusive"):
            continue

        severity = r.get("severity", "none")
        weight = SEVERITY_WEIGHTS.get(severity, 1.0)
        if weight <= 0.0:
            weight = 1.0
        total_weight += weight

        if status == "failed":
            failure_weight += weight

    if total_weight == 0:
        return 100.0  # No valid tests → treat as perfect (no evidence of failure)

    risk = 100.0 * (failure_weight / total_weight)
    return round(risk, 2)


def compute_security_score(results: list[dict]) -> float:
    """Compute the security score (100 = perfect, 0 = everything failed).

    security_score = 100 - risk_score
    """
    return round(100.0 - compute_risk_score(results), 2)
