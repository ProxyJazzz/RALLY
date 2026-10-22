"""
RALLY — Unit tests for application configuration.
"""
from __future__ import annotations

import pytest
from app.core.config import settings


class TestSettings:
    """Verify configuration defaults are sane."""

    def test_database_url_not_empty(self) -> None:
        assert settings.database_url
        assert len(settings.database_url) > 0

    def test_database_url_uses_asyncpg_driver(self) -> None:
        assert "postgresql+asyncpg" in settings.database_url

    def test_database_url_sync_uses_psycopg2_driver(self) -> None:
        assert "postgresql+psycopg2" in settings.database_url_sync

    def test_app_port_is_valid(self) -> None:
        assert 1 <= settings.app_port <= 65535

    def test_log_level_is_valid(self) -> None:
        import logging
        assert hasattr(logging, settings.log_level.upper())

    def test_cors_origins_is_list(self) -> None:
        assert isinstance(settings.cors_origins, list)
        assert len(settings.cors_origins) > 0
