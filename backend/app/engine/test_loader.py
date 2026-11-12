"""Load test case definitions from JSON files."""

from __future__ import annotations
import json
from pathlib import Path
from typing import Optional

from app.config import DEFAULT_SUITE_PATH
from app.models.schemas import TestCaseDefinition


def load_test_suite(
    path: Path | str | None = None,
    categories: list[str] | None = None,
) -> list[dict]:
    """Load test cases from a JSON file, optionally filtering by category.

    Args:
        path: Path to the test suite JSON file. Uses default if None.
        categories: If provided, only test cases in these categories are returned.

    Returns:
        List of test case dictionaries.
    """
    suite_path = Path(path) if path else DEFAULT_SUITE_PATH

    if not suite_path.exists():
        raise FileNotFoundError(f"Test suite not found: {suite_path}")

    with open(suite_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    test_cases: list[dict] = data.get("test_cases", data) if isinstance(data, dict) else data

    if categories:
        cat_lower = {c.lower() for c in categories}
        test_cases = [tc for tc in test_cases if tc.get("category", "").lower() in cat_lower]

    return test_cases


def get_available_categories(path: Path | str | None = None) -> list[str]:
    """Return a sorted list of unique categories in the test suite."""
    test_cases = load_test_suite(path)
    return sorted({tc.get("category", "unknown") for tc in test_cases})
