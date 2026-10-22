# RALLY — Phase 10A Production Foundation

This document defines the production readiness architecture, configuration model, secrets management, database pooling, and deployment procedures for **RALLY — Agentic Reliability & Response Orchestration**.

---

## 1. Architecture Overview

RALLY bridges agentic AI orchestration (Bedrock Converse, MCP, Strands) with mission-critical incident mitigation. Phase 10A establishes the foundation for AWS deployment without disturbing the local deterministic developer/demo workflow.

```text
                    ┌──────────────────────────┐
                    │       React Frontend     │ (Vite / S3 + CloudFront)
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │       FastAPI API        │ (ECS / App Runner)
                    │                          │
                    │ Incident / Agent / MCP   │
                    │ Governance / Execution   │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
       PostgreSQL/RDS       Amazon Bedrock       MCP Server
     (SQLAlchemy Async)   (Converse / Strands) (Streamable HTTP)
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 │
                                 ▼
                         Observability Layer
                    CloudWatch / OpenTelemetry
```

---

## 2. Configuration & Secrets Hierarchy

Configuration is managed centrally via `app.core.config.Settings` (built on `pydantic-settings`).

### Configuration Categories

1. **APP**: `APP_ENV`, `APP_HOST`, `APP_PORT`, `APP_NAME`, `APP_VERSION`, `CORS_ORIGINS`
2. **DATABASE**: `DATABASE_URL`, `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, `DB_POOL_TIMEOUT`, `DB_POOL_RECYCLE`, `DB_CONNECT_TIMEOUT`
3. **AWS**: `AWS_REGION`, `AWS_DEFAULT_REGION`, `AWS_PROFILE`
4. **BEDROCK**: `BEDROCK_MODEL_ID`, `BEDROCK_MAX_TOKENS`, `BEDROCK_TIMEOUT_SECONDS`, `BEDROCK_MAX_RETRIES`
5. **MCP**: `MCP_HOST`, `MCP_PORT`, `MCP_PUBLIC_URL`, `MCP_AUTH_ENABLED`, `MCP_OAUTH_RESOURCE`, `MCP_REQUIRED_SCOPES`, `MCP_REQUEST_TIMEOUT`, `MCP_MAX_RETRIES`
6. **SECURITY**: `AUTH_ENABLED`
7. **OBSERVABILITY**: `LOG_LEVEL`, `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `CLOUDWATCH_LOGGING_ENABLED`

### Secrets Management Strategy

Secrets are abstracted through `app.core.secrets.SecretsManager` implementing `SecretProvider`:

- **Local Development**: `EnvSecretProvider` reads from OS environment variables and `.env`.
- **AWS Production**: `AWSSecretsManagerProvider` retrieves encrypted secrets using ambient IAM role credentials (e.g. ECS Task Execution Role) without static access keys.
- **Fail-Safe Redaction**: Structlog processor automatically sanitizes sensitive fields (`password`, `token`, `secret`, `api_key`, `access_key`, `aws_secret_access_key`) from log output.

---

## 3. Database Production Readiness

RALLY uses PostgreSQL via asynchronous SQLAlchemy (`asyncpg`) and synchronous Alembic (`psycopg2`) for schema migrations.

### Configured Pool Parameters
- `DB_POOL_SIZE`: Default `5` (configurable up to 100 per container)
- `DB_MAX_OVERFLOW`: Default `10`
- `DB_POOL_TIMEOUT`: Default `30.0`s
- `DB_POOL_RECYCLE`: Default `1800`s (prevents stale TCP resets)
- `DB_CONNECT_TIMEOUT`: Default `10.0`s (TCP connect timeout via asyncpg `command_timeout`)

### Migrations
Alembic remains authoritative. Always execute before deploying:
```bash
alembic upgrade head
```

---

## 4. Health, Liveness & Readiness Probes

Container orchestrators (AWS ECS, App Runner, Kubernetes) route traffic using two dedicated endpoints:

| Endpoint | Type | Purpose | External Dependencies | HTTP Success | HTTP Failure |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/liveness` | Process Probe | Verifies API process is running | None | 200 `alive` | Process Crash |
| `/readiness` | Traffic Probe | Verifies DB connectivity and runtime readiness | PostgreSQL (`SELECT 1`), MCP configuration, Bedrock configuration | 200 `ready` | 503 `not_ready` |
| `/health` | Legacy Check | Process information | None | 200 `ok` | - |
| `/health/database`| Deep DB Probe | Real DB query with latency metrics | PostgreSQL | 200 `ok` | 503 `unavailable` |

---

## 5. Production Docker Image

A production-hardened multi-stage Dockerfile is available at `apps/api/Dockerfile.prod`:

- **Multi-stage build**: Minimal runtime footprint based on `python:3.12-slim`.
- **Non-root user**: Runs under dedicated unprivileged user `rally` (UID/GID created on build).
- **No reload**: Uses production Uvicorn worker process.
- **Built-in healthcheck**: Probes `/liveness` every 30s.

```bash
docker build -f apps/api/Dockerfile.prod -t rally-api:latest ./apps/api
```

---

## 6. One-Command Local Development

Developers can run the complete stack (FastAPI on `:8000`, MCP server on `:8001`, React on `:5173`) using:

```bash
./start.sh
```

- Verifies port availability and identifies conflicting processes safely.
- Waits for API and MCP `/liveness` and `/health` readiness probes before launching the UI.
- Traps `SIGINT`/`SIGTERM` to cleanly terminate child background processes.

---

## 7. Verification Status Matrix

| Component | Status | Verification Note |
| :--- | :--- | :--- |
| Centralized Configuration | **Implemented & Locally Verified** | 100% unit tested against dev & prod envs |
| Secrets Manager Abstraction | **Implemented & Locally Verified** | Tested with local fallback and mocked AWS Secrets Manager |
| Database Pooling & Timeout | **Implemented & Locally Verified** | Tested with asyncpg connection args & SQLAlchemy async engine |
| Liveness & Readiness Probes | **Implemented & Locally Verified** | Tested with mock healthy and degraded DB states |
| OpenTelemetry Context / Redaction | **Implemented & Locally Verified** | Bound request_id, trace_id, service, environment, redacted secrets |
| Production Dockerfile | **Implemented** | `apps/api/Dockerfile.prod` created with non-root security |
| One-Command Launcher | **Implemented & Locally Verified** | `start.sh` verified across all three services |
| Live AWS Deployment | **Pending Phase 10B** | Not deployed yet; requires live AWS infrastructure provisioning |
