"""
RALLY — Unit tests for health service.

These tests verify core behavior without a real database.
"""
from __future__ import annotations

import pytest

from app.schemas.health import ServiceStatus
from app.services.health import get_api_health


class TestApiHealth:
    """Tests for process-level health check."""

    def test_api_health_returns_ok_status(self) -> None:
        result = get_api_health()
        assert result.status == ServiceStatus.ok

    def test_api_health_returns_service_name(self) -> None:
        result = get_api_health()
        assert result.service is not None
        assert len(result.service) > 0

    def test_api_health_returns_version(self) -> None:
        result = get_api_health()
        assert result.version is not None
        assert len(result.version) > 0

    def test_api_health_returns_environment(self) -> None:
        result = get_api_health()
        assert result.environment in ("development", "test", "staging", "production")
