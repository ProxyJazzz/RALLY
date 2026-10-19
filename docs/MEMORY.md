# RALLY — Development Memory

> This file is the persistent working memory for Vibe Coding. It must be updated after every meaningful implementation task or phase.

## Project Identity

**Name:** RALLY  
**Expanded meaning:** Agentic Reliability & Response Orchestration  
**Current status:** Phase 1 — Foundation ✅ COMPLETE  
**Primary track:** Alexa+  
**Target mini challenge:** AWS Builder  
**Optional mini challenge:** Open Source, only if a meaningful qualifying contribution is completed.

## Product North Star

RALLY transforms a natural-language operational objective into a bounded, evidence-grounded, approval-aware, verifiable response workflow.

## Golden Scenario

Release regression in `checkout-api`:
- recent deployment;
- error rate rises;
- latency rises;
- agent correlates telemetry + deployment;
- proposes rollback;
- human approves;
- rollback executes in simulator;
- health recovers;
- agent verifies and reports.

## Current Completed Work

### Phase 0 — Product Lock ✅
- Competition requirements reviewed.
- Alexa+ identified as the strongest primary track.
- Agentic orchestration selected as the core architecture.
- Household-assistant direction rejected in favor of a high-value engineering operations problem.
- Product documentation structure defined.
- Working product name changed from SYNTRA.AI to RALLY.
- PRD, ARCHITECTURE, RULES, PHASES, DESIGN, MEMORY created.

### Phase 1 — Foundation ✅ (2026-10-19)
- Git branch: `feature/phase-1-foundation`
- Monorepo structure established under `apps/api` and `apps/web`
- FastAPI backend with clean layered architecture (routes → services → schemas → models → db)
- Pydantic v2 settings loaded from environment variables
- Structlog structured JSON logging configured (no secrets ever logged)
- PostgreSQL + SQLAlchemy async engine
- Alembic migration system: initial `incidents` table with enums for status/severity
- `GET /health` → real process liveness check
- `GET /health/database` → real `SELECT 1` connectivity check, returns 503 when unavailable
- CORS configured for development (localhost:5173, localhost:3000)
- Request-ID middleware (injected on every request)
- Clean error handling: no stack traces or secrets in client responses
- React + Vite + TypeScript + Tailwind CSS frontend
- Centralized API client (no raw fetch scattered in components)
- useHealth hook with polling (15s), loading/success/error states
- StatusCard component: real status only, never fake
- Docker Compose: postgres + api + web with health checks
- Dockerfiles for api and web
- .env.example with all configuration documented
- .gitignore comprehensive coverage
- pytest.ini configured
- 10 unit tests (config, health service) — all pass
- 6 integration tests (health routes, secrets check, request ID) — all pass
- TypeScript compilation: zero errors
- Vite production build: successful
- Live server startup verified: returns `{"status":"ok"}` from real FastAPI process
- README complete with setup, migration, test, and Docker instructions

### Phase 2 — Incident Simulator ✅ (2026-10-19)
- Git branch: `feature/phase-2-incident-simulator`
- Pure domain package built under `simulator/` with zero database or network dependencies
- Strongly typed Pydantic models for services, deployments, telemetry, structured logs, dependencies, runbooks, and events
- 4 deterministic simulated services: `checkout-service`, `payment-service`, `inventory-service`, `auth-service`
- Deployment tracking: `checkout-v41`, `checkout-v42`, `payment-v18`, `inventory-v30`, `auth-v12`
- Deterministic fault injection: `CHECKOUT_REGRESSION` activates `checkout-v42`, raises error rate to 18.4%, latency to 420ms, status to `DEGRADED`
- Downstream dependencies (`payment-service`, `inventory-service`, `auth-service`) remain `HEALTHY` (<0.5% error rate) during failure
- Structured logs provide diagnostic proof (`CHECKOUT_VALIDATION_REGRESSION` in `order_validator.py`)
- Controlled domain rollback operation: rolls back `checkout-v42`, reinstates `checkout-v41`, recovers error rate to 0.70%, restores status to `HEALTHY`
- Full audit event stream tracking all simulation transitions
- Complete reset capability via `sim.reset()`
- 26 simulator unit tests + 1 golden scenario end-to-end integration test (43/43 tests passing in 0.34s)
- All Phase 1 tests pass intact; frontend build succeeds with zero errors

## Current File Being Worked On

None — Phase 2 complete.

## Next Task

Phase 3 — MCP Tool Layer:
- Official MCP Python SDK server implementation
- Expose read tools (`get_service_health`, `get_error_rate`, `query_logs`, `get_recent_deployments`, `get_dependency_health`, `get_runbook`)
- Expose write tools (`rollback_deployment`, `restart_service`)
- Strict input/output schema validation with Pydantic
- Policy gating on write operations

## Decisions

### Decision: Use simulator-first execution
Reason: deterministic judging and safety. Real production actions are out of scope.

### Decision: In-memory simulation state over database tables
Reason: Per Phase 2 architectural constraints, simulator state is purely deterministic, reproducible in-memory state. Storing ephemeral simulation counters in PostgreSQL would introduce needless coupling and migration churn without architectural benefit.

### Decision: Canonical documentation path standardized to docs/
Reason: The canonical documentation path is standardized to `docs/` to match ARCHITECTURE.md and the master engineering prompt contract.

### Decision: Strict identifier sanitization
Reason: All service, deployment, and fault IDs validated against `^[a-zA-Z0-9_\-]+$` regex to prevent injection or arbitrary path traversal.

### Decision: Alembic over Base.metadata.create_all()
Reason: RULES.md §6 mandates migrations. Schema changes must be traceable, reversible, and reproducible.

### Decision: sqlalchemy[asyncio] + greenlet required
Reason: SQLAlchemy async extension requires greenlet. Added to pip install list; pyproject.toml updated.

## Open Questions

- Final legal/brand/domain availability check for RALLY.
- Exact Bedrock model selection.
- Exact Strands/AgentCore integration after compatibility testing.
- Final Alexa+ testing path.
- Whether a meaningful Open Source contribution can be completed before submission.

## Vibe Coding Protocol

Before every implementation task:
1. Read this file.
2. Read the relevant phase in `PHASES.md`.
3. Read constraints in `RULES.md`.
4. Read affected architecture in `ARCHITECTURE.md`.
5. Implement only the current task.
6. Run relevant tests.
7. Update this file.

After every task record:
- Date
- Phase
- What changed
- Files created/modified
- Tests run
- Known issues
- Next action

## Change Log

### 2026-10-19 — Phase 0
- Created project foundation documents.
- Reframed the project around agentic production reliability and incident response.
- Established simulator-first, evidence-grounded, human-gated execution.

### 2026-10-19 — Phase 1
- Implemented complete Phase 1 Foundation on branch `feature/phase-1-foundation`.
- 32 files created across backend, frontend, tests, configuration, Docker, and documentation.
- 16/16 tests pass, 0 failures, 0 warnings.
- Live API startup verified.
- Frontend production build verified.
- No secrets hardcoded. No fake API responses. No Base.metadata.create_all().

### 2026-10-19 — Phase 2
- Implemented deterministic Incident Simulator on branch `feature/phase-2-incident-simulator`.
- Created simulator domain models, exceptions, golden scenario definitions, and IncidentSimulator engine.
- Implemented golden incident lifecycle: baseline healthy -> CHECKOUT_REGRESSION -> correlate -> rollback -> recovery -> reset.
- Added 27 new tests (26 unit, 1 golden scenario e2e integration). All 43/43 tests pass in 0.34s.
- Zero MCP, LLM, or cloud dependencies introduced.

