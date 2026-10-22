# RALLY — Development Memory

> This file is the persistent working memory for Vibe Coding. It must be updated after every meaningful implementation task or phase.

## Project Identity

**Name:** RALLY  
**Expanded meaning:** Agentic Reliability & Response Orchestration  
**Current status:** Phase 8B — Alexa+ Simulation Experience COMPLETE ✅
**Submission status:** Final Hackathon Submission / Documentation and Demo Hardening
**Primary track:** Alexa+  
**Target mini challenge:** AWS Builder  
**Optional mini challenge:** Open Source (NOT CLAIMED without separate qualifying contribution)

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

### Phase 5 — Planning + Governance ✅ (2026-10-19)
- Git branch: `feature/phase-5-planning-governance`
- Built deterministic governance layer in package `governance/`
- Strongly typed Pydantic models for `ProposedAction`, `ActionPlan`, `RiskAssessment`, `PolicyDecision`, `Precondition`, `InvalidationCondition`, and `ApprovalRequest`
- `PolicyEngine` enforces conservative deterministic rules:
  - Consequential mutations (`rollback_deployment`) mandate human approval (`REQUIRES_APPROVAL`)
  - Unsupported/deferred actions (`restart_service`, `scale_service`) are strictly `DENIED`
  - Missing or fabricated evidence IDs are strictly `DENIED`
  - Low-confidence actions on tier-1 services are strictly `DENIED`
  - Untrusted approval text or prompt overrides are strictly ignored
- `RiskEngine` calculates deterministic risk level (`HIGH` for checkout rollback) with explainable risk factors
- `ConditionBuilder` & `ConditionEvaluator` construct and evaluate preconditions and invalidation triggers against operational state (e.g. stale deployment changes invalidate issued plans)
- `ApprovalService` enforces explicit human approval lifecycle (`PENDING` -> `APPROVED` / `REJECTED` / `EXPIRED`) and forbids agent self-approval (`approver != "agent"`)
- Mandatory Invariant strictly preserved: Phase 5 produces approval-ready plans, but NEVER executes remediation or invokes write MCP tools (`execution_status = "NOT_EXECUTED"`)
- Operational simulator state remains completely untouched during planning and approval
- Added 12 new tests (9 unit tests + 3 integration tests)
- 81/81 total tests passing in 2.15s (100% pass rate across entire repo)
### Phase 6 — Execution + Verification ✅ (2026-10-19)
- Git branch: `feature/phase-6-execution-verification`
- Built execution and independent verification subsystem in package `execution/`
- Strongly typed Pydantic models for `ExecutionRecord`, `VerificationReport`, `VerificationCheck`, and `ControlledExecutionResult`
- `PreconditionRevalidator` enforces pre-execution TOCTOU checks:
  - Enforces plan is in `APPROVED` status with valid human approval decision
  - Checks approval window has not expired
  - Live query of operational state over MCP to ensure active deployment matches expected target
  - Verifies downstream dependencies remain healthy
  - Detects if incident was resolved independently, aborting execution if already healthy
- `ControlledExecutor` invokes MCP write tool (`rollback_deployment`) exclusively over Streamable HTTP protocol:
  - Enforces single-execution idempotency key (`exec-{plan_id}-{action_type}`)
  - Tracks execution latency and records structured `ExecutionRecord`
- `IndependentVerifier` evaluates recovery using separate read-only MCP tool queries:
  - Re-checks service health (`get_service_health`) -> `HEALTHY`
  - Re-checks error rate (`get_error_rate`) -> 0.70% (< 1.0% runbook threshold)
  - Confirms active deployment restoration -> `checkout-v41`
  - Inspects downstream dependencies (`get_dependency_health`) -> `HEALTHY`
  - Inspects operational logs (`query_logs`) -> clean recovery logs
- `ExecutionOrchestrator` coordinates the full `revalidate -> execute -> record -> verify -> decide` pipeline
- Deliberately supports and tests both outcomes:
  - Happy Path: Rollback succeeds + verification passes -> `RecoveryDecision.RESOLVED`
  - Failure Path: Rollback succeeds, but verification fails (strict threshold) -> `RecoveryDecision.RECOVERY_FAILED` -> escalates to `NEEDS_HUMAN`
  - TOCTOU Block Path: Stale deployment state triggers pre-execution block -> `RecoveryDecision.EXECUTION_BLOCKED`
- Added 9 new tests (6 unit tests + 3 integration tests)
- 90/90 total tests passing in 2.52s (100% pass rate across entire repo)
- Frontend build remains clean

### Phase 7 — AWS Builder Integration ✅ (2026-10-20)
- Git branch: `feature/phase-7-aws-builder-integration`
- Built dedicated AWS integration package under `aws/`
- Implemented `BedrockInvestigationProvider` connecting to Amazon Bedrock Runtime via `converse()` API:
  - Supports configurable model ID (`anthropic.claude-3-5-sonnet-20241022-v2:0`) and region
  - Enforces schema validation on JSON outputs
  - Strictly enforces evidence provenance (rejects non-existent IDs like `EV-999`)
  - Bounded token limits, request timeouts, and exponential backoff retries
  - Clean error handling (distinguishes missing credentials, bad JSON, unauthorized tools)
  - Emits structured `AWSObservabilityEvent` audit logs
- Implemented `StrandsInvestigationAgent` orchestration adapter:
  - Coordinates iterative evidence analysis cycles with Amazon Bedrock
  - Interacts strictly across Streamable HTTP MCP Client boundary
  - Preserves downstream deterministic governance gate (halts at `REQUIRES_APPROVAL`)
- Evaluated AgentCore: deferred with documented justification (RALLY already has dedicated MCP server runtime and deterministic governance)
- Preserved 100% offline deterministic test suite (zero network/AWS dependency for standard pytest run)
- Created opt-in live test (`test_live_bedrock_integration`) gated by `RUN_AWS_INTEGRATION_TESTS=true`
- Added 7 new tests (6 unit tests + 1 integration test); 97 passed, 1 skipped
- Frontend build remains clean

### Phase 8A — Alexa+ MCP Integration Surface ✅ (2026-10-20)
- Git branch: `feature/phase-8-alexa-plus-integration`
- Implemented `alexa.config.AlexaMCPConfig`:
  - Dynamically loads `RALLY_MCP_PUBLIC_URL` from environment without hardcoding ephemeral Cloudflare URLs.
  - Enforces strict allowlist of 13 tools and explicit blocklist of dangerous/generic tools (`shell`, `execute_command`, `eval`, `chat`).
- Implemented `alexa.adapter.AlexaConversationalAdapter`:
  - Translates conversational intents to structured MCP tool invocations over Streamable HTTP.
  - Enforces strict approval semantics: distinguishes explicit approvals from ambiguous/interrogative prompts.
  - Strictly prevents conversational execution bypass: conversational prompts return `NOT_EXECUTED` (approval required).
  - Enforces verification boundary: cannot claim recovery unless independent verification returns `PASSED` / `RESOLVED`.
- Live Remote MCP Endpoint Verification:
  - Verified remote tool discovery over an ephemeral Cloudflare Quick Tunnel (`https://<ephemeral-tunnel-id>.trycloudflare.com/mcp`).
  - The URL was ephemeral and intentionally was not persisted in configuration.
  - Remote MCP session initialization confirmed and discovered all 13 tools.
- Testing:
  - Added 12 new unit and boundary tests in `tests/unit/test_alexa_adapter.py`.
  - Total test suite: 118 passed, 1 skipped in 3.64s (100% pass rate).
  - Frontend build clean (built in 416ms).

### Phase 8B — Alexa+ Simulation Experience ✅ (2026-10-21)
- Git branch: `feature/phase-8b-alexa-simulation`
- Implemented real-backed conversational simulation workspace in `apps/web`:
  - `ConversationalPanel`: Voice-like terminal command dialogue with suggested prompts and thinking indicators.
  - `InvestigationTimeline`: Real-time operational timeline tracing MCP tool invocations (`get_service_health`, `get_error_rate`, `query_logs`, `get_deployment_diff`, `get_dependency_health`).
  - `EvidenceLedgerPanel`: Explicit epistemic classifications (`OBSERVED`, `INFERRED`, `PROPOSED`, `APPROVED`, `EXECUTED`, `VERIFIED`).
  - `GovernanceApprovalPanel`: Explicit Human SRE Authorization Gate (`[APPROVE ROLLBACK]` / `[REJECT]`), pre-execution revalidation, and independent verification display.
- Implemented FastAPI simulation routes and backend service (`apps/api/app/services/alexa_simulation.py` & `routes/alexa_simulation.py`):
  - `POST /api/alexa/chat`: Processes conversational utterances against RALLY's MCP investigation and context flow.
  - `GET /api/alexa/state`: Provides full workspace snapshots.
  - `POST /api/alexa/reset`: Resets simulator to fault regression condition.
  - `POST /api/alexa/approve`: Applies explicit human operator approval/rejection to the governance gate.
- Truthful Disclosure: Clearly identified as an Alexa+ Compatible Simulation Workspace backed by real MCP and governance, without claiming physical hardware or unverified developer console connectivity.
- Testing & Validation:
  - Added 7 integration tests in `tests/integration/test_alexa_simulation.py` (golden path, rejection path, state snapshots, multi-run state reset cleanliness).
  - Total test suite: 125 passed, 1 optional skipped in 4.99s (100% pass rate).
  - Web production build passing cleanly (`npm run build` in ~450ms).

## Current File Being Worked On

None — Phase 8B and submission hardening complete.

## Next Task

Final Hackathon Submission:
- Produce video walkthrough showcasing the Alexa+ Simulation Workspace and golden incident remediation path.
- Submit repository, documentation, and Amazon Bedrock / Alexa+ Product Feedback.
- *(Future product roadmap only)* Phase 9 — Extended Command Center UX.

## Known Limitations

1. **Live Alexa+ Developer Access**: Live Amazon Alexa+ Developer Console and physical hardware validation are pending developer program preview access (NOT VERIFIED). The project provides a 100% real-backed conversational simulation workspace.
2. **Ephemeral Public Tunnel**: Cloudflare Quick Tunnels used during remote MCP testing are ephemeral and change upon restart; URLs are not hardcoded.
3. **Authentication**: Local/demo mode runs with authentication disabled by default (`RALLY_MCP_AUTH_ENABLED=false`).
4. **Open Source Mini Challenge**: Not claimed unless a separate qualifying external open source contribution is made.

## Decisions

### Decision: Dual Provider Abstraction (Deterministic vs. Bedrock/Strands)
Reason: Production systems need cloud model intelligence, but CI/CD and safety testing require 100% offline reproducibility. The `LLMProvider` abstraction allows seamless switching between `DeterministicInvestigationProvider` and `BedrockInvestigationProvider` / `StrandsInvestigationAgent`.

### Decision: Strict Evidence Provenance Validation in Model Adapters
Reason: LLMs can hallucinate citations. `BedrockInvestigationProvider` actively validates that every `supporting_evidence_ids` or `contradicting_evidence_ids` returned in Bedrock's JSON output exists in the `EvidenceLedger`. Citing a non-existent ID raises `EvidenceProvenanceValidationError`.

### Decision: AgentCore Evaluation and Deferral
Reason: RALLY already has a robust MCP server/client boundary and a deterministic governance layer. Adding AgentCore at this phase without a concrete, non-duplicative architectural responsibility would introduce unnecessary complexity.

### Decision: Strict Separation of Execution and Verification
Reason: The core reliability architectural principle dictates: "The same action that changes system state cannot be its own proof that recovery succeeded." Controlled execution and independent verification are decoupled into distinct engines. Execution records the mutation, while independent verification performs subsequent read-only telemetry queries to establish ground truth recovery.

### Decision: Immediate Pre-Execution Revalidation (TOCTOU Defense)
Reason: Approval must never mean "execute blindly." Operational states can shift between human approval and execution. `PreconditionRevalidator` queries live state immediately before write tool invocation to guarantee active deployment, dependency health, and valid approval before mutating the system.

### Decision: Explicit Failure Path Modeling (RECOVERY_FAILED -> NEEDS_HUMAN)
Reason: Real operations often encounter remediations that fail to restore health (e.g. underlying database corruption, partial rollbacks). Testing and modeling `RECOVERY_FAILED` provides realistic reliability architecture rather than a naive happy-path demo.

### Decision: Strict No-Execution Invariant in Phase 5
Reason: Architectural separation of concerns. Phase 5 is limited strictly to planning, policy assessment, risk evaluation, and human approval. Even after explicit human approval (`APPROVED`), remediation execution is deferred exclusively to Phase 6.

### Decision: Agent self-approval prevention
Reason: A model must never have authority to approve its own consequential recommendations. `ApprovalService` rejects any approval where `approver` is an agent or AI entity.

### Decision: Strict evidence provenance requirement
Reason: To eliminate hallucinated actions, `PolicyEngine` verifies that every evidence ID in `ProposedAction.evidence_ids` exists in the `GovernanceContext`. Any missing or fabricated ID causes deterministic denial.

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

### 2026-10-19 — Phase 5
- Implemented Planning + Governance Layer on branch `feature/phase-5-planning-governance`.
- Created `governance/` package with `ActionPlanner`, `PolicyEngine`, `RiskEngine`, `ConditionEvaluator`, and `ApprovalService`.
- Enforced deterministic policy decisions (REQUIRES_APPROVAL for rollback, DENIED for unsupported or low-confidence actions).
- Implemented human-in-the-loop approval workflow; agent self-approval is actively blocked.
- Evaluated preconditions and invalidation triggers against operational state.
- Strictly preserved the No-Execution Invariant: `execution_status = "NOT_EXECUTED"` across planning and approval.
- Added 12 new tests (unit + integration). All 81/81 tests pass in 2.15s.


