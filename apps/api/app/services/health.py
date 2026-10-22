"""
RALLY — Health check service.

Performs real connectivity checks. Never fakes status.
"""
from __future__ import annotations

import time

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.schemas.health import DatabaseHealthResponse, HealthResponse, ServiceStatus

logger = get_logger(__name__)


def get_api_health() -> HealthResponse:
    """Return the process-level health of the API."""
    return HealthResponse(
        status=ServiceStatus.ok,
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
    )


async def get_database_health(db: AsyncSession) -> DatabaseHealthResponse:
    """
    Perform a real database connectivity check.

    Returns ServiceStatus.unavailable with error context on failure.
    Never fabricates a healthy status.
    """
    start = time.monotonic()
    try:
        await db.execute(text("SELECT 1"))
        latency_ms = round((time.monotonic() - start) * 1000, 2)
        logger.info("database_health_check", status="ok", latency_ms=latency_ms)
        return DatabaseHealthResponse(
            status=ServiceStatus.ok,
            service=settings.app_name,
            version=settings.app_version,
            environment=settings.app_env,
            database="postgresql",
            latency_ms=latency_ms,
        )
    except Exception as exc:
        latency_ms = round((time.monotonic() - start) * 1000, 2)
        # Log the error for observability but never expose internals to the client.
        logger.error("database_health_check_failed", error_type=type(exc).__name__)
        return DatabaseHealthResponse(
            status=ServiceStatus.unavailable,
            service=settings.app_name,
            version=settings.app_version,
            environment=settings.app_env,
            database="postgresql",
            latency_ms=latency_ms,
            error="Database connectivity check failed.",
        )
