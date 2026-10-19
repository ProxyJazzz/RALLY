# RALLY

**Agentic Reliability & Response Orchestration**

> An agentic operations system that investigates production incidents, coordinates evidence, proposes safe remediation, executes approved actions through controlled tools, verifies recovery, and produces an auditable incident record.

---

## Current Phase

**Phase 1 — Foundation** ✅

PostgreSQL • FastAPI • React + Vite + Tailwind • Alembic migrations • Docker Compose • Structured logging • Health endpoints • Testing foundation

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

# Run all tests
python -m pytest tests/ -v

# Unit tests only (no database required)
python -m pytest tests/unit/ -v

# Integration tests only
python -m pytest tests/integration/ -v

# With coverage
python -m pytest tests/ --cov=app --cov-report=term-missing
```

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
├── tests/
│   ├── unit/                        ← Unit tests (no DB required)
│   └── integration/                 ← API integration tests
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
