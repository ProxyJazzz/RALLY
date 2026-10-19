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

### Phase 3 — MCP Tool Layer ✅ (2026-10-19)
- Git branch: `feature/phase-3-mcp-tool-layer`
- Official MCP Python SDK integrated (`mcp 2.3.0`, `mcp-types 2.3.0`)
- Built `rally_mcp` package using `mcp.server.mcpserver.MCPServer`
- Streamable HTTP transport configured via Starlette (`create_rally_mcp_app()`, default `http://127.0.0.1:8001/mcp`)
- 7 Read Tools exposed: `get_service_health`, `get_error_rate`, `query_logs`, `get_recent_deployments`, `get_deployment_diff`, `get_dependency_health`, `get_runbook`
- 1 Write Tool exposed: `rollback_deployment` (invokes simulator domain rollback)
- Deferred write tools (`create_incident`, `restart_service`, `scale_service`, `send_incident_update`, `close_incident`) omitted to avoid fake implementations
- Forbidden tools strictly prevented (zero arbitrary code/shell/generic-HTTP execution)
- Safe error mapping: domain exceptions converted to structured `MCPToolErrorResponse` without leaking internals
- 13 new tests added (9 unit tests + 4 protocol integration tests)
- 56/56 total tests passing in 1.27s (100% pass rate)
- Golden scenario executed completely over real MCP protocol client session
- Frontend build remains clean

### Phase 4 — Agentic Investigation ✅ (2026-10-19)
- Git branch: `feature/phase-4-agentic-investigation`
- Built bounded, auditable investigation agent in package `agent/`
- Strongly typed Pydantic models for incident requests, evidence ledger items, hypotheses, recommendations, and structured reports
- `AgentPolicyEngine` enforces strict tool allowlist (7 read tools permitted) and completely blocks write operations (`rollback_deployment`) from agent invocation
- Prompt injection defense: operational data (logs, deployments, runbooks) is strictly treated as untrusted data and sanitized
- `AgentMCPClient` interacts exclusively with the operational world over Streamable HTTP MCP protocol (`mcp.client.session.ClientSession`); direct imports/mutations of simulator state are strictly forbidden
- `EvidenceLedger` provides provenance tracking and enforces that `EXECUTED`, `VERIFIED`, and `APPROVED` labels cannot be emitted during investigation
- `HypothesisEvaluator` ranks candidate hypotheses (primary checkout regression vs. alternative payment, inventory, and auth dependency failures)
- `LLMProvider` abstraction with `DeterministicInvestigationProvider` guarantees zero-network, 100% reproducible test execution
- Bounded loop bounds enforced (`max_tool_calls`, `max_iterations`, `timeout_seconds`)
- Invariant preserved: `execution_status = "NOT_EXECUTED"` (remediation is recommended, never executed in Phase 4)
- Added 13 new tests (8 unit tests + 5 MCP protocol integration tests)
- 69/69 total tests passing in 1.84s (100% pass rate across entire repo)
- Frontend build remains clean

## Current File Being Worked On

None — Phase 4 complete.

## Next Task

Phase 5 — Planning + Governance:
- Action plan generation from investigation recommendations
- Policy risk assessment engine (deterministic risk classification: LOW, MEDIUM, HIGH, CRITICAL)
- Human-in-the-loop approval workflow (gating consequential actions like rollback)
- Audit log persistence of approval events

## Decisions

### Decision: Remediation execution strictly prohibited in Phase 4
Reason: Architectural separation of concerns. Phase 4 is limited to investigation and recommendation. Consequential actions (e.g. `rollback_deployment`) require policy checks and human approval (Phase 5) before controlled execution and recovery verification (Phase 6).

### Decision: Evidence ledger label invariant
Reason: To prevent model hallucinations or premature claims of resolution, the agent policy engine actively rejects emitting `EXECUTED` or `VERIFIED` evidence labels when no action was executed.

### Decision: Untrusted data classification for operational logs and metadata
Reason: To mitigate prompt injection risks, all log entries, runbook content, and incident text are classified as untrusted data and sanitized before ledger ingestion.

### Decision: Official MCP SDK package naming disambiguation
Reason: Python package is `mcp`. To prevent local folder import collisions when running `import mcp`, the local MCP server adapter layer is located in package `rally_mcp/`.

### Decision: Use MCPServer and Streamable HTTP in MCP 2.x
Reason: `mcp>=2.0.0` uses `mcp.server.mcpserver.MCPServer` (FastMCP was renamed in 2.x) and supports Starlette ASGI apps for Streamable HTTP via `server.streamable_http_app()`.

### Decision: Strict tool boundary and omission of placeholder write tools
Reason: RULES.md and Phase 3 specifications forbid fake success responses. Write operations are limited strictly to verified capabilities supported by the domain layer (`rollback_deployment`).

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

### 2026-10-19 — Phase 3
- Implemented official MCP Tool Layer on branch `feature/phase-3-mcp-tool-layer`.
- Built `rally_mcp` server using official Python SDK (`mcp 2.3.0`) over Streamable HTTP transport.
- Exposed 7 read investigation tools and 1 write rollback tool bound to `IncidentSimulator`.
- Implemented safe error envelopes and strict schema validation.
- Added 13 new tests (unit + protocol integration). All 56/56 tests pass in 1.27s.
- Verified end-to-end golden incident scenario across live MCP client session.

### 2026-10-19 — Phase 4
- Implemented bounded Agentic Investigation Layer on branch `feature/phase-4-agentic-investigation`.
- Created `agent/` package with `InvestigationOrchestrator`, `EvidenceLedger`, `HypothesisEvaluator`, `AgentPolicyEngine`, `AgentMCPClient`, and `DeterministicInvestigationProvider`.
- Enforced strict tool allowlist (7 read tools allowed; rollback_deployment blocked from agent execution).
- Added prompt injection defense and untrusted content sanitization.
- Verified golden incident investigation across live MCP Streamable HTTP transport.
- Confirmed strict action boundary invariant (`execution_status = "NOT_EXECUTED"`).
- Added 13 new tests (unit + protocol integration). All 69/69 tests pass in 1.84s.

