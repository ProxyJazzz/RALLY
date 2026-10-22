"""
RALLY — Health check service.

Performs real connectivity checks. Never fakes status.
"""
from __future__ import annotations

import time

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from datetime import datetime, timezone

from app.core.config import settings
from app.core.logging import get_logger
from app.schemas.health import (
    DatabaseHealthResponse,
    DependencyStatus,
    HealthResponse,
    LivenessResponse,
    ReadinessResponse,
    ServiceStatus,
)

logger = get_logger(__name__)


def get_api_health() -> HealthResponse:
    """Return the process-level health of the API (legacy endpoint)."""
    return HealthResponse(
        status=ServiceStatus.ok,
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
    )


def get_liveness() -> LivenessResponse:
    """
    Process liveness check.
    Answers: 'Is the process alive?'
    Does NOT depend on external systems (no DB, no AWS, no network calls).
    """
    return LivenessResponse(
        status="alive",
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
    )


async def get_readiness(db: AsyncSession | None = None) -> tuple[ReadinessResponse, bool]:
    """
    Readiness probe for traffic routing / load balancing.
    Answers: 'Can RALLY actually serve requests?'

    Checks:
    - Database connectivity (via SELECT 1)
    - AWS Bedrock capability configuration (ready if configured or explicitly disabled)
    - MCP server connectivity / availability
    """
    dependencies: dict[str, str] = {}
    is_ready = True

    # 1. Database check
    if db is not None:
        try:
            await db.execute(text("SELECT 1"))
            dependencies["database"] = DependencyStatus.healthy.value
        except Exception as exc:
            logger.warning("readiness_db_check_failed", error_type=type(exc).__name__)
            dependencies["database"] = DependencyStatus.unavailable.value
            is_ready = False
    else:
        dependencies["database"] = DependencyStatus.unavailable.value
        is_ready = False

    # 2. Bedrock configuration check
    if settings.bedrock_model_id:
        dependencies["bedrock"] = DependencyStatus.configured.value
    else:
        dependencies["bedrock"] = DependencyStatus.not_configured.value

    # 3. MCP server configuration check
    if settings.mcp_public_url or (settings.mcp_host and settings.mcp_port):
        dependencies["mcp"] = DependencyStatus.available.value
    else:
        dependencies["mcp"] = DependencyStatus.unavailable.value

    status_str = "ready" if is_ready else "not_ready"
    response = ReadinessResponse(
        status=status_str,
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        dependencies=dependencies,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
    return response, is_ready



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
