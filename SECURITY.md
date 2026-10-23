# RALLY — Security Architecture & Threat Model

> **Security & Governance Specification**  
> **Classification:** Production Truth & Threat Mitigation  
> **Target Region:** `us-east-1`

---

## 1. Security Principles

RALLY is engineered under a strict **Zero-Bypass Governance Model**:
1. **No Autonomous Destructive Execution**: An LLM agent or autonomous workflow is permanently prohibited from self-authorizing infrastructure mutations.
2. **Authoritative Backend Governance**: Governance gates are enforced in Python backend domain services (`ApprovalService`, `ControlledExecutor`), never client-side buttons.
3. **Epistemic Traceability**: Inferences and hypotheses are strictly segregated from observed runtime facts.
4. **Least-Privilege Infrastructure**: Zero public IP compute tasks, NAT-less private isolated subnets, and IAM roles scoped strictly to designated resources.

---

## 2. Authentication & Authorization Boundaries

### Production Mode vs. Demo Simulator Mode

| Dimension | Simulator / Local Demo Mode (`AUTH_ENABLED=false`) | Production Mode (`AUTH_ENABLED=true`) |
| :--- | :--- | :--- |
| **API Gateway Ingress** | Open for local developer workflow | Requires Bearer Token or ALB IAM/OIDC integration |
| **Approval Endpoint (`POST /api/alexa/approve`)**| Permitted for test automation and interactive simulation | Strictly requires `Authorization: Bearer <APPROVAL_AUTH_TOKEN>` |
| **Invalid/Missing Token** | N/A | Returns `401 Unauthorized` or `403 Forbidden` |

### Environment Variables
- `AUTH_ENABLED`: Boolean flag toggling production gateway authentication.
- `APPROVAL_AUTH_TOKEN`: Shared secret or token verified on governance endpoints.

---

## 3. Idempotency & Replay Protection

Remediation requests dispatched to `POST /api/alexa/approve` are protected against double-execution:
1. **Idempotency Key Support**: Clients may supply a unique key via the JSON payload field `approval_request_id` or the standard HTTP header `X-Idempotency-Key`.
2. **Duplicate Suppression**: If an approval request with an already-processed key is received, the backend returns the current authoritative state snapshot immediately without dispatching the executor a second time.
3. **State Transition Guards**: Attempting to execute an approval on an incident already in `APPROVED`, `EXECUTING`, `VERIFYING`, or `RESOLVED` state safely returns the existing snapshot. Attempting to approve an incident in `REJECTED` state returns `HTTP 400 Bad Request`.

> [!WARNING]
> **Known Multi-Task Scaling Limitation**: Idempotency tracking is currently maintained in-memory per service instance. This is 100% safe for the current single-task ECS architecture (`desiredCount = 1`). For multi-task horizontal scaling, idempotency keys should be persisted in the existing PostgreSQL `approvals` table.

---

## 4. MCP Security & Tool Boundaries

RALLY implements the Model Context Protocol (MCP) Python SDK over Streamable HTTP.

- **Read vs. Write Partitioning**:
  - 7 Read Tools: Read-only queries to service health, error rate sliding windows, logs, deployments, diffs, dependencies, and runbooks.
  - 5 Context Tools: Conversational context, summaries, and verification readouts.
  - 1 Write Tool: `rollback_deployment` — policy-gated and strictly requires valid human governance authorization before execution.
- **Network Exposure**:
  - The MCP server binds to `127.0.0.1:8001` (or container internal interface).
  - The public Application Load Balancer only exposes port 80/443 to port 8000.
  - Port 8001 is **never exposed** to public subnets or internet ingress.

---

## 5. Network & Infrastructure Security

```text
THE INTERNET
     │
     ▼ (Port 80 / 443)
[rally-alb Security Group] (Public Subnet)
     │
     ▼ (Port 8000 only)
[rally-app Security Group] (Private Isolated Subnets, assignPublicIp: false)
     ├── Port 5432 (SSL required) ──► [rally-rds Security Group] (PostgreSQL 16)
     └── Port 443 (HTTPS VPCE)    ──► [rally-vpce Security Group] (Bedrock, Secrets, ECR, Logs)
```

- **Database**: Dedicated subnet group across 2 AZs in isolated subnets. Configured with `publiclyAccessible: false`, KMS encryption at rest, and PostgreSQL parameter `rds.force_ssl = 1`.
- **Secrets Management**: Database passwords and credentials resolve dynamically from AWS Secrets Manager (`/rally/production/database`). Secrets are never committed to git or printed in logs.
- **Log Redaction**: Structlog processor sanitizes sensitive keys (`password`, `token`, `secret`, `access_key`).

---

## 6. CORS & Documentation Hardening

- **CORS Protection**: `cors_origins` is restricted to explicit trusted domains (`http://localhost:5173`, `http://localhost:3000`). When `APP_ENV=production`, configuring wildcard `"*"` raises an immediate configuration exception.
- **API Documentation**: Interactive Swagger (`/docs`) and ReDoc (`/redoc`) endpoints are automatically disabled when `APP_ENV=production`.
