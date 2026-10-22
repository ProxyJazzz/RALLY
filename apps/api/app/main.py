"""
RALLY — FastAPI application entry point.

Bootstraps the application: logging, middleware, routes, error handlers.
"""
from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health as health_router
from app.core.config import settings
from app.core.errors import RallyError, rally_error_handler, unhandled_error_handler
from app.core.logging import configure_logging, get_logger

configure_logging(settings.log_level)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:  # noqa: ARG001
    logger.info(
        "rally_api_started",
        env=settings.app_env,
        version=settings.app_version,
        host=settings.app_host,
        port=settings.app_port,
    )
    yield
    logger.info("rally_api_shutdown")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="RALLY — Agentic Reliability & Response Orchestration",
        docs_url="/docs" if settings.app_env != "production" else None,
        redoc_url="/redoc" if settings.app_env != "production" else None,
        lifespan=lifespan,
    )

    # ── CORS ────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # ── Request ID middleware ────────────────────────────────────────────────
    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):  # type: ignore[no-untyped-def]
        request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)
        response = await call_next(request)
        response.headers["x-request-id"] = request_id
        return response

    # ── Error handlers ───────────────────────────────────────────────────────
    app.add_exception_handler(RallyError, rally_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, unhandled_error_handler)

    # ── Routers ──────────────────────────────────────────────────────────────
    app.include_router(health_router.router)
    from app.api.routes import alexa_simulation as alexa_router
    app.include_router(alexa_router.router)

    return app


app = create_app()
