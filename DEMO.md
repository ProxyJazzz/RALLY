# RALLY — Golden Demo Walkthrough Script

> **Judge-Friendly 3-Minute Walkthrough Script**  
> **Scenario:** Production Checkout Validation Regression (`INC-ALEXA-GOLDEN`)  
> **Key Value:** Autonomous Investigation • MCP Tool Layer • Zero-Bypass Human Governance • Controlled Execution • Independent Verification

---

## Demo Timeline (03:00)

```text
00:00 ── Problem: Autonomous systems must not run uncontrolled in production.
00:20 ── Incident Injection: Elevated 18.4% error rate in checkout-service.
00:40 ── Conversational Ask: "Investigate the checkout incident."
01:00 ── MCP Read Tool Sweep: Health, telemetry, structured logs, git diffs.
01:20 ── Forensic Evidence Ledger: Facts classified with strict epistemic labels.
01:40 ── Root Cause Deduction: checkout-v42 validation regression (95% confidence).
02:00 ── Governance Gate Barrier: Action planned; status remains NOT_EXECUTED.
02:15 ── Operator Decision: Explicit human SRE authorization.
02:30 ── Controlled Execution: ControlledExecutor dispatches rollback_deployment.
02:40 ── Independent Verification: Direct out-of-band telemetry probe (0.7% error rate).
02:50 ── Resolution & Audit: Status transitions to RESOLVED with full audit trace.
```

---

## Step-by-Step Execution Guide

### 1. Reset / Ingest Incident (00:00 - 00:20)
In the Command Center or via terminal:
```bash
curl -X POST http://localhost:8000/api/alexa/reset
```
- **Observed State**: Service degraded, active deployment `checkout-v42`, HTTP 5xx error rate elevated to **18.4%**.
- **Evidence Ledger**: Initial facts stamped with label `OBSERVED`.

### 2. Conversational Intent & Investigation (00:20 - 01:20)
Voice or text input:
> *"Investigate the checkout incident and recover it if evidence supports rollback."*

```bash
curl -X POST http://localhost:8000/api/alexa/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Investigate the checkout incident and recover it if evidence supports rollback"}'
```
- RALLY invokes 7 MCP Read Tools:
  - `get_service_health`: Confirms checkout degraded.
  - `get_error_rate`: Confirms 18.4% error rate.
  - `query_logs`: Correlates unhandled `SchemaValidationError` in `order_validator.py`.
  - `get_deployment_diff`: Confirms payload validation changes in `checkout-v42`.
  - `get_dependency_health`: Confirms payment, inventory, auth dependencies healthy.
  - `get_runbook`: Fetches verified rollback remediation procedure.

### 3. Epistemic Evidence & Root Cause (01:20 - 02:00)
- **Primary Deduction**: `CHECKOUT_VALIDATION_REGRESSION` in `checkout-v42` (Agent confidence: **95%**).
- **Remediation Plan**: Rollback to `checkout-v41`. Risk Level: **HIGH** (Risk Score: 65).
- **CRITICAL SAFETY PROPERTY**: Execution status is **`NOT_EXECUTED`**. RALLY explains the plan and halts at the Governance Gate.

### 4. Human SRE Governance Decision (02:00 - 02:30)
The operator reviews the diff, blast radius, and telemetry, then approves:
```bash
curl -X POST http://localhost:8000/api/alexa/approve \
  -H "Content-Type: application/json" \
  -d '{
    "incident_id": "INC-ALEXA-GOLDEN",
    "decision": "APPROVE",
    "approver": "sre-lead@rally.internal",
    "reason": "Authorized after reviewing diff and runbook."
  }'
```
- The backend validates the request, logs the approver identity, and authorizes the `ControlledExecutor`.

### 5. Controlled Execution & Independent Verification (02:30 - 03:00)
- `ControlledExecutor` invokes MCP write tool `rollback_deployment`.
- `IndependentVerifier` performs an out-of-band telemetry sweep.
- Error rate confirmed restored to **0.70%** (< 1.0% healthy threshold).
- Active deployment reinstated: **`checkout-v41`**.
- Incident status transitions to **`RESOLVED`** with an immutable audit log.
