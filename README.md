# RALLY

**Agentic Reliability & Response Orchestration**

> An agentic operations system that investigates production incidents, coordinates evidence, proposes safe remediation, executes approved actions through controlled tools, verifies recovery, and produces an auditable incident record.

---

## Current Phase

**Phase 5 — Planning + Governance** ✅

Deterministic Policy Engine (`ALLOWED`, `DENIED`, `REQUIRES_APPROVAL`) • Explainable Risk Engine (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) • Precondition & Invalidation Condition Validation • Formal Human Approval Lifecycle (`PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`) • Strict Action Boundary (`execution_status = "NOT_EXECUTED"`) • Agent Self-Approval & Policy Bypass Defenses

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

# Run all tests (81 unit & protocol integration tests across all phases)
python -m pytest tests/ -v

# Run Phase 5 Golden Governance integration tests (No-execution invariant & policy bypass)
python -m pytest tests/integration/test_golden_governance.py -v

# Run Phase 5 Governance unit tests (policy engine, risk matrix, approval lifecycle, conditions)
python -m pytest tests/unit/test_governance.py -v

# Run Golden Agent Investigation test (full MCP-backed cycle)
python -m pytest tests/integration/test_agent_investigation.py -v

# Run Agent unit tests (policies, evidence ledger, hypotheses)
python -m pytest tests/unit/test_agent.py -v

# Run Golden Scenario executed over MCP protocol
python -m pytest tests/integration/test_golden_mcp_scenario.py -v

# Run MCP server protocol integration tests
python -m pytest tests/integration/test_mcp_server.py -v

# Run MCP unit tests
python -m pytest tests/unit/test_mcp.py -v

# Run Golden Incident Simulator test
python -m pytest tests/integration/test_golden_scenario.py -v

# Simulator unit tests
python -m pytest tests/unit/test_simulator.py -v

# API foundation unit & integration tests
python -m pytest tests/unit/test_config.py tests/unit/test_health_service.py tests/integration/test_health_routes.py -v

# With coverage
python -m pytest tests/ --cov=app --cov=simulator --cov=rally_mcp --cov=agent --cov=governance --cov-report=term-missing
```

---

## Planning + Governance (Phase 5)

The Planning + Governance subsystem (`governance/`) implements a deterministic gate between agent recommendations and consequential execution:

```text
InvestigationReport (Phase 4)
             │
             ▼
       ActionPlanner
             ├── Evidence Provenance Check (Rejects invented IDs)
             ├── Target Resource Exists Check
             └── Action Schema Validation
             │
             ▼
     Deterministic PolicyEngine
             ├── Rule 1: Consequential actions -> REQUIRES_APPROVAL
             ├── Rule 2: Unsupported actions -> DENIED
             ├── Rule 3: Missing/invented evidence -> DENIED
             ├── Rule 4: Low confidence -> DENIED / elevated risk
             └── Rule 5: Stale operational state -> INVALIDATED
             │
             ▼
     Explainable RiskEngine
             ├── Blast radius & customer-facing impact (checkout-service: HIGH)
             ├── Service dependency depth
             └── Action reversibility & evidence confidence
             │
             ▼
ConditionBuilder & ConditionEvaluator
             ├── Preconditions (e.g., active deployment == checkout-v42)
             └── Invalidation conditions (e.g., deployment rolled back, independent resolution)
             │
             ▼
       ApprovalService
             ├── PENDING -> APPROVED / REJECTED / EXPIRED
             ├── Explicit actor role verification (ActorType.HUMAN only; agents forbidden)
             └── Immutable audit event log (PLAN_CREATED, APPROVAL_REQUESTED, etc.)
             │
             ▼
       NO-EXECUTION BOUNDARY
(Plan status: AWAITING_APPROVAL/APPROVED; execution_status: NOT_EXECUTED; zero simulator mutations)
```

---

## Agentic Investigation (Phase 4)

The RALLY Investigation Agent (`agent/`) operates as a bounded reasoning loop that investigates production anomalies exclusively through the Model Context Protocol.

```text
RECEIVE INCIDENT
       │
       ▼
UNDERSTAND INTENT
       │
       ▼
BOUNDED MCP READ LOOP (get_service_health, get_error_rate, query_logs, diffs, runbooks)
       │
       ▼
EVIDENCE LEDGER (Provenance tracking; strictly forbids false EXECUTED/VERIFIED labels)
       │
       ▼
HYPOTHESIS EVALUATION (Rank primary checkout-v42 regression vs. alternative dependency failures)
       │
       ▼
RECOMMEND REMEDIATION (Recommend rollback_deployment(checkout-v42))
       │
       ▼
EXECUTION BOUNDARY INVARIANT (execution_status: NOT_EXECUTED in Phase 4)
```

Key features:
- **Zero direct simulator access**: The agent communicates with operational state exclusively over the MCP Streamable HTTP protocol.
- **Strict action boundary**: `rollback_deployment` is explicitly blocked from agent invocation in Phase 4; remediation is recommended but requires human approval (Phase 5) before controlled execution (Phase 6).
- **Prompt injection defense**: Operational logs, runbooks, and incident text are classified as untrusted data and sanitized to prevent instruction override attacks.
- **Evidence ledger**: Every claim maps to atomic evidence items with strict provenance.
- **Deterministic CI provider**: `DeterministicInvestigationProvider` guarantees 100% reproducible test runs with zero network dependencies.

---

## RALLY MCP Server (Phase 3)

The RALLY MCP Server (`rally_mcp/`) implements the Model Context Protocol using the official Python SDK (`mcp>=2.3.0`) over **Streamable HTTP**. It acts as the capability boundary layer between future AI agents and operational systems.

### Starting the MCP Server locally

```bash
source apps/api/.venv/bin/activate
python -m rally_mcp.server
```

Server endpoints:
- **Transport**: Streamable HTTP
- **URL**: `http://127.0.0.1:8001/mcp`
- **Protocol**: Model Context Protocol (MCP)

### Exposed MCP Tools

| Tool | Type | Description |
|------|------|-------------|
| `get_service_health` | Read | Returns operational status (HEALTHY, DEGRADED, FAILED) and active deployment |
| `get_error_rate` | Read | Returns deterministic error rate percentage and request telemetry |
| `query_logs` | Read | Queries structured operational logs filtered by service and level |
| `get_recent_deployments` | Read | Returns reverse-chronological deployment history |
| `get_deployment_diff` | Read | Returns code/configuration changes and risk rating for a deployment |
| `get_dependency_health` | Read | Returns downstream service health to isolate regression causes |
| `get_runbook` | Read | Returns documented rollback instructions and verified recovery thresholds |
| `rollback_deployment` | Write | Executes a controlled rollback to the preceding stable deployment |

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
├── rally_mcp/                       ← Official Model Context Protocol Server
│   ├── server.py                    ← MCP Server factory & Streamable HTTP app
│   ├── runtime.py                   ← In-process background server runner
│   ├── schemas.py                   ← Input & output Pydantic schemas
│   ├── errors.py                    ← Safe error envelope mapping
│   └── tools/                       ← Investigation & remediation tool definitions
│       ├── read_tools.py            ← 7 operational read tools
│       └── write_tools.py           ← 1 controlled rollback tool
├── agent/                           ← Bounded Agentic Investigation
│   ├── models.py                    ← Incident, evidence, hypothesis, and report schemas
│   ├── policies.py                  ← Security allowlists & prompt injection defense
│   ├── mcp_client.py                ← MCP client adapter (Streamable HTTP protocol)
│   ├── evidence.py                  ← Evidence ledger & provenance tracking
│   ├── hypotheses.py                ← Hypothesis evaluation & comparative ranking
│   ├── providers.py                 ← LLMProvider interface & Deterministic provider
│   ├── orchestrator.py              ← Bounded investigation loop orchestrator
│   └── reports.py                   ← Report formatting utilities
├── governance/                      ← Deterministic Planning & Governance
│   ├── models.py                    ← ActionPlan, ProposedAction, RiskAssessment schemas
│   ├── policies.py                  ← Deterministic PolicyEngine (5 rules)
│   ├── risk.py                      ← Explainable RiskEngine (multi-factor matrix)
│   ├── approval.py                  ← ApprovalService (human-only approval lifecycle)
│   ├── conditions.py                ← Precondition & invalidation evaluation
│   ├── planner.py                   ← ActionPlanner recommendation-to-plan workflow
│   └── exceptions.py                ← Domain exceptions
├── tests/
│   ├── unit/                        ← Unit tests (simulator + API + MCP + Agent + Governance)
│   │   ├── test_config.py
│   │   ├── test_health_service.py
│   │   ├── test_simulator.py
│   │   ├── test_mcp.py
│   │   ├── test_agent.py
│   │   └── test_governance.py
│   └── integration/                 ← Integration tests (API + MCP + Agent + Governance)
│       ├── test_golden_scenario.py
│       ├── test_golden_mcp_scenario.py
│       ├── test_health_routes.py
│       ├── test_mcp_server.py
│       ├── test_agent_investigation.py
│       └── test_golden_governance.py
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
