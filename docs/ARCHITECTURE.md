# RALLY — Architecture

## 1. Architecture Goal

Build a real agentic system, not a chatbot wrapped around APIs.

The architecture separates:
- probabilistic reasoning,
- deterministic policy,
- tool execution,
- application state,
- verification,
- presentation.

## 2. High-Level Flow

```text
User / Alexa+
      |
      v
Natural-Language Intent
      |
      v
API / Agent Gateway
      |
      v
Agent Orchestrator
      |
      +--> Context Builder
      +--> Evidence Planner
      +--> Amazon Bedrock
      +--> Policy / Risk Engine
      +--> MCP Tool Router
                  |
                  +--> Service Health
                  +--> Logs
                  +--> Deployments
                  +--> Dependencies
                  +--> Runbooks
                  +--> Incident Actions
      |
      v
Evidence + Hypothesis
      |
      v
Action Plan
      |
      v
Human Approval Gate
      |
      v
Controlled MCP Execution
      |
      v
Verification Engine
      |
      v
Audit Timeline + Incident Report
```

## 3. Architectural Boundaries

### Agent layer
Responsible for:
- intent interpretation,
- selecting investigative tools,
- synthesizing evidence,
- generating hypotheses,
- planning next steps.

Not responsible for:
- arbitrary command execution,
- bypassing policy,
- inventing tool results,
- deciding that a dangerous action is safe.

### Policy layer
Deterministic.

Responsible for:
- action allowlists,
- risk classification,
- approval requirements,
- rate limits,
- retry limits,
- environment restrictions.

### MCP layer
The only path through which agent actions reach operational capabilities.

Every tool must have:
- strict input schema,
- strict output schema,
- timeout,
- structured error result,
- audit event,
- explicit read/write classification.

### Verification layer
Deterministic where possible.

It must not accept the agent's statement that recovery succeeded as proof of recovery.

## 4. Technology Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- WebSocket or Server-Sent Events for live execution events

### Backend
- Python 3.12+
- FastAPI
- Pydantic v2
- SQLAlchemy
- PostgreSQL
- Alembic

### Agent / AI
- Amazon Bedrock
- Strands SDK and/or Bedrock AgentCore where implementation stability permits
- Official MCP Python SDK
- Structured JSON outputs validated with Pydantic

### Infrastructure
- Docker Compose for local development
- GitHub Actions for CI
- `.env` configuration
- Optional AWS deployment after local demo path is stable

## 5. Repository Structure

```text
rally/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── pages/
│   │   └── package.json
│   └── api/
│       ├── app/
│       │   ├── api/
│       │   ├── core/
│       │   ├── models/
│       │   ├── schemas/
│       │   ├── services/
│       │   └── main.py
│       └── pyproject.toml
├── agent/
│   ├── orchestrator/
│   ├── prompts/
│   ├── policies/
│   ├── planning/
│   ├── verification/
│   └── memory/
├── mcp/
│   ├── server.py
│   ├── tools/
│   ├── schemas/
│   └── adapters/
├── simulator/
│   ├── scenarios/
│   ├── services/
│   ├── telemetry/
│   └── faults/
├── database/
│   ├── migrations/
│   ├── schema.sql
│   └── seed.sql
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── agent/
│   └── e2e/
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── RULES.md
│   ├── PHASES.md
│   ├── DESIGN.md
│   └── MEMORY.md
├── scripts/
├── .env.example
├── .gitignore
├── docker-compose.yml
├── LICENSE
└── README.md
```

## 6. Core Data Model

Minimum entities:
- `Incident`
- `IncidentEvent`
- `Evidence`
- `Hypothesis`
- `ActionPlan`
- `Approval`
- `ToolExecution`
- `Verification`
- `Service`
- `Deployment`
- `Runbook`

## 7. Agent State Machine

```text
RECEIVED
  -> TRIAGING
  -> INVESTIGATING
  -> PLANNING
  -> AWAITING_APPROVAL
  -> EXECUTING
  -> VERIFYING
  -> RESOLVED

Failure paths:
INVESTIGATING -> NEEDS_HUMAN
EXECUTING     -> EXECUTION_BLOCKED
VERIFYING     -> RECOVERY_FAILED
```

No state transition should be performed only because an LLM says it should happen. The application validates transitions.

## 8. MCP Tool Categories

### Read-only
- `get_service_health`
- `get_error_rate`
- `query_logs`
- `get_recent_deployments`
- `get_deployment_diff`
- `get_dependency_health`
- `get_runbook`

### Write / consequential
- `create_incident`
- `rollback_deployment`
- `restart_service`
- `scale_service`
- `send_incident_update`
- `close_incident`

Write tools require policy checks and may require human approval.

## 8.1 Incident Simulator Architecture (Phase 2)

The incident simulator (`simulator/`) provides a deterministic, in-memory operational world model that future components (MCP tools in Phase 3, Agent in Phase 4) interact with.

```text
Future Architecture:
  RALLY Agent → MCP Tool Layer → Incident Simulator → Services / Telemetry / Logs / Deployments

Phase 2 Scope:
  Incident Simulator → Services / Telemetry / Logs / Deployments
```

### Components
- **Domain Layer (`simulator/domain/`)**: Strongly typed Pydantic models (`Service`, `Deployment`, `DeploymentDiff`, `Telemetry`, `LogEntry`, `DependencyHealth`, `Runbook`, `SimulationEvent`) and typed exceptions (`ServiceNotFoundError`, `DeploymentNotFoundError`, `FaultNotSupportedError`, `RollbackUnavailableError`, `InvalidStateTransitionError`, `InvalidIdentifierError`).
- **Scenarios Layer (`simulator/scenarios/`)**: Deterministic fixture definitions for services (`checkout-service`, `payment-service`, `inventory-service`, `auth-service`), baseline and fault telemetry, structured logs, and dependencies.
- **Service Layer (`simulator/services/`)**: `IncidentSimulator` engine managing in-memory operational state, input validation, audit events, fault injection (`CHECKOUT_REGRESSION`), rollback (`rollback_deployment`), and state resets.

### Golden Scenario Lifecycle
1. **Initial Baseline**: All 4 services are `HEALTHY`. `checkout-v41` is active with baseline error rate 0.67% (<1.0%).
2. **Fault Injection (`CHECKOUT_REGRESSION`)**: `checkout-v42` is activated. `checkout-service` degrades to `DEGRADED`. Error rate rises to 18.4% (latency 420ms). Structured logs report `CHECKOUT_VALIDATION_REGRESSION` during order validation.
3. **Dependency Isolation**: Downstream dependencies (`payment-service`, `inventory-service`, `auth-service`) remain `HEALTHY` with <0.5% error rate, proving the fault is isolated to `checkout-service`.
4. **Controlled Rollback**: `checkout-v42` status is updated to `ROLLED_BACK`. `checkout-v41` is reinstated as active deployment.
5. **Deterministic Recovery**: Error rate returns to 0.70% (<1.0% runbook threshold), latency normalizes to 88ms, and `checkout-service` returns to `HEALTHY`.
6. **Audit Event Log**: All state transitions (`simulation_initialized`, `deployment_activated`, `fault_injected`, `service_health_changed`, `rollback_started`, `rollback_completed`) are appended to an immutable audit trail.

## 8.2 MCP Tool Layer Architecture (Phase 3)

The MCP layer (`rally_mcp/`) implements the Model Context Protocol using the official Python SDK (`mcp>=2.3.0`) over **Streamable HTTP** transport.

```text
┌──────────────────────┐
│  MCP Client / Agent  │
└──────────┬───────────┘
           │ Streamable HTTP (JSON-RPC)
           ▼
┌──────────────────────┐
│   RALLY MCP Server   │
│  (rally_mcp/server)  │
│  - Tool schemas      │
│  - Input validation  │
│  - Error mapping     │
└──────────┬───────────┘
           │ Domain method calls
           ▼
┌──────────────────────┐
│ Incident Simulator   │
│  (simulator/)        │
└──────────────────────┘
```

### Protocol & SDK Specifications
- **SDK**: Official `mcp` Python package (`mcp>=2.3.0`, specifically `mcp 2.3.0` / `mcp-types 2.3.0`).
- **Server Class**: `mcp.server.mcpserver.MCPServer`
- **Transport**: Streamable HTTP via `server.streamable_http_app()` running on Starlette / Uvicorn (default endpoint: `http://127.0.0.1:8001/mcp`).
- **Capability Negotiation**: Standard MCP protocol initialization (`session.initialize()`) returning server identity `rally-mcp-server`.

### Tool Surface
- **Read Tools (7)**:
  - `get_service_health(service_id: str)`: Returns operational status and active deployment.
  - `get_error_rate(service_id: str)`: Returns deterministic error percentage and traffic counters.
  - `query_logs(service_id: str, level: str | None, limit: int)`: Queries structured logs with level filter.
  - `get_recent_deployments(service_id: str, limit: int)`: Returns recent deployment history.
  - `get_deployment_diff(deployment_id: str)`: Returns code/config changes and risk level.
  - `get_dependency_health(service_id: str)`: Returns downstream dependency health.
  - `get_runbook(service_id: str)`: Returns incident remediation runbook and recovery threshold.
- **Write Tools (1)**:
  - `rollback_deployment(deployment_id: str)`: Executes controlled rollback in the simulator.
- **Deferred Tools**: Speculative write operations (`create_incident`, `restart_service`, `scale_service`, `send_incident_update`, `close_incident`) are strictly omitted until downstream domain support is built.
- **Security Invariant**: Strictly zero arbitrary code, shell, SQL, or generic HTTP execution tools. All tool inputs are validated and exceptions mapped into non-leaking JSON error envelopes.

## 8.3 Agentic Investigation Layer Architecture (Phase 4)

Phase 4 introduces the first bounded reasoning and investigation agent (`agent/`).

```text
┌────────────────────────────────────────────────────────┐
│               RALLY Investigation Agent                │
│                                                        │
│  Incident Request (INC-...)                            │
│         │                                              │
│         ▼                                              │
│  State Machine (RECEIVED → UNDERSTANDING →             │
│                 INVESTIGATING → FORMING_HYPOTHESES →   │
│                 RECOMMENDING → COMPLETE)               │
│         │                                              │
│         ▼                                              │
│  LLM Provider Abstraction                              │
│  (DeterministicInvestigationProvider / BedrockProvider)│
│         │                                              │
│         ▼                                              │
│  AgentPolicyEngine (Validates allowlist & injection)   │
│         │                                              │
│         ▼                                              │
│  AgentMCPClient (Streamable HTTP MCP Client)           │
└──────────────────────────┬─────────────────────────────┘
                           │ MCP Protocol (JSON-RPC)
                           ▼
┌────────────────────────────────────────────────────────┐
│                    RALLY MCP Server                    │
│                 (rally_mcp/server.py)                  │
│       Allowed: 7 read tools (health, errors, logs,     │
│                deployments, diffs, dependencies,       │
│                runbooks)                               │
│       Blocked: rollback_deployment (NOT callable by    │
│                investigation agent)                    │
└──────────────────────────┬─────────────────────────────┘
                           │ Domain method invocation
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Incident Simulator                   │
│               (Deterministic World State)              │
└────────────────────────────────────────────────────────┘
```

### Components
- **Domain Models (`agent/models.py`)**: Strongly typed models for `IncidentRequest`, `EvidenceItem`, `Hypothesis`, `RecommendedAction`, `InvestigationReport`, and `AgentEvent`.
- **Policy Engine (`agent/policies.py`)**: Enforces tool allowlists (7 read tools allowed, write/consequential tools strictly blocked) and neutralizes prompt injection in untrusted simulator logs or incident descriptions.
- **MCP Client Adapter (`agent/mcp_client.py`)**: Interacts with the operational world exclusively over Streamable HTTP MCP protocol (`mcp.client.session.ClientSession`). The agent cannot directly import or mutate simulator state.
- **Evidence Ledger (`agent/evidence.py`)**: Records observations with explicit source tools and references, enforcing labels (`OBSERVED`, `INFERRED`, `PROPOSED`). Strictly forbids emitting `EXECUTED` or `VERIFIED` during investigation.
- **Hypothesis Evaluator (`agent/hypotheses.py`)**: Generates and ranks primary and alternative hypotheses (e.g. comparing checkout deployment regression against payment, inventory, and auth dependency failures).
- **Provider Abstraction (`agent/providers.py`)**: `LLMProvider` abstract interface decoupled from vendor SDKs, paired with `DeterministicInvestigationProvider` for zero-network, reproducible CI execution.
- **Orchestrator (`agent/orchestrator.py`)**: Bounded investigation loop with strict limits (`max_tool_calls`, `max_iterations`, `timeout_seconds`). Produces structured reports and human-readable summaries.
- **Action Boundary Invariant**: The agent recommends remediation (`rollback_deployment(checkout-v42)`), but its execution status remains strictly `NOT_EXECUTED` in Phase 4. Execution is deferred to human approval (Phase 5) and controlled verification (Phase 6).

## 8.4 Planning + Governance Layer Architecture (Phase 5)

Phase 5 introduces the deterministic governance boundary (`governance/`) that validates agent recommendations against hardcoded policy rules and risk matrices before requesting human authorization.

```text
┌────────────────────────────────────────────────────────┐
│        Investigation Report (Recommended Action)       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│            ActionPlanner (governance/planner)          │
│                                                        │
│  1. Map to ProposedAction (evidence IDs validated)     │
│  2. RiskEngine.assess_risk()                           │
│     - Blast radius, customer impact, reversibility     │
│     - Deterministic classification: LOW/MED/HIGH/CRIT  │
│  3. PolicyEngine.evaluate()                            │
│     - RULE 1: Consequential actions → REQUIRES_APPROVAL│
│     - RULE 2: Unsupported actions   → DENIED           │
│     - RULE 3: Missing/invented IDs  → DENIED           │
│     - RULE 4: Low confidence        → DENIED           │
│  4. ConditionBuilder (Preconditions & Invalidations)   │
│  5. ApprovalService.create_approval_request()          │
│     - Status: AWAITING_APPROVAL                        │
│     - Decision: PENDING                                │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             Human Approval Gate (Human Role)           │
│                                                        │
│  ApprovalService.approve(approver="sre-lead@rally")    │
│  - Status: APPROVED                                    │
│  - INVARIANT: Execution status remains NOT_EXECUTED    │
│  - Simulator remains untouched in Phase 5              │
└────────────────────────────────────────────────────────┘
```

### Components
- **Domain Models (`governance/models.py`)**: Strongly typed models for `ProposedAction`, `ActionPlan`, `RiskAssessment`, `PolicyDecision`, `Precondition`, `InvalidationCondition`, and `ApprovalRequest`.
- **Policy Engine (`governance/policies.py`)**: Deterministic rules engine enforcing conservative invariants. Ignores prompt-level approval claims and ensures LLMs cannot override security policy.
- **Risk Engine (`governance/risk.py`)**: Explainable, deterministic risk scoring (e.g. `checkout-service` rollback = `HIGH` risk with structured factors).
- **Condition Evaluator (`governance/conditions.py`)**: Validates preconditions against operational state and invalidates plans if state diverges (e.g. active deployment changes).
- **Approval Service (`governance/approval.py`)**: Formal human-in-the-loop lifecycle. Enforces that agents/LLMs cannot grant approval (`approver != "agent"`).
- **No-Execution Invariant**: Under no circumstances does Phase 5 execute remediation or invoke write MCP tools. The operational simulator state remains strictly unmodified.

### 8.5 Execution + Verification Architecture (Phase 6)

Phase 6 implements the controlled execution and independent verification subsystem (`execution/`). It strictly separates state mutation from verification:

```text
┌────────────────────────────────────────────────────────┐
│             Approved ActionPlan (Phase 5)              │
│       (Status: APPROVED, Human Approval Granted)       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│     PreconditionRevalidator (execution/revalidator)    │
│                                                        │
│  1. Check plan.status == APPROVED                      │
│  2. Check plan.approval.decision == APPROVED           │
│  3. Check approval not expired                         │
│  4. Query live operational state via MCP               │
│  5. TOCTOU Defense: revalidate preconditions           │
│     - active_deployment_id == checkout-v42             │
│     - downstream dependencies == HEALTHY               │
│     - incident not resolved independently              │
└──────────────────────────┬─────────────────────────────┘
                           │ Passed
                           ▼
┌────────────────────────────────────────────────────────┐
│         ControlledExecutor (execution/executor)        │
│                                                        │
│  1. Idempotency enforcement (plan_id + action_type)    │
│  2. Controlled MCP write call: rollback_deployment     │
│  3. Generate immutable ExecutionRecord                 │
│     - Status: EXECUTED                                 │
│     - Latency / duration tracking                      │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│        IndependentVerifier (execution/verifier)        │
│                                                        │
│  Separate Read-Only MCP Tool Inspections:              │
│  - get_service_health (Status: HEALTHY, Active: v41)   │
│  - get_error_rate (0.70% < 1.0% threshold)             │
│  - get_dependency_health (payment, inventory, auth)    │
│  - query_logs (clean recovery logs)                    │
│                                                        │
│  Evaluation:                                           │
│  - All checks passed → VerificationStatus: PASSED      │
│  - Any check failed  → VerificationStatus: FAILED      │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             Lifecycle Recovery Decision                │
│                                                        │
│  - PASSED → RESOLVED (Incident status: RESOLVED)       │
│  - FAILED → RECOVERY_FAILED (Status: NEEDS_HUMAN)      │
│  - BLOCKED → EXECUTION_BLOCKED                         │
└────────────────────────────────────────────────────────┘
```

### Components
- **PreconditionRevalidator (`execution/revalidator.py`)**: Immediate pre-execution verification preventing Time-Of-Check to Time-Of-Use (TOCTOU) issues or execution of stale/expired plans.
- **ControlledExecutor (`execution/executor.py`)**: Enforces single-execution idempotency and calls the MCP write tool over Streamable HTTP protocol.
- **IndependentVerifier (`execution/verifier.py`)**: Read-only verification engine querying health, error rate, dependencies, and logs. Operates under the principle: *The same action that changes system state cannot be its own proof that recovery succeeded.*
- **ExecutionOrchestrator (`execution/orchestrator.py`)**: Coordinates the complete `revalidate -> execute -> record -> verify -> decide` pipeline.

### 8.6 AWS Builder Integration Architecture (Phase 7)

Phase 7 introduces a meaningful AWS-backed agentic reasoning layer via Amazon Bedrock and Strands Agent pattern, preserving deterministic governance, security, and tool boundaries.

```text
┌────────────────────────────────────────────────────────┐
│               Incident Operational Context             │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│     Strands Agent Orchestration (aws/strands.py)       │
│                                                        │
│  Coordinates multi-step reasoning cycles:              │
│  1. Evidence Analysis & Gap Detection                  │
│  2. Tool execution exclusively over MCP Client session │
│  3. Evidence Ledger provenance tracking                │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│      Amazon Bedrock Reasoning (aws/bedrock.py)         │
│                                                        │
│  Model: Anthropic Claude 3.5 Sonnet / AWS Converse API │
│  Prompt isolation: System vs. Untrusted Data           │
│  Strict Structured JSON output schema validation       │
│  CRITICAL: Evidence Provenance Validation              │
│  (Rejects hallucinated / non-existent evidence IDs)    │
└──────────────────────────┬─────────────────────────────┘
                           │ Recommendation
                           ▼
┌────────────────────────────────────────────────────────┐
│      Deterministic Governance Gate (Phase 5)           │
│  (PolicyEngine: REQUIRES_APPROVAL, RiskEngine: HIGH)   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│              Explicit Human Approval                   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│        Controlled Execution & Verification (Phase 6)   │
└────────────────────────────────────────────────────────┘
```

### Components
- **`BedrockInvestigationProvider` (`aws/bedrock.py`)**: Implements `LLMProvider` using Amazon Bedrock Runtime `converse()` API. Enforces schema validation, bounded timeouts, retries, and evidence provenance verification.
- **`StrandsInvestigationAgent` (`aws/strands.py`)**: Orchestrates multi-phase investigation loops. Communicates exclusively across the Streamable HTTP MCP boundary and never accesses the simulator directly.
- **Provider Abstraction**: Allows seamless switching between `DeterministicInvestigationProvider` (for 100% offline testing, CI, and determinism) and `BedrockInvestigationProvider` / `StrandsInvestigationAgent` (for production AWS cloud inference).
- **AgentCore Evaluation**: Evaluated and explicitly deferred. RALLY already has an official MCP server/client runtime and a dedicated deterministic governance subsystem. Introducing AgentCore without an explicit architectural gap would add redundant abstraction without reliability gain.

## 9. Execution Contract

```text
Agent intent
 -> Pydantic action request
 -> policy validation
 -> approval check
 -> MCP invocation
 -> structured tool result
 -> state update
 -> verification
```

The agent never receives raw shell access.

## 10. Reliability Strategy

- Timeouts on every network/tool call.
- Bounded retries.
- Exponential backoff for transient failures.
- Idempotency keys for writes.
- Circuit breakers for unavailable adapters.
- Structured error envelopes.
- Simulation fallback for demo reliability.
- Event log for every meaningful state transition.

## 11. AI Architecture Principle

The LLM is the reasoning component, not the system of record.

Database state, policy decisions, tool contracts, approvals, and verification remain deterministic.

## 12. Hackathon Runtime Strategy

The Alexa+ implementation will use a self-hosted MCP server over Streamable HTTP, satisfying the primary track's required technology. The official rules specify MCP 2025-11-25 minimum and Streamable HTTP for the working MCP path. fileciteturn1file0L57-L64

The system will also expose a web command center so judges can clearly observe the agentic workflow. The repo must demonstrate the track technology at runtime rather than merely mentioning it in documentation. fileciteturn1file0L57-L63
