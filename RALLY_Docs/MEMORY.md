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

## Current File Being Worked On

None — Phase 1 complete.

## Next Task

Phase 2 — Incident Simulator:
- deterministic services (checkout-api, payment-api, etc.)
- metric endpoints (error rate, latency)
- simulated log queries
- deployment history
- fault injection
- one-command reset

## Decisions

### Decision: Use simulator-first execution
Reason: deterministic judging and safety. Real production actions are out of scope.

### Decision: MCP is a real runtime boundary
Reason: Alexa+ requires genuine track technology use for the MCP path.

### Decision: AI is not the policy engine
Reason: nondeterministic model output must not directly determine consequential system actions.

### Decision: Verification is mandatory
Reason: an action being executed does not prove recovery.

### Decision: docs/ folder → RALLY_Docs/
Reason: repository was initialized with RALLY_Docs/ by the team before Phase 1. Architecture.md references `docs/` — this is a known naming discrepancy to be resolved at hardening phase.

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
- Whether to rename `RALLY_Docs/` to `docs/` for alignment with ARCHITECTURE.md.

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
