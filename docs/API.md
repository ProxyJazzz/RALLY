# RALLY — REST API Specification

> **FastAPI Gateway Endpoint Reference**  
> **Base URL:** `http://localhost:8000` (Local) / AWS ALB Public DNS (Production)

---

## 1. System Health & Probes

### `GET /liveness`
- **Purpose**: Process liveness probe for orchestrators and AWS ALB target groups.
- **Dependencies**: None. Returns immediately.
- **Response**:
```json
{
  "status": "alive",
  "service": "RALLY API",
  "version": "0.1.0",
  "environment": "development"
}
```

### `GET /readiness`
- **Purpose**: Traffic readiness probe. Verifies database connectivity, MCP availability, and Bedrock configuration.
- **HTTP Status**: `200 OK` if ready, `503 Service Unavailable` if dependencies fail.
- **Response**:
```json
{
  "status": "ready",
  "service": "RALLY API",
  "version": "0.1.0",
  "environment": "development",
  "dependencies": {
    "database": "healthy",
    "bedrock": "configured",
    "mcp": "available"
  },
  "timestamp": "2026-10-23T15:31:55.703031+00:00"
}
```

### `GET /health`
- **Purpose**: Legacy service health check.
- **Response**: `200 OK`

### `GET /health/database`
- **Purpose**: Executes a real `SELECT 1` against PostgreSQL with roundtrip latency timing.
- **Response**:
```json
{
  "status": "ok",
  "service": "RALLY API",
  "version": "0.1.0",
  "environment": "development",
  "database": "postgresql",
  "latency_ms": 4.69,
  "error": null
}
```

---

## 2. Alexa+ Simulation & Incident Orchestration

### `GET /api/alexa/state`
- **Purpose**: Returns the authoritative multi-turn workspace snapshot.
- **Response Model**: `AlexaSimulationStateResponse` (includes active deployment, error rate, evidence ledger, timeline, plan, and verification report).

### `POST /api/alexa/reset`
- **Purpose**: Injects fault `CHECKOUT_REGRESSION` into simulator world. Reverts state to `RECEIVED` (checkout-v42 active, 18.4% error rate).

### `POST /api/alexa/chat`
- **Purpose**: Submits a natural-language operator utterance or voice intent.
- **Request**:
```json
{
  "message": "Investigate the checkout incident and recover it if evidence supports rollback",
  "incident_id": "INC-ALEXA-GOLDEN"
}
```
- **Response**: `ChatMessageResponse` (Assistant speech, extracted intent, epistemic evidence items, action plan, and updated state).

### `POST /api/alexa/approve`
- **Purpose**: Submits an explicit human operator governance decision.
- **Authorization**:
  - `AUTH_ENABLED=false`: Open for simulation/testing.
  - `AUTH_ENABLED=true`: Requires `Authorization: Bearer <APPROVAL_AUTH_TOKEN>`.
- **Idempotency**: Supports `approval_request_id` in JSON body or `X-Idempotency-Key` HTTP header.
- **Request**:
```json
{
  "incident_id": "INC-ALEXA-GOLDEN",
  "decision": "APPROVE",
  "approver": "sre-lead@rally.internal",
  "reason": "Authorized after reviewing diff and runbook.",
  "approval_request_id": "req-idempotency-key-01"
}
```
- **Response**: `AlexaSimulationStateResponse` (Executes controlled rollback, performs independent verification, transitions state to `RESOLVED`).
