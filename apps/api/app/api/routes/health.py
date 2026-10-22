"""
RALLY — Health check routes.

GET /health         — API process liveness
GET /health/database — Real database connectivity check
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.health import (
    DatabaseHealthResponse,
    HealthResponse,
    LivenessResponse,
    ReadinessResponse,
    ServiceStatus,
)
from app.services.health import (
    get_api_health,
    get_database_health,
    get_liveness,
    get_readiness,
)

router = APIRouter(tags=["health"])



@router.get(
    "/health",
    response_model=HealthResponse,
    summary="API liveness check (legacy)",
    description="Verifies that the RALLY API process is alive and ready to serve requests.",
)
async def health() -> HealthResponse:
    return get_api_health()


@router.get(
    "/liveness",
    response_model=LivenessResponse,
    summary="Process liveness check",
    description="Answers: Is the process alive? Returns immediately without testing external dependencies.",
)
async def liveness() -> LivenessResponse:
    return get_liveness()


@router.get(
    "/readiness",
    response_model=ReadinessResponse,
    summary="Service readiness check",
    description="Answers: Can RALLY actually serve requests? Validates DB and critical dependencies. Returns 503 if not ready.",
)
async def readiness(db: AsyncSession = Depends(get_db)) -> ReadinessResponse:
    from fastapi.responses import JSONResponse
    result, is_ready = await get_readiness(db)
    if not is_ready:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=result.model_dump(),
        )
    return result


@router.get(
    "/health/database",
    response_model=DatabaseHealthResponse,
    summary="Database connectivity check",
    description="Performs a real SELECT 1 against PostgreSQL. Returns 503 if unreachable.",
)
async def health_database(db: AsyncSession = Depends(get_db)) -> DatabaseHealthResponse:
    result = await get_database_health(db)
    # Return 503 when the database is not reachable so callers can distinguish.
    if result.status == ServiceStatus.unavailable:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=result.model_dump(exclude_none=True),
        )
    return result
