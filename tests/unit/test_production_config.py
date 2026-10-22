"""
Tests for RALLY Phase 10A centralized configuration.
Verifies defaults, environment variable overrides, and production settings.
"""
from __future__ import annotations

import os
import pytest
from app.core.config import Settings


def test_default_development_settings(monkeypatch):
    """Verify standard settings."""
    monkeypatch.delenv("APP_ENV", raising=False)
    s = Settings()
    assert s.app_env in ("development", "test")
    assert s.app_port == 8000
    assert s.db_pool_size == 5
    assert s.db_max_overflow == 10
    assert s.db_pool_timeout == 30.0
    assert s.db_pool_recycle == 1800
    assert s.db_connect_timeout == 10.0
    assert s.secrets_backend == "env"
    assert s.auth_enabled is False
    assert s.mcp_host == "127.0.0.1"
    assert s.mcp_port == 8001


def test_environment_variable_overrides(monkeypatch):
    """Verify that environment variables properly override settings."""
    monkeypatch.setenv("APP_ENV", "staging")
    monkeypatch.setenv("APP_PORT", "9000")
    monkeypatch.setenv("DB_POOL_SIZE", "25")
    monkeypatch.setenv("DB_MAX_OVERFLOW", "50")
    monkeypatch.setenv("SECRETS_BACKEND", "aws_secrets_manager")
    monkeypatch.setenv("AUTH_ENABLED", "true")
    monkeypatch.setenv("MCP_PORT", "8080")

    s = Settings()
    assert s.app_env == "staging"
    assert s.app_port == 9000
    assert s.db_pool_size == 25
    assert s.db_max_overflow == 50
    assert s.secrets_backend == "aws_secrets_manager"
    assert s.auth_enabled is True
    assert s.mcp_port == 8080


def test_cors_origins_parsing(monkeypatch):
    """Verify CORS origins JSON array parses to list properly."""
    monkeypatch.setenv("CORS_ORIGINS", '["http://localhost:3000", "https://app.rally.io"]')
    s = Settings()
    assert "http://localhost:3000" in s.cors_origins
    assert "https://app.rally.io" in s.cors_origins

