# RALLY — Engineering Rules

This file is binding for Vibe Coding. Antigravity must treat these rules as constraints, not suggestions.

## 1. General Rule

**Do not make the fastest implementation the default implementation. Make the smallest implementation that preserves the intended architecture.**

## 2. AI Boundaries

AI MAY:
- interpret natural-language intent;
- select from known tools;
- summarize evidence;
- rank hypotheses;
- generate an investigation plan;
- propose remediation;
- generate human-readable incident reports.

AI MUST NOT:
- execute arbitrary shell commands;
- invent tool results;
- bypass policy;
- bypass approval;
- directly mutate the database to force state transitions;
- mark recovery successful without verification;
- fabricate evidence or citations;
- access secrets through prompts;
- create new tools dynamically during runtime;
- expand its own permissions.

## 3. Tool Boundaries

Every tool must be:
- explicitly registered;
- schema validated;
- categorized as READ or WRITE;
- permission checked;
- timeout protected;
- audited.

No generic `execute_command(command: string)` tool.

No generic `http_request(url: string, method: string, body: any)` tool.

No tool should expose credentials to the model.

## 4. Write Actions

Write actions are more dangerous than read actions.

Default policy:
- READ: agent may perform automatically.
- LOW-RISK WRITE: may execute automatically only if explicitly allowlisted.
- MEDIUM-RISK WRITE: human approval required.
- HIGH-RISK WRITE: human approval required and may be disabled in simulation.
- DESTRUCTIVE / IRREVERSIBLE: disabled for MVP.

## 5. Production Boundary

The hackathon build must use a simulator or isolated sandbox for consequential actions.

Never connect the demo agent to a real production environment.

Never execute:
- `rm`
- arbitrary shell
- arbitrary SQL
- unrestricted Kubernetes commands
- unrestricted AWS CLI
- real infrastructure destruction

## 6. Database Rules

- PostgreSQL is the source of truth.
- Use migrations.
- No schema mutation from application startup.
- Use transactions for multi-step state changes.
- Never store secrets in database rows unless explicitly required and securely designed.
- Every operational write must produce an audit event.

## 7. API Rules

- Validate all external inputs with Pydantic/Zod.
- Return structured errors.
- Do not expose stack traces to clients.
- Use stable error codes.
- Use HTTP status codes correctly.
- Add request IDs to backend logs.
- Avoid leaking provider/API keys in errors.

## 8. Error Handling

Errors must be classified as:
- validation,
- authentication/authorization,
- dependency,
- timeout,
- tool execution,
- model/provider,
- policy,
- verification,
- internal.

Transient errors may retry only when the operation is safe and idempotent.

Never blindly retry a write operation.

## 9. LLM Output

All structured model output must be validated against a typed schema.

If parsing fails:
1. Record the failure.
2. Retry only within a small fixed budget.
3. Fall back to a deterministic safe state.
4. Escalate to human when required.

Never use `eval()`.

Never execute model-generated code.

## 10. MCP Rules

- Use the official MCP implementation.
- Follow the required protocol version for the submission.
- Use Streamable HTTP for the production submission path.
- Tool schemas must be explicit.
- Tool descriptions must explain safety boundaries.
- Tool results must be structured.
- MCP server logs must not expose secrets.

## 11. Dependencies

Prefer:
- official SDKs,
- stable maintained libraries,
- minimal dependency count.

Avoid:
- unnecessary agent frameworks,
- multiple overlapping state-management libraries,
- abandoned packages,
- libraries added only for visual novelty,
- opaque wrappers when an official SDK exists.

Do not add a dependency without documenting why it is needed.

## 12. Frontend Rules

- No fake buttons.
- No static dashboard pretending to be live.
- Every displayed action state must come from application state.
- Loading, empty, success, blocked, and failure states are required.
- Do not hide errors.
- Do not overuse cards.
- Prefer a command-center layout over generic SaaS card grids.

## 13. Testing

Every phase must add tests for critical behavior.

Minimum:
- unit tests for policy engine;
- unit tests for state transitions;
- MCP tool contract tests;
- agent schema validation tests;
- integration tests for the golden incident;
- end-to-end test for approval -> execution -> verification.

## 14. Git Rules

Branch pattern:

```text
main
develop
feature/<phase>-<name>
fix/<issue>
```

Commit style:

```text
feat:
fix:
test:
docs:
refactor:
chore:
```

Do not make one giant commit after vibe coding an entire phase.

## 15. Vibe Coding Rules

Antigravity must:
1. Read `PRD.md`.
2. Read `ARCHITECTURE.md`.
3. Read `RULES.md`.
4. Read `PHASES.md`.
5. Read `MEMORY.md`.
6. Work only on the current phase.
7. Inspect existing code before creating new abstractions.
8. Run tests after meaningful changes.
9. Update `MEMORY.md` at the end of each completed task.
10. Stop when the phase exit criteria are met.

## 16. No Scope Creep

If a requested feature is not in the current phase:
- record it as a future item;
- do not implement it unless it is required to unblock the current phase.

## 17. Demo Reliability Rule

The simulator is a first-class implementation, not a mock added at the last minute.

The golden scenario must run deterministically without depending on a live third-party service.

## 18. Hackathon Compliance

The repository must include clear setup/run instructions and all required source/assets. Public repositories need an open-source license. Alexa+/Bee/Ring runtime requirements must be genuinely implemented, not merely described. fileciteturn1file0L31-L37 fileciteturn1file0L48-L57

The demo video must be under three minutes and publicly accessible on YouTube or Vimeo. fileciteturn1file0L71-L79

Product Feedback must cover each tool/API/SDK, including what worked, what needs work, onboarding, and whether the team would use it again. AWS Builder submissions must describe AWS services used. fileciteturn1file0L81-L103

## 19. Friction Log

Whenever an official developer tool produces meaningful friction, record:
- task attempted;
- steps;
- expected;
- actual;
- severity;
- workaround;
- actionable suggestion.

The official rules state friction logs can contribute up to a 10% judging bonus during Stage One downselection. fileciteturn1file0L105-L107
