"""Abstract base class for all detectors."""

from abc import ABC, abstractmethod
from app.models.schemas import DetectionResult


class BaseDetector(ABC):
    """Base detector that all category detectors inherit from."""

    @abstractmethod
    def detect(
        self,
        response: str,
        test_case: dict,
        target_config: dict | None = None,
    ) -> DetectionResult:
        """Analyze the response for vulnerabilities.

        Args:
            response: The text response from the target.
            test_case: The test case definition dictionary.
            target_config: Optional target configuration.

        Returns:
            DetectionResult with findings.
        """
        ...
