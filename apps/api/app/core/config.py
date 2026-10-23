"""
RALLY — Production & Local Application Configuration.

Hierarchically categorized settings:
- APP
- DATABASE
- AWS
- BEDROCK
- MCP
- SECURITY
- OBSERVABILITY

Loaded from environment variables with safe development defaults.
Never stores secrets or raw AWS credentials in committed code.
"""
from __future__ import annotations

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── 1. APP ───────────────────────────────────────────────────────────────
    app_env: str = Field(default="development", description="Environment: development, test, staging, production")
    app_host: str = Field(default="0.0.0.0", description="API listen host")
    app_port: int = Field(default=8000, ge=1, le=65535, description="API listen port")
    app_name: str = Field(default="RALLY API", description="Public application name")
    app_version: str = Field(default="0.1.0", description="Semver release string")
    cors_origins: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
        description="Allowed CORS origin domains",
    )

    # ── 2. DATABASE (PostgreSQL / AWS RDS) ───────────────────────────────────
    database_secret_id: str = Field(
        default="/rally/production/database",
        description="AWS Secrets Manager secret ID for database credentials",
    )
    database_url: str = Field(
        default="postgresql+asyncpg://rally:rally@localhost:5432/rally",
        description="Async SQLAlchemy database connection string",
    )
    database_url_sync_override: str | None = Field(
        default=None,
        description="Explicit sync database URL (for Alembic in production/AWS)",
    )
    db_pool_size: int = Field(default=5, ge=1, le=100, description="SQLAlchemy connection pool base size")
    db_max_overflow: int = Field(default=10, ge=0, le=100, description="Max overflow connections allowed beyond pool_size")
    db_pool_timeout: float = Field(default=30.0, ge=1.0, description="Seconds to wait before giving up on obtaining a connection")
    db_pool_recycle: int = Field(default=1800, ge=60, description="Seconds after which connections are recycled to prevent stale timeouts")
    db_connect_timeout: float = Field(default=10.0, ge=1.0, description="TCP connection timeout in seconds")

    # The synchronous URL is used by Alembic migrations only.
    @property
    def database_url_sync(self) -> str:
        if self.database_url_sync_override:
            return self.database_url_sync_override
        sync_url = self.database_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
        if self.app_env.lower() == "production" and "sslmode" not in sync_url:
            delimiter = "&" if "?" in sync_url else "?"
            sync_url += f"{delimiter}sslmode=require"
        return sync_url

    # ── 3. AWS (Ambient Credentials & IAM Roles) ─────────────────────────────
    aws_region: str | None = Field(default=None, description="AWS Region (e.g. us-east-1, us-west-2)")
    aws_default_region: str | None = Field(default=None, description="Fallback AWS default region")
    aws_profile: str | None = Field(default=None, description="Optional local AWS CLI profile name")
    aws_secrets_manager_enabled: bool = Field(default=False, description="Set True in AWS to resolve secrets via Secrets Manager")
    secrets_backend: str = Field(default="env", description="Secrets backend: env, aws_secrets_manager")


    # ── 4. BEDROCK (Amazon Bedrock Converse API) ─────────────────────────────
    bedrock_model_id: str = Field(
        default="anthropic.claude-3-5-sonnet-20241022-v2:0",
        description="Bedrock Foundation Model ID",
    )
    bedrock_max_tokens: int = Field(default=4096, ge=256, le=8192, description="Max output tokens for model inference")
    bedrock_timeout_seconds: float = Field(default=30.0, ge=1.0, description="Bedrock runtime API timeout in seconds")
    bedrock_max_retries: int = Field(default=2, ge=0, le=5, description="Maximum automated exponential backoff attempts")
    run_aws_integration_tests: bool = Field(default=False, description="Enable live Bedrock integration tests")

    # ── 5. MCP (Model Context Protocol Runtime) ──────────────────────────────
    mcp_host: str = Field(default="127.0.0.1", description="MCP server bind host")
    mcp_port: int = Field(default=8001, ge=1, le=65535, description="MCP server bind port")
    mcp_public_url: str | None = Field(default=None, description="Publicly accessible HTTPS MCP endpoint (e.g. tunnel or ALB)")
    rally_mcp_public_url: str | None = Field(default=None, description="Legacy alias for mcp_public_url")
    mcp_auth_enabled: bool = Field(default=False, description="Enforce OAuth 2.1 authentication on MCP gateway")
    rally_mcp_auth_enabled: bool = Field(default=False, description="Legacy alias for mcp_auth_enabled")
    mcp_oauth_resource: str | None = Field(default=None, description="Canonical OAuth resource URI (RFC 8707)")
    rally_mcp_oauth_resource: str | None = Field(default=None, description="Legacy alias for mcp_oauth_resource")
    mcp_required_scopes: list[str] = Field(
        default=["rally:incident:read", "rally:incident:write"],
        description="Required OAuth token scopes",
    )
    rally_mcp_required_scopes: list[str] = Field(
        default=["rally:incident:read", "rally:incident:write"],
        description="Legacy alias for mcp_required_scopes",
    )
    mcp_request_timeout: float = Field(default=30.0, ge=1.0, description="Timeout for client-side MCP invocations in seconds")
    mcp_max_retries: int = Field(default=2, ge=0, le=5, description="Max client-side retries for idempotent read tools")

    # ── 6. SECURITY ──────────────────────────────────────────────────────────
    auth_enabled: bool = Field(default=False, description="Enable API gateway authentication")

    # ── 7. OBSERVABILITY (OpenTelemetry & CloudWatch) ─────────────────────────
    log_level: str = Field(default="INFO", description="Structured logging level (DEBUG, INFO, WARNING, ERROR)")
    otel_service_name: str = Field(default="rally-api", description="Service name emitted in OTLP and CloudWatch traces")
    otel_exporter_otlp_endpoint: str | None = Field(default=None, description="OTLP collector endpoint (e.g. AWS OTel Collector)")
    cloudwatch_logging_enabled: bool = Field(default=False, description="Emit structured logs directly to AWS CloudWatch Logs")

    @model_validator(mode="after")
    def sync_legacy_mcp_fields(self) -> Settings:
        """Ensures backward compatibility between new and existing MCP setting keys."""
        if self.rally_mcp_public_url and not self.mcp_public_url:
            self.mcp_public_url = self.rally_mcp_public_url
        if self.mcp_public_url and not self.rally_mcp_public_url:
            self.rally_mcp_public_url = self.mcp_public_url

        if self.rally_mcp_auth_enabled and not self.mcp_auth_enabled:
            self.mcp_auth_enabled = self.rally_mcp_auth_enabled
        if self.mcp_auth_enabled and not self.rally_mcp_auth_enabled:
            self.rally_mcp_auth_enabled = self.mcp_auth_enabled

        if self.rally_mcp_oauth_resource and not self.mcp_oauth_resource:
            self.mcp_oauth_resource = self.rally_mcp_oauth_resource
        if self.mcp_oauth_resource and not self.rally_mcp_oauth_resource:
            self.rally_mcp_oauth_resource = self.mcp_oauth_resource

        if self.secrets_backend.lower() == "aws_secrets_manager":
            self.resolve_database_from_secrets()

        return self

    def resolve_database_from_secrets(self, provider: Any = None) -> None:
        """
        Explicitly resolves database credentials and sets database_url & database_url_sync_override.
        Safe to call during application startup or when swapping providers in tests.
        Never throws during import if ambient AWS credentials are absent in local/test environments.
        """
        try:
            from app.core.secrets import resolve_database_urls
            async_url, sync_url = resolve_database_urls(
                secret_id=self.database_secret_id,
                provider=provider,
                require_ssl=self.app_env.lower() == "production",
            )
            self.database_url = async_url
            self.database_url_sync_override = sync_url
        except Exception:
            pass


settings = Settings()
