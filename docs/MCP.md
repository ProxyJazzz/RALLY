# RALLY — Model Context Protocol (MCP) Specification

> **Official Model Context Protocol Server Specification**  
> **Protocol Transport:** Streamable HTTP (Spec 2025-11-25)  
> **Server Endpoint:** `http://127.0.0.1:8001/mcp`  
> **Total Registered Tools:** 13 (7 Read, 1 Write, 5 Context)

---

## 1. Protocol Architecture

RALLY exposes operational capabilities to LLM agents through the official Model Context Protocol (MCP) Python SDK over **Streamable HTTP transport**.

```text
FastAPI / Agent Orchestrator
        │
        ▼ (Streamable HTTP Client)
┌──────────────────────────────────────────┐
│   RALLY MCP Server (:8001/mcp)           │
│                                          │
│   ├── 7 Read Investigation Tools         │
│   ├── 1 Governed Write Tool (Rollback)   │
│   └── 5 Conversational Context Tools     │
└──────────────────────────────────────────┘
```

---

## 2. Complete Tool Inventory

### A. Read Tools (Investigation & Telemetry)

#### 1. `get_service_health`
- **Purpose**: Returns current operational health status and active deployment.
- **Parameters**: `service_id: string` (e.g. `'checkout-service'`).
- **Response**: `ServiceHealthResponse` (status, version, active_deployment_id).

#### 2. `get_error_rate`
- **Purpose**: Calculates current HTTP 5xx error rate and request volumes.
- **Parameters**: `service_id: string`.
- **Response**: `ErrorRateResponse` (error_rate_pct, request_count, error_count).

#### 3. `query_logs`
- **Purpose**: Queries structured application logs, optionally filtered by severity level.
- **Parameters**: `service_id: string`, `level?: string`, `limit?: int` (1-100).
- **Response**: `LogsResponse` (total_returned, log entries).

#### 4. `get_recent_deployments`
- **Purpose**: Returns release history in reverse-chronological order.
- **Parameters**: `service_id: string`, `limit?: int` (1-20).
- **Response**: `RecentDeploymentsResponse` (deployments array with git commit references).

#### 5. `get_deployment_diff`
- **Purpose**: Returns code and configuration changes introduced in a deployment.
- **Parameters**: `deployment_id: string` (e.g. `'checkout-v42'`).
- **Response**: `DeploymentDiffResponse` (diff string).

#### 6. `get_dependency_health`
- **Purpose**: Checks status and roundtrip latency of upstream and downstream dependencies.
- **Parameters**: `service_id: string`.
- **Response**: `DependencyHealthResponse` (map of dependency health states).

#### 7. `get_runbook`
- **Purpose**: Returns certified SRE standard operating procedures and recovery instructions.
- **Parameters**: `service_id: string`.
- **Response**: `RunbookResponse` (runbook Markdown/text).

---

### B. Write Tools (Governed Remediation)

#### 8. `rollback_deployment`
- **Purpose**: Reverts container task definition to preceding stable release.
- **Governance**: **MANDATORY HUMAN SRE AUTHORIZATION**. Prohibited from autonomous invocation.
- **Parameters**: `deployment_id: string` (e.g. `'checkout-v42'`).
- **Response**: `RollbackDeploymentResponse` (`success: true`, active deployment updated to `'checkout-v41'`).

---

### C. Conversational Context Tools (Alexa+ Integration)

#### 9. `get_incident_context`
- **Purpose**: Retrieves authoritative multi-turn incident context, active deployment, and state.
- **Parameters**: `incident_id: string`.
- **Response**: Complete incident state model.

#### 10. `get_investigation_summary`
- **Purpose**: Returns structured natural language summary of root cause findings and evidence citations.
- **Parameters**: `incident_id: string`.
- **Response**: `InvestigationSummaryResponse`.

#### 11. `get_action_plan`
- **Purpose**: Returns remediation action plan, blast radius risk factors, and human approval status.
- **Parameters**: `incident_id: string`.
- **Response**: `ActionPlanResponse`.

#### 12. `get_execution_status`
- **Purpose**: Returns current execution status (enforces `NOT_EXECUTED` prior to approval).
- **Parameters**: `incident_id: string`.
- **Response**: `ExecutionStatusResponse`.

#### 13. `get_verification_status`
- **Purpose**: Returns post-remediation independent recovery verification outcome and error rate.
- **Parameters**: `incident_id: string`.
- **Response**: `VerificationStatusResponse`.
