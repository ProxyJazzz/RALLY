"""
RALLY — Integration tests for health check API routes.

Tests verify real route behavior against the FastAPI app (no live database required
for the /health endpoint; /health/database tests cover connectivity failure path).
"""
from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.mark.anyio
async def test_health_returns_200() -> None:
    """GET /health must return HTTP 200."""
    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
        response = await ac.get("/health")

    assert response.status_code == 200


@pytest.mark.anyio
async def test_health_response_schema() -> None:
    """GET /health response must include status, service, version, environment."""
    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
        response = await ac.get("/health")

    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data
    assert "version" in data
    assert "environment" in data


@pytest.mark.anyio
async def test_health_response_has_no_secrets() -> None:
    """Ensure health endpoint never leaks database URL or credentials."""
    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
        response = await ac.get("/health")

    body = response.text
    assert "password" not in body.lower()
    assert "postgresql" not in body.lower()
    assert "secret" not in body.lower()
    assert "DATABASE_URL" not in body


@pytest.mark.anyio
async def test_health_database_returns_json() -> None:
    """
    GET /health/database must return a JSON response.
    It may return 200 (connected) or 503 (no database in test env).
    The response schema must be consistent in both cases.
    """
    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
        response = await ac.get("/health/database")

    assert response.status_code in (200, 503)
    data = response.json()
    assert "status" in data
    assert data["status"] in ("ok", "degraded", "unavailable")
    assert "service" in data
    assert "database" in data


@pytest.mark.anyio
async def test_unknown_route_returns_404() -> None:
    """Non-existent routes must return 404."""
    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
        response = await ac.get("/does-not-exist")

    assert response.status_code == 404


@pytest.mark.anyio
async def test_request_id_header_returned() -> None:
    """Responses must include an x-request-id header."""
    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
        response = await ac.get("/health")

    assert "x-request-id" in response.headers
