# RALLY

**Agentic Reliability & Response Orchestration**

> An agentic operations system that investigates production incidents, coordinates evidence, proposes safe remediation, executes approved actions through controlled tools, verifies recovery, and produces an auditable incident record.

---

## Current Phase

**Phase 2 — Incident Simulator** ✅

Deterministic Microservice World Model • Telemetry & Structured Logs • Golden Incident Scenario • Checkout Regression Fault • Controlled Rollback & Deterministic Recovery • Full Simulation Audit Trail

---

## Architecture Overview

```
User / Alexa+
      │
      ▼
Natural-Language Intent
      │
      ▼
API Gateway (FastAPI)
      │
      ▼
Agent Orchestrator          ← Phase 4
      ├── Evidence Planner  ← Phase 4
      ├── Amazon Bedrock    ← Phase 7
      └── MCP Tool Router   ← Phase 3
              │
              ├── Service Health
              ├── Logs
              ├── Deployments
              └── Runbooks
      │
      ▼
Policy + Risk Engine        ← Phase 5
      │
      ▼
Human Approval Gate         ← Phase 5
      │
      ▼
Controlled MCP Execution    ← Phase 6
      │
      ▼
Verification + Audit Report
```

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Python | 3.12 |
| Node | 20 |
| npm | 9 |
| Docker | 24 |
| Docker Compose | v2 |
| PostgreSQL | 15 (via Docker) |

---

## Environment Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd RALLY

# 2. Copy environment file
cp .env.example .env
# Edit .env if you need non-default values

# 3. Backend virtual environment
cd apps/api
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cd ../..
```

---

## Local Development (without Docker)

### Start PostgreSQL

```bash
docker compose up postgres -d
```

### Run database migrations

```bash
cd apps/api
source .venv/bin/activate
alembic upgrade head
```

### Run the backend

```bash
cd apps/api
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API available at: http://localhost:8000  
Docs (dev only): http://localhost:8000/docs

### Run the frontend

```bash
cd apps/web
npm install
npm run dev
```

Frontend available at: http://localhost:5173

---

## Docker Development Environment

```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# View logs
docker compose logs -f api
docker compose logs -f web

# Stop all services
docker compose down

# Wipe database volume
docker compose down -v
```

Services:
- **postgres** → localhost:5432
- **api**      → localhost:8000
- **web**      → localhost:5173

---

## Database Migration Commands

```bash
cd apps/api && source .venv/bin/activate

# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Generate a new migration (after model changes)
alembic revision --autogenerate -m "describe what changed"

# Show current migration state
alembic current

# Show migration history
alembic history --verbose
```

---

## Running Tests

```bash
# From repository root
source apps/api/.venv/bin/activate

# Run all tests (43 unit & integration tests)
python -m pytest tests/ -v

# Run Golden Incident Scenario test
python -m pytest tests/integration/test_golden_scenario.py -v

# Simulator unit tests
python -m pytest tests/unit/test_simulator.py -v

# API foundation unit tests
python -m pytest tests/unit/test_config.py tests/unit/test_health_service.py -v

# API integration tests
python -m pytest tests/integration/test_health_routes.py -v

# With coverage
python -m pytest tests/ --cov=app --cov=simulator --cov-report=term-missing
```

---

## Incident Simulator (Phase 2)

The RALLY Incident Simulator (`simulator/`) is an in-memory, deterministic operational world model that reproduces the canonical golden incident lifecycle:

```text
HEALTHY BASELINE (checkout-v41, error rate 0.67%)
       │
       ▼
DEPLOY REGRESSION (checkout-v42 activated, error rate jumps to 18.4%)
       │
       ▼
EVIDENCE CORRELATION (logs: CHECKOUT_VALIDATION_REGRESSION, dependencies healthy)
       │
       ▼
CONTROLLED ROLLBACK (checkout-v42 rolled back, checkout-v41 reinstated)
       │
       ▼
RECOVERY VERIFICATION (error rate drops to 0.70%, status returns to HEALTHY)
```

Key features:
- **Zero random numbers, external APIs, or wall-clock dependencies**: all telemetry and log output is strictly reproducible.
- **Strongly-typed domain models**: Pydantic models for services, deployments, diffs, metrics, logs, runbooks, and audit events.
- **Dependency isolation**: Downstream dependencies (`payment-service`, `inventory-service`, `auth-service`) remain `HEALTHY` throughout failure, providing the exact signal an agent requires to isolate checkout as the primary suspect.
- **Full reset support**: `sim.reset()` restores pristine baseline state for automated testing.

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | API process liveness |
| GET | `/health/database` | Real database connectivity check |
| GET | `/docs` | OpenAPI documentation (dev/staging only) |

### Health response

```json
{
  "status": "ok",
  "service": "RALLY API",
  "version": "0.1.0",
  "environment": "development"
}
```

### Database health response

```json
{
  "status": "ok",
  "service": "RALLY API",
  "version": "0.1.0",
  "environment": "development",
  "database": "postgresql",
  "latency_ms": 2.4
}
```

Returns HTTP 503 when the database is unreachable.

---

## Project Structure

```
RALLY/
├── apps/
│   ├── api/                         ← FastAPI backend
│   │   ├── app/
│   │   │   ├── api/routes/          ← Route handlers
│   │   │   ├── core/                ← Config, logging, errors
│   │   │   ├── db/                  ← Database session
│   │   │   ├── models/              ← SQLAlchemy ORM models
│   │   │   ├── schemas/             ← Pydantic schemas
│   │   │   ├── services/            ← Business logic
│   │   │   └── main.py
│   │   ├── alembic/                 ← Migration scripts
│   │   └── pyproject.toml
│   └── web/                         ← React + Vite frontend
│       ├── src/
│       │   ├── api/                 ← Centralized API client
│       │   ├── components/          ← UI components
│       │   ├── hooks/               ← React hooks
│       │   └── App.tsx
│       └── package.json
├── simulator/                       ← Deterministic Incident Simulator
│   ├── domain/                      ← Models & typed exceptions
│   │   ├── models.py
│   │   └── exceptions.py
│   ├── scenarios/                   ← Golden scenario definitions & fixtures
│   │   └── golden.py
│   └── services/                    ← IncidentSimulator engine
│       └── simulator.py
├── tests/
│   ├── unit/                        ← Unit tests (simulator + API)
│   │   ├── test_config.py
│   │   ├── test_health_service.py
│   │   └── test_simulator.py
│   └── integration/                 ← Integration tests
│       ├── test_golden_scenario.py
│       └── test_health_routes.py
├── docs/                            ← Project documentation
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── RULES.md
│   ├── PHASES.md
│   ├── DESIGN.md
│   └── MEMORY.md
├── .env.example
├── .gitignore
├── docker-compose.yml
├── pytest.ini
└── README.md
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [PRD](docs/PRD.md) | Product requirements |
| [Architecture](docs/ARCHITECTURE.md) | System design |
| [Phases](docs/PHASES.md) | Development roadmap |
| [Rules](docs/RULES.md) | Engineering constraints |
| [Design](docs/DESIGN.md) | UI/UX design system |
| [Memory](docs/MEMORY.md) | Working implementation log |

---

## License

MIT — see [LICENSE](LICENSE)
