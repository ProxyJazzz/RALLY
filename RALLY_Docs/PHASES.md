# RALLY — Development Phases

The project is intentionally split into small, testable phases for Vibe Coding.

## Phase 0 — Product Lock

**Goal:** freeze product direction before implementation.

Deliver:
- PRD
- architecture
- rules
- design
- phase plan
- memory protocol
- final working name

Exit:
- golden demo scenario is unambiguous;
- no unresolved architecture conflict;
- hackathon track and mini-challenge strategy is explicit.

## Phase 1 — Foundation

Build:
- monorepo structure;
- FastAPI app;
- React app;
- PostgreSQL;
- migrations;
- environment configuration;
- health endpoints;
- logging;
- baseline tests;
- Docker Compose.

Exit:
- clean local boot;
- database migration succeeds;
- frontend reaches backend;
- CI baseline passes.

## Phase 2 — Incident Simulator

Build deterministic simulated environment:
- services;
- metrics;
- logs;
- deployments;
- dependencies;
- fault injection;
- golden release-regression scenario.

Exit:
- one command creates the broken environment;
- one command resets it;
- all simulator outputs are deterministic.

## Phase 3 — MCP Tool Layer

Build official MCP server.

Read tools:
- health;
- errors;
- logs;
- deployments;
- dependencies;
- runbooks.

Write tools:
- create incident;
- rollback;
- restart;
- update incident.

Exit:
- tools are callable over the intended transport;
- schemas are tested;
- write tools are policy-gated.

## Phase 4 — Agentic Investigation

Build:
- intent parsing;
- tool selection;
- evidence collection;
- timeline;
- hypothesis generation;
- confidence;
- structured investigation report.

Exit:
- agent can investigate the golden scenario;
- every conclusion references collected evidence;
- no action is executed yet.

## Phase 5 — Planning + Governance

Build:
- action plan;
- risk scoring;
- blast-radius estimate;
- approval gate;
- deterministic policy engine.

Exit:
- dangerous actions cannot bypass approval;
- blocked actions explain why.

## Phase 6 — Execution + Verification

Build:
- approved MCP writes;
- idempotency;
- execution trace;
- post-action health checks;
- recovery classification.

Exit:
- full loop works:

```text
intent
-> investigate
-> plan
-> approve
-> execute
-> verify
-> report
```

## Phase 7 — AWS Builder Integration

Integrate:
- Amazon Bedrock;
- selected AWS agent/runtime capability;
- documented configuration;
- failure handling;
- Product Feedback notes.

Exit:
- AWS service is actually used at runtime;
- README explains exactly where and why;
- no decorative AWS integration.

## Phase 8 — Alexa+ Track Integration

Implement:
- self-hosted MCP server;
- required protocol version;
- Streamable HTTP;
- Alexa+ testing/demo path.

Exit:
- track technology is actually imported/called;
- repo contains setup instructions;
- demo shows the intended experience.

## Phase 9 — Command Center UX

Build premium dark operations UI:
- live incident timeline;
- evidence panel;
- agent activity;
- tool calls;
- action plan;
- approval gate;
- verification result;
- audit trail.

Exit:
- UI communicates the entire agentic loop in seconds.

## Phase 10 — Hardening

- error states;
- timeout tests;
- retry tests;
- security review;
- prompt-injection tests;
- tool abuse tests;
- authorization tests;
- end-to-end tests;
- README;
- `.env.example`;
- LICENSE;
- architecture diagram.

Exit:
- fresh clone can run the demo from documented instructions.

## Phase 11 — Submission

Produce:
- <3 minute demo video;
- project description;
- screenshots;
- Product Feedback;
- AWS Builder details;
- Open Source challenge only if a meaningful additional OSS contribution is completed;
- friction log;
- final repo cleanup.

The rules require a functioning demonstration, repository access, setup/run instructions, and Product Feedback. fileciteturn1file0L31-L35 fileciteturn1file0L71-L103

## Critical Time Rule

The current date is October 19, 2026 and the submission deadline is October 23, 2026 at 12:00 PM PT. Therefore the project must prioritize a reliable vertical slice over broad feature count.

**If time becomes constrained, cut features—not safety, verification, MCP compliance, or the golden workflow.**
