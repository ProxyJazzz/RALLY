# RALLY — Development Memory

> This file is the persistent working memory for Vibe Coding. It must be updated after every meaningful implementation task or phase.

## Project Identity

**Name:** RALLY  
**Expanded meaning:** Agentic Reliability & Response Orchestration  
**Current status:** Phase 0 — Product Lock  
**Primary track:** Alexa+  
**Target mini challenge:** AWS Builder  
**Optional mini challenge:** Open Source, only if a meaningful qualifying contribution is completed.

## Product North Star

RALLY transforms a natural-language operational objective into a bounded, evidence-grounded, approval-aware, verifiable response workflow.

## Golden Scenario

Release regression in `checkout-api`:
- recent deployment;
- error rate rises;
- latency rises;
- agent correlates telemetry + deployment;
- proposes rollback;
- human approves;
- rollback executes in simulator;
- health recovers;
- agent verifies and reports.

## Current Completed Work

- Competition requirements reviewed.
- Alexa+ identified as the strongest primary track.
- Agentic orchestration selected as the core architecture.
- Household-assistant direction rejected in favor of a high-value engineering operations problem.
- Product documentation structure defined.
- Working product name changed from SYNTRA.AI to RALLY.

## Current File Being Worked On

`MEMORY.md`

## Next Task

Create the Git repository and begin Phase 1:
- initialize monorepo;
- add documentation;
- create FastAPI skeleton;
- create React/Vite skeleton;
- create PostgreSQL service;
- add Docker Compose;
- add baseline tests.

## Decisions

### Decision: Use simulator-first execution
Reason: deterministic judging and safety. Real production actions are out of scope.

### Decision: MCP is a real runtime boundary
Reason: Alexa+ requires genuine track technology use for the MCP path.

### Decision: AI is not the policy engine
Reason: nondeterministic model output must not directly determine consequential system actions.

### Decision: Verification is mandatory
Reason: an action being executed does not prove recovery.

## Open Questions

- Final legal/brand/domain availability check for RALLY.
- Exact Bedrock model selection.
- Exact Strands/AgentCore integration after compatibility testing.
- Final Alexa+ testing path.
- Whether a meaningful Open Source contribution can be completed before submission.

## Vibe Coding Protocol

Before every implementation task:
1. Read this file.
2. Read the relevant phase in `PHASES.md`.
3. Read constraints in `RULES.md`.
4. Read affected architecture in `ARCHITECTURE.md`.
5. Implement only the current task.
6. Run relevant tests.
7. Update this file.

After every task record:
- Date
- Phase
- What changed
- Files created/modified
- Tests run
- Known issues
- Next action

## Change Log

### 2026-10-19
- Created project foundation documents.
- Reframed the project around agentic production reliability and incident response.
- Established simulator-first, evidence-grounded, human-gated execution.
