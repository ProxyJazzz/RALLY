"""
RALLY — Application configuration.

Loaded from environment variables. Never stores secrets in code.
"""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────────────
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_name: str = "RALLY API"
    app_version: str = "0.1.0"

    # ── Database ─────────────────────────────────────────────────────────────
    database_url: str = "postgresql+asyncpg://rally:rally@localhost:5432/rally"

    # The synchronous URL is used by Alembic only.
    @property
    def database_url_sync(self) -> str:
        return self.database_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")

    # ── Logging ──────────────────────────────────────────────────────────────
    log_level: str = "INFO"

    # ── CORS ─────────────────────────────────────────────────────────────────
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # ── AWS / Bedrock (Phase 7) ──────────────────────────────────────────────
    aws_region: str | None = None
    aws_default_region: str | None = None
    bedrock_model_id: str = "anthropic.claude-3-5-sonnet-20241022-v2:0"
    bedrock_max_tokens: int = 4096
    bedrock_timeout_seconds: float = 30.0
    bedrock_max_retries: int = 2
    run_aws_integration_tests: bool = False


settings = Settings()
