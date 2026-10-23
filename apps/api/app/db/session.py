"""
RALLY — Async database session management.

SQLAlchemy async engine + session factory with production-safe pool parameters.
Schema is managed exclusively through Alembic migrations.
"""
from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""


connect_args: dict[str, Any] = {}
if "asyncpg" in settings.database_url:
    connect_args["command_timeout"] = settings.db_connect_timeout
    connect_args["timeout"] = settings.db_connect_timeout
    # Enforce SSL for AWS RDS in production or when connecting to RDS endpoints
    if settings.app_env.lower() == "production" or "rds.amazonaws.com" in settings.database_url:
        connect_args["ssl"] = "require"

engine = create_async_engine(
    settings.database_url,
    echo=settings.app_env == "development",
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_timeout=settings.db_pool_timeout,
    pool_recycle=settings.db_pool_recycle,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields an async database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
