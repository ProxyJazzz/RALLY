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
