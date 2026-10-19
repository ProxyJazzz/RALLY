# RALLY — Product Requirements Document

**Working product name:** RALLY  
**Expanded meaning:** Agentic Reliability & Response Orchestration  
**Positioning:** An agentic operations system that investigates production incidents, coordinates evidence, proposes safe remediation, executes approved actions through controlled tools, verifies recovery, and produces an auditable incident record.

> The product name is intentionally treated as a working brand until the team performs a final trademark/domain/repository-name check.

## 1. Problem

When a production service fails, engineers must manually correlate alerts, logs, metrics, deployments, dependencies, runbooks, and recovery actions. The operational bottleneck is not lack of data; it is fragmented context and slow coordination.

RALLY is designed to turn a natural-language operational objective into a bounded investigation-and-response workflow.

Example:

> "Checkout is failing after the latest release. Investigate it, tell me what changed, and recover it if the evidence supports a rollback."

The system should not simply answer. It should:
1. Understand the objective.
2. Gather relevant context.
3. Build an evidence timeline.
4. Form and test hypotheses.
5. Produce a structured action plan.
6. Apply risk policy.
7. Ask for approval when required.
8. Execute only through allowlisted tools.
9. Verify the result.
10. Record what happened.

## 2. Target Users

### Primary
- SRE / DevOps engineers
- Platform engineers
- Backend engineers on on-call rotation
- Engineering leads responsible for production reliability

### Secondary
- Engineering managers who need incident visibility
- Developers investigating release regressions
- Security/operations teams needing auditable response workflows

## 3. Core User Story

**As an on-call engineer**, I want to describe an operational problem in natural language and have an agent investigate across multiple systems, explain the evidence, propose a safe remediation, execute only after the correct approval, and verify recovery.

## 4. Product Principles

- Evidence before conclusion.
- Plan before action.
- Human approval for consequential actions.
- Deterministic policy around nondeterministic AI.
- Every action is observable and auditable.
- Verification is mandatory after remediation.
- Simulation mode must make the demo deterministic.
- AI can recommend; policy decides whether the system may act.

## 5. MVP Scope

### Incident intake
- Natural-language incident command.
- Incident ID and lifecycle state.
- Severity classification.
- Affected-service identification.

### Investigation
- Service health inspection.
- Error-rate inspection.
- Recent deployment lookup.
- Log/event search.
- Dependency health inspection.
- Runbook retrieval.
- Evidence timeline construction.
- Competing-hypothesis scoring.

### Planning
- Structured investigation result.
- Root-cause hypothesis with confidence.
- Evidence references.
- Recommended remediation.
- Blast-radius estimate.
- Rollback path.
- Approval requirement.

### Controlled execution
- Allowlisted simulated operational tools.
- Human approval gate for risky writes.
- Idempotency key for write actions.
- Bounded retries.
- Action result capture.

### Verification
- Re-check service health.
- Compare error rate before/after.
- Confirm deployment/service state.
- Mark incident recovered, partially recovered, or unresolved.

### Audit and reporting
- Immutable event-style action timeline.
- Tool calls and results.
- Approval decisions.
- Final incident summary.
- Exportable incident report.

## 6. Hackathon Experience

The primary experience is an Alexa+ compatible agentic workflow.

The project will implement a self-hosted MCP server over Streamable HTTP, with a simulation-friendly web command center for judging and demonstration.

The web interface is not the product by itself. It is the visual command surface that exposes the same agentic workflow.

## 7. AWS Integration

Target AWS Builder integration:
- Amazon Bedrock for model inference.
- Amazon Bedrock AgentCore and/or Strands SDK where feasible and stable during implementation.
- AWS service integration should be meaningful, not decorative.
- The README and Product Feedback must explicitly document each AWS service and its role.

## 8. Non-Goals

The MVP will not:
- Execute arbitrary shell commands.
- Directly modify a real production environment.
- Autonomously perform destructive operations.
- Pretend to integrate with services that are not actually connected.
- Build a full enterprise observability replacement.
- Attempt to support every cloud provider.
- Depend on a live external production incident for the demo.

## 9. Success Metrics

### Product
- Investigation produces evidence-backed findings.
- Every proposed action has an explicit risk classification.
- High-risk actions require approval.
- Post-action verification is visible.
- Full action trace is reconstructable.

### Demo
- A complete incident can be resolved in under 2 minutes in simulation mode.
- The demo visibly crosses multiple tool boundaries.
- The agent changes state rather than only generating text.
- Recovery is verified rather than assumed.

### Engineering
- Critical workflow covered by automated tests.
- No secrets committed.
- Clean setup from README.
- Deterministic simulation path available without paid APIs.

## 10. Hackathon Alignment

The official rules require Alexa+ submissions to use a working Agent Skill or self-hosted MCP server implementing the required MCP version and Streamable HTTP, while a simulated Alexa+ path is also permitted. The rules explicitly distinguish creative agentic workflows from simple Q&A bots and basic MCP wrappers. AWS Builder rewards meaningful multi-service and agentic architecture rather than a single Bedrock call. fileciteturn1file0L11-L24 fileciteturn1file1L221-L235

The repository must contain source, assets, setup/run instructions, and the required track technology must be used at runtime for Alexa+ unless the simulated Alexa+ path is selected. fileciteturn1file0L31-L35 fileciteturn1file0L57-L69

The demo video must be under three minutes and show the project functioning on its intended platform. fileciteturn1file0L71-L79

## 11. Primary Demo Scenario

**Scenario: Release regression**

1. A simulated `checkout-api` deployment has just occurred.
2. Error rate and latency rise.
3. User says: "Investigate the checkout outage and recover it if the latest release is the cause."
4. Agent inspects health, logs, deployment history, and dependencies.
5. Agent identifies the release as the strongest evidence-backed cause.
6. Agent proposes rollback and explains evidence + blast radius.
7. UI shows approval gate.
8. User approves.
9. MCP tool performs simulated rollback.
10. Agent re-checks health and error rate.
11. Agent declares recovery and generates an incident report.

This scenario is the golden path. Every future feature must justify itself against this workflow.
