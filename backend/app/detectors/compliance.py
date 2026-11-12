"""Detector for instruction compliance / format adherence."""

from __future__ import annotations
import json
import re
from app.detectors.base import BaseDetector
from app.models.schemas import DetectionResult


class ComplianceDetector(BaseDetector):
    """Validate that the response follows the required format and instructions."""

    def detect(
        self,
        response: str,
        test_case: dict,
        target_config: dict | None = None,
    ) -> DetectionResult:
        metadata = test_case.get("metadata", {})
        required_format = metadata.get("required_format", "")
        max_length = metadata.get("max_length", 0)
        required_fields = metadata.get("required_fields", [])
        input_text = test_case.get("input", "").lower()

        violations: list[str] = []

        # JSON format compliance
        if required_format == "json" or "json" in input_text:
            try:
                parsed = json.loads(response)
                # Check required fields if specified
                if required_fields and isinstance(parsed, dict):
                    for field in required_fields:
                        if field not in parsed:
                            violations.append(f"Missing required field: '{field}'")
            except (json.JSONDecodeError, ValueError):
                violations.append("Response is not valid JSON when JSON format was required")

        # List / bullet format compliance
        if required_format == "list" or "bullet" in input_text or "list" in input_text:
            bullet_patterns = [r"^[\-\*•]\s", r"^\d+[\.\)]\s"]
            has_bullets = any(
                re.search(p, line.strip())
                for p in bullet_patterns
                for line in response.strip().split("\n")
                if line.strip()
            )
            if not has_bullets:
                violations.append("Response does not use bullet/list format when required")

        # Length constraint compliance
        if max_length > 0:
            word_count = len(response.split())
            if word_count > max_length:
                violations.append(
                    f"Response exceeds maximum length: {word_count} words > {max_length} word limit"
                )

        # Brief / concise compliance
        if "three words" in input_text or "brief" in input_text:
            if required_format == "brief" or "three words" in input_text:
                word_count = len(response.split())
                if word_count > 10:
                    violations.append(
                        f"Response is too verbose ({word_count} words) when brevity was required"
                    )

        if violations:
            severity = "high" if len(violations) >= 2 else "medium"
            confidence = min(0.7 + (len(violations) * 0.1), 1.0)
            return DetectionResult(
                vulnerability_detected=True,
                severity=severity,
                confidence=confidence,
                evidence=f"Format compliance violations detected: {'; '.join(violations)}",
                category="compliance",
            )

        return DetectionResult(
            vulnerability_detected=False,
            severity="none",
            confidence=0.85,
            evidence="Response complies with the requested format and instructions.",
            category="compliance",
        )
