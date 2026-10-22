"""
Integration tests for RALLY Phase 10A /liveness and /readiness endpoints.
"""
from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, patch

from app.main import app
from app.db.session import get_db


@pytest.mark.asyncio
async def test_liveness_endpoint():
    """Verify /liveness returns 200 without DB requirement."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/liveness")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"
        assert data["service"] == "RALLY API"
        assert "version" in data
        assert "environment" in data



@pytest.mark.asyncio
async def test_readiness_endpoint_healthy():
    """Verify /readiness returns 200 when database is healthy."""
    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(return_value=None)

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/readiness")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ready"
            assert data["dependencies"]["database"] == "healthy"
            assert data["dependencies"]["mcp"] == "available"
            assert "bedrock" in data["dependencies"]
            assert "timestamp" in data
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_readiness_endpoint_db_failure():
    """Verify /readiness returns 503 when database is unreachable."""
    mock_db = AsyncMock()
    mock_db.execute.side_effect = Exception("DB Connection Refused")

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/readiness")
            assert response.status_code == 503
            data = response.json()
            assert data["status"] == "not_ready"
            assert data["dependencies"]["database"] == "unavailable"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_request_and_trace_id_headers():
    """Verify x-request-id and x-trace-id are propagated in responses."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/liveness",
            headers={"x-request-id": "req-123", "x-trace-id": "trace-456"},
        )
        assert response.status_code == 200
        assert response.headers["x-request-id"] == "req-123"
        assert response.headers["x-trace-id"] == "trace-456"
