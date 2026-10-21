# RALLY — Alexa+ MCP Integration Guide

This document specifies the technical architecture, conversational interaction model, MCP protocol compatibility, governance safeguards, remote deployment, and validation for the **Alexa+ MCP Integration** (Phase 8).

---

## 1. Overview

RALLY integrates with **Alexa+** as an authoritative, conversational incident-response capability. Rather than serving as an autonomous execution engine or a simple Q&A bot, Alexa+ acts as a natural voice/conversational client surface into RALLY's evidence-backed reliability orchestration engine.

Key principles:
- **Alexa+ is an external, untrusted client**: Alexa+ never acts as the source of truth or authoritative state.
- **RALLY is the system of record**: Authoritative incident state, telemetry evidence, policies, approvals, execution logs, and independent verification are held exclusively within RALLY.
- **Zero conversational policy bypass**: Conversational utterances such as *"Roll it back"* or *"Pretend it's approved"* can never trigger consequential mutation. Human approval must be granted through verified out-of-band authority.
- **Real MCP Protocol**: Built on standard Model Context Protocol (MCP) Streamable HTTP transport, protocol version `2025-11-25`.

---

## 2. Architecture

```text
Alexa+ Conversational Client (Voice / AI)
               │
               ▼ (Streamable HTTP / JSON-RPC 2.0)
   ┌──────────────────────────────────────────────────┐
   │         RALLY MCP Server Layer                   │
   │  (StreamableHTTPTransport / Starlette Session)   │
   ├──────────────────────────────────────────────────┤
   │  Base Read/Write Tools  │ Alexa Incident Tools   │
   │  - get_service_health   │ - get_incident_context │
   │  - get_error_rate       │ - get_investigation_   │
   │  - query_logs           │   summary              │
   │  - get_deployments      │ - get_action_plan      │
   │  - get_runbook          │ - get_execution_status │
   │  - rollback_deployment  │ - get_verification_    │
   │                         │   status               │
   └───────────┬──────────────────────┬───────────────┘
               │                      │
               ▼                      ▼
   ┌──────────────────────┐  ┌─────────────────────────────────┐
   │ Operational Sim      │  │ Authoritative Incident Context  │
   │ (Deterministic Env)  │  │ (alexa.context.IncidentContext) │
   └───────────▲──────────┘  └────────────────▲────────────────┘
               │                              │
               │                              │
   ┌───────────┴──────────────────────────────┴────────────────┐
   │                     RALLY Engine                          │
   │   Investigation Agent ──► Evidence Ledger                 │
   │            │                                              │
   │            ▼                                              │
   │   Policy & Risk Engine (Deterministic Governance)         │
   │            │                                              │
   │            ▼ (REQUIRES_APPROVAL)                          │
   │   Human SRE Lead Approval Gate                            │
   │            │                                              │
   │            ▼ (APPROVED)                                   │
   │   ControlledExecutor (Revalidation + Idempotency)         │
   │            │                                              │
   │            ▼                                              │
   │   Independent Verification Engine (Recovery Decision)     │
   └───────────────────────────────────────────────────────────┘
```

---

## 3. Alexa+ Interaction Model

The conversational interface supports an interactive, multi-turn troubleshooting dialogue without re-running long investigations redundantly:

1. **Trigger / Assess**:
   - *User*: "Checkout is failing after the latest deployment. Investigate it."
   - *Alexa+*: Triggers investigation via RALLY agent and initial context initialization.
2. **Review Evidence**:
   - *User*: "What did you find?"
   - *Alexa+*: Calls `get_investigation_summary(incident_id)`. Returns root cause (`CHECKOUT_REGRESSION`), confidence (`0.95`), and recommended action (`rollback_deployment`).
3. **Inspect Code / Deployment Diff**:
   - *User*: "What changed in the deployment?"
   - *Alexa+*: Calls `get_deployment_diff(deployment_id="checkout-v42")`. Returns modified files (`order_validator.py`) and commit message.
4. **Evaluate Plan & Governance**:
   - *User*: "What do you recommend?"
   - *Alexa+*: Calls `get_action_plan(incident_id)`. Returns risk level (`HIGH`), approval requirement (`true`), and execution status (`NOT_EXECUTED`).
5. **Enforce Approval Boundary**:
   - *User*: "Roll it back."
   - *Alexa+*: Calls `get_execution_status(incident_id)` or checks action plan. RALLY responds that execution is `NOT_EXECUTED` because consequential rollback requires verified SRE human approval. Conversational commands cannot bypass governance.
6. **Verify Recovery**:
   - *User*: "Has recovery been verified?"
   - *Alexa+*: Calls `get_verification_status(incident_id)`. RALLY consults the independent verification engine. Returns `PASSED` and `RESOLVED` only after telemetry confirms error rate is back to baseline (0.70%) and `checkout-v41` is active.

---

## 4. MCP Compatibility

- **Transport**: Streamable HTTP (`mcp.server.streamable_http.StreamableHTTPTransport`)
- **Protocol Version**: Spec `2025-11-25` (official `mcp>=1.2.0` Python SDK)
- **JSON-RPC Endpoints**:
  - `POST /mcp`: Session initiation, command dispatch, JSON-RPC messages.
  - `GET /mcp`: Server-sent events / streamable event stream.
  - `DELETE /mcp`: Clean session termination.
- **Session Lifecycle**: Full stateful and stateless session management with standard MCP session identifiers (`Mcp-Session-Id` header).
- **Error Envelopes**: Typed MCP errors (`INVALID_PARAMS`, `INTERNAL_ERROR`) with structured JSON content and zero internal stack trace exposure.

---

## 5. Tool Contracts

RALLY exposes 13 typed tools over MCP (8 foundation tools + 5 conversational incident tools):

### Core Operational Tools
| Tool Name | Type | Arguments | Description |
|-----------|------|-----------|-------------|
| `get_service_health` | Read | `service_id: str` | Check service operational status, active deployment, and uptime. |
| `get_error_rate` | Read | `service_id: str` | Get current HTTP 5xx error percentage and threshold breach status. |
| `query_logs` | Read | `service_id: str, limit: int?` | Fetch structured operational logs with severity levels. |
| `get_recent_deployments` | Read | `service_id: str` | Retrieve chronological deployment ledger for a service. |
| `get_deployment_diff` | Read | `deployment_id: str` | View git diff, changed files, and commit details. |
| `get_dependency_health` | Read | `service_id: str` | Check downstream database and dependent service health. |
| `get_runbook` | Read | `service_id: str` | Fetch standard operating procedures and remediation runbooks. |
| `rollback_deployment` | Consequential Mutation | `service_id: str, target_deployment_id: str` | Roll back service to previous stable deployment. |

### Alexa+ Conversational Capabilities
| Tool Name | Type | Arguments | Description |
|-----------|------|-----------|-------------|
| `get_incident_context` | Read | `incident_id: str` | Authoritative summary of the incident lifecycle, states, and IDs. |
| `get_investigation_summary` | Read | `incident_id: str` | Evidence-backed root cause, confidence score, and findings. |
| `get_action_plan` | Read | `incident_id: str` | Recommended remediation plan, risk tier, and approval requirements. |
| `get_execution_status` | Read | `incident_id: str` | Authoritative execution state (`NOT_EXECUTED`, `COMPLETED`, `FAILED`). |
| `get_verification_status` | Read | `incident_id: str` | Independent post-remediation verification status and recovery decision. |

---

## 6. Incident Context

The `alexa.context.IncidentContextManager` maintains an authoritative in-memory ledger of active and historical incidents:

```python
class ConversationalIncidentContext(BaseModel):
    incident_id: str
    state: ConversationalIncidentState # DETECTED, INVESTIGATING, INVESTIGATED, PLAN_GENERATED, APPROVED, EXECUTING, VERIFYING, RESOLVED, RECOVERY_FAILED
    service_id: str
    active_deployment: str
    suspected_deployment: Optional[str]
    investigation_status: str
    primary_hypothesis: Optional[str]
    confidence: Optional[float]
    evidence_refs: List[str]
    recommended_action: Optional[str]
    action_plan_id: Optional[str]
    approval_state: Optional[str]
    execution_state: str
    verification_state: str
    last_verified_result: Optional[str]
    created_at: datetime
    updated_at: datetime
```

**Key Separation**: Alexa conversation history is transient and external. RALLY incident state is strictly bound to evidence and domain objects.

---

## 7. Governance Boundary

Consequential actions (e.g., `rollback_deployment`) can NEVER be triggered by conversational prompts alone:

1. **Policy & Risk**: Any production mutation is evaluated as `HIGH_RISK` and flagged `REQUIRES_APPROVAL`.
2. **Approval Gate**: Requires explicit cryptographic/verified human authorization by an authenticated SRE Lead (`ApprovalService.approve(...)`).
3. **Conversational "Roll it back"**: When a user tells Alexa "Roll it back", RALLY inspects the approval ledger:
   - If unapproved: returns `NOT_EXECUTED` with status `"APPROVAL_REQUIRED"` and directs the user to review the approval request in the governance portal.
   - Under no circumstances does Alexa invoke `ControlledExecutor` directly.
4. **Independent Verification**: Recovery cannot be claimed until `IndependentVerifier` queries live telemetry and confirms the error rate has dropped below healthy thresholds (e.g., < 1.0%).

---

## 8. Authentication

The Alexa+ MCP integration is designed around OAuth 2.1 specifications:

- **Flow**: Authorization Code Grant with PKCE (`S256`)
- **Tokens**: Short-lived Bearer JWTs validated via standard JWKS
- **Discovery**: Protected Resource Metadata (`/.well-known/oauth-protected-resource`) and Authorization Server Metadata (`/.well-known/oauth-authorization-server`)
- **Required Scopes**:
  - `rally:incident:read`: Read telemetry, logs, diffs, context, plans, and verification.
  - `rally:incident:write`: Trigger controlled execution of previously human-approved plans.

*Local/Demo Mode*: Authentication is not yet configured for the local/demo MCP endpoint (`RALLY_MCP_AUTH_ENABLED=false`), allowing rapid automated integration, local testing, and hackathon evaluation without external IdP requirements.

---

## 9. HTTPS / Remote Public Endpoint Setup

Alexa+ requires public HTTPS ingress to reach the MCP server.

### Local Development Tunneling (Cloudflare Quick Tunnel)

1. **Start the RALLY MCP Server**:
   ```bash
   source apps/api/.venv/bin/activate
   python -m rally_mcp.server
   ```
2. **Open Cloudflare Quick Tunnel**:
   ```bash
   cloudflared tunnel --url http://127.0.0.1:8001
   ```
3. **Configure RALLY Environment**:
   Update `.env`:
   ```env
   RALLY_MCP_PUBLIC_URL=https://<your-tunnel-id>.trycloudflare.com/mcp
   ```

> [!WARNING]
> **Ephemeral URLs**: Cloudflare Quick Tunnel URLs (e.g. `*.trycloudflare.com`) are ephemeral and change whenever the tunnel process is restarted. Do NOT hardcode tunnel URLs into source code. Always use `RALLY_MCP_PUBLIC_URL` or configuration overrides.

---

## 10. Alexa AI CLI Setup

To register RALLY with Alexa+:

1. **Install and Configure Alexa AI CLI**:
   ```bash
   npm install -g @alexa/alexa-ai-cli
   alexa-ai configure
   ```
2. **Register RALLY MCP Add-on**:
   ```bash
   alexa-ai addon create rally \
     --endpoint "${RALLY_MCP_PUBLIC_URL}" \
     --transport streamable-http \
     --description "RALLY: Evidence-backed automated incident investigation and reliability orchestration."
   ```
3. **Verify Tool Discovery**:
   ```bash
   alexa-ai addon test rally --tool get_service_health --args '{"service_id":"checkout-service"}'
   ```

---

## 11. Local Testing

Run all unit and integration tests covering Alexa+ MCP workflows:

```bash
source apps/api/.venv/bin/activate

# Unit tests (models, context manager, error handling, adapter boundaries)
python -m pytest tests/unit/test_alexa.py tests/unit/test_alexa_adapter.py -v

# Integration tests (multi-turn lifecycle, prompt injection, latency benchmark)
python -m pytest tests/integration/test_alexa_mcp.py -v
```

---

## 12. Live Alexa+ Testing

*Current Status*: **PENDING DEVELOPER ACCESS / LIVE HARDWARE VALIDATION**
- Local Streamable HTTP MCP server: **Verified** (100% compliant)
- Public Cloudflare Quick Tunnel: **Verified** (13 tools discovered remotely via MCP ClientSession)
- Multi-turn conversational flow: **Verified locally via MCP ClientSession & AlexaConversationalAdapter**
- Live AWS Alexa+ Developer Account connection: **Pending credential setup / developer program approval**

---

## 13. Security Model

- **Prompt Injection Defense**: Validated against jailbreaks, simulated approvals, DROP TABLE strings, and requests to bypass safety policies. All return structured error envelopes (`INCIDENT_NOT_FOUND` / `INVALID_IDENTIFIER`).
- **Forbidden Tools**: Prohibited generic chat or execution tools (`chat`, `shell`, `exec`, `do_anything`, `eval`, `arbitrary_command`) are strictly absent from tool registration and actively blocked by `AlexaConversationalAdapter`.
- **Approval Boundary**: Conversational requests ("Roll it back", "Fix it", "Pretend it's approved") cannot bypass governance. Explicit approval is strictly separated from conversational intent.
- **Audit Trails**: All conversational interactions generate structured observability events (`ALEXA_MCP_TOOL_CALLED`, `ALEXA_GOVERNANCE_BLOCKED`).
- **No Direct Simulator Access**: Alexa+ integration modules never import `simulator` directly.

---

## 14. Performance

Measured local round-trip latency over Streamable HTTP transport:
- `get_service_health`: ~28 ms (initial cold path) / ~2 ms (warm)
- `get_error_rate`: ~2.4 ms
- `query_logs`: ~1.8 ms
- `get_recent_deployments`: ~1.7 ms
- `get_investigation_summary`: ~3.1 ms
- `get_verification_status`: ~2.8 ms
- **Target**: `< 500 ms`
- **Result**: **PASS** (average query latency < 10 ms under local testing)

---

## 15. Product Feedback

### 1. Model Context Protocol (MCP) Python SDK
- **Purpose**: Server-side tool registration, Streamable HTTP transport hosting, and client session communication.
- **What Worked Well**: The official Python `mcp` SDK (`StreamableHTTPTransport`, `streamable_http_client`, and `ClientSession`) provides clean protocol framing, session management, and JSON-RPC 2.0 handling.
- **What Needs Improvement**: Documentation around configuring Starlette ASGI apps with custom route prefixes and handling session headers in raw HTTP testing needs clearer examples.
- **Onboarding/Setup Experience**: Straightforward installation via pip (`pip install mcp`); clean integration with Starlette.
- **Would You Reuse It?**: Yes, highly recommended for standardizing tool interfaces for AI agents.

### 2. Streamable HTTP Transport
- **Purpose**: Remote HTTP/SSE transport for MCP server communication across public internet and tunneling gateways.
- **What Worked Well**: Handles streaming chunked responses, session reconnection, and clean lifecycle teardown (`POST` -> `GET` SSE -> `DELETE`). Compatible with standard reverse proxies and Cloudflare Tunnels without custom protocol plugins.
- **What Needs Improvement**: Better error descriptions when client requests omit `Mcp-Session-Id` during non-initialization requests.
- **Onboarding/Setup Experience**: Built directly into the MCP SDK (`server.streamable_http_app()`).
- **Would You Reuse It?**: Yes.

### 3. Alexa+ MCP Integration & Tooling
- **Purpose**: Enable natural conversational incident investigation, evidence summarization, and recovery coordination via voice.
- **Status**: **NOT YET VERIFIED ON LIVE HARDWARE** (Verified via local protocol harness & remote tunnel handshake).
- **What Worked Well**: 13 typed tool schemas accurately distinguish operational read capabilities from conversational summarization tools.
- **What Needs Improvement**: Standardize local mock voice-turn runner in the Alexa AI SDK so developers can simulate multi-turn speech dialogues in local CI before cloud deployment.
- **Would You Reuse It?**: Yes, provided live developer tooling is expanded.

### 4. Alexa AI CLI
- **Purpose**: CLI tooling for configuring, managing, and registering MCP add-ons with Alexa+.
- **Status**: **NOT YET VERIFIED ON LIVE HARDWARE**.

---

## 18. Phase 8B: Alexa+ Simulation Experience

### Overview
Because public developer preview accounts and physical hardware for Alexa+ remain limited during the hackathon period, RALLY provides an **Alexa+ Compatible Conversational Simulation Workspace** inside the web application (`apps/web`).

This simulation is **strictly backed by RALLY's real operational systems**:
- Real Streamable HTTP MCP server layer (`rally_mcp`)
- Real Agentic Investigation orchestrator (`agent.orchestrator.InvestigationOrchestrator`)
- Real Deterministic Governance & Risk Assessment (`governance.planner.ActionPlanner`)
- Real Human SRE Approval Gate (`governance.approval.ApprovalService`)
- Real Controlled Execution with TOCTOU pre-execution revalidation (`execution.executor.ControlledExecutor`)
- Real Independent Verification (`execution.verifier.IndependentVerifier`)
- Real Operational Simulation (`simulator.services.simulator.IncidentSimulator`)

### Truthful Disclosure
> [!IMPORTANT]
> **Simulated Alexa+ Surface**: This interface simulates an Alexa+ voice/conversational client interaction with RALLY over MCP. It does **not** claim to be connected to physical Alexa+ hardware or the Amazon Alexa Developer Console. The Amazon AppDev Hackathon rules explicitly permit a simulated Alexa+ experience.

### Architecture

```text
Operator / Judge (Browser UI)
          │
          ▼ (HTTP /api/alexa/chat)
FastAPI Simulation Controller (`apps/api/app/api/routes/alexa_simulation.py`)
          │
          ▼
AlexaSimulationService (`apps/api/app/services/alexa_simulation.py`)
          ├── Conversational Intent Parser (`alexa.adapter.AlexaConversationalAdapter`)
          ├── Authoritative Context Registry (`alexa.context.incident_context_manager`)
          └── Real Streamable HTTP MCP Client (`agent.mcp_client.AgentMCPClient`)
                    │
                    ▼
          RALLY MCP Server Layer (:8001/mcp)
                    │
                    ▼
          Investigation -> Evidence -> Governance -> Approval -> Execution -> Verification
```

### Golden Path Interaction
1. **Trigger Investigation**:
   - User: *"Investigate the checkout incident and recover it if evidence supports rollback."*
   - RALLY inspects service health, error rate (18.4%), logs, deployment history, diff (`order_validator.py`), and dependencies.
   - Emits structured evidence with strict epistemic labels: `OBSERVED`, `INFERRED`, `PROPOSED`.
2. **Review Findings**:
   - User: *"What did you find?"* -> Explains root cause (`CHECKOUT_VALIDATION_REGRESSION` in `checkout-v42`).
3. **Inspect Recommendation & Governance Gate**:
   - User: *"Should we roll it back?"* -> Explains recommendation, `HIGH` risk level, and explicit human approval requirement.
4. **Approval Gate Enforcement**:
   - User says: *"Yes, approve the rollback."*
   - RALLY notes conversational intent, but **refuses to execute via conversational utterance alone**. Directs operator to the human approval gate.
   - Operator clicks **"Approve Rollback"** in the Governance Panel.
5. **Controlled Execution & Independent Verification**:
   - `ControlledExecutor` revalidates operational preconditions and executes `rollback_deployment`.
   - `IndependentVerifier` queries live telemetry independently.
   - Error rate recovers to `0.70%`, `checkout-v41` active -> Status transitions to **`RESOLVED`**.
6. **Recovery Dialogue**:
   - User: *"Is the service healthy now?"* -> RALLY verifies recovery and reports operational resolution.
