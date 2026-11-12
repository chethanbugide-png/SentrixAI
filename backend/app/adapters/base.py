"""Abstract base class for target adapters."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class AdapterResponse:
    """Response from a target adapter."""

    text: str
    latency_ms: int
    success: bool
    error: Optional[str] = None


class BaseAdapter(ABC):
    """Base class for all target adapters."""

    @abstractmethod
    def send_prompt(self, prompt: str, context: dict | None = None) -> AdapterResponse:
        """Send a prompt to the target and return the response."""
        ...

    @abstractmethod
    def is_available(self) -> bool:
        """Check whether the target is reachable."""
        ...
