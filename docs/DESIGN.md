# RALLY — Design System

## 1. Design Direction

**Theme:** Dark Reliability Command Center

The interface should feel like professional operational software, not a generic AI chat application.

Visual references:
- modern observability console;
- mission-control interface;
- security operations center;
- premium developer tooling.

Avoid:
- excessive glassmorphism;
- rainbow gradients;
- generic dashboard cards;
- oversized hero sections;
- chatbot-only layouts.

## 2. Color System

### Base
- Deep Black: `#07090C`
- Charcoal: `#0D1117`
- Graphite: `#151A21`
- Elevated Surface: `#1B222C`
- Border: `#28313C`

### Text
- Primary: `#F4F7FA`
- Secondary: `#AAB4C0`
- Muted: `#6F7A86`

### Semantic
- Healthy: `#35D07F`
- Information: `#4DA3FF`
- Warning: `#F2B84B`
- Critical: `#FF4D5A`
- Neutral: `#8D99A6`

Use semantic colors sparingly. Status should be immediately understandable without relying only on color.

## 3. Typography

Preferred:
- UI/body: Inter
- Technical/telemetry: JetBrains Mono

Hierarchy:
- Page title: 28–32px / semibold
- Section title: 18–20px / semibold
- Body: 14–16px / regular
- Metadata: 12–13px
- Telemetry/code: 12–13px monospace

## 4. Layout

Primary desktop structure:

```text
┌──────────────────────────────────────────────────────────────┐
│ TOP BAR: incident / environment / status                    │
├───────────────┬───────────────────────────┬──────────────────┤
│ Incident      │ Investigation Timeline   │ Decision / Risk │
│ Context       │ Evidence + Agent Activity │ Approval         │
│               │                           │ Verification     │
├───────────────┴───────────────────────────┴──────────────────┤
│ TOOL / EVENT STREAM                                           │
└──────────────────────────────────────────────────────────────┘
```

The main screen should communicate:
1. What is broken?
2. What does the agent know?
3. What is it doing?
4. What does it want to do?
5. Is human approval needed?
6. Did the system recover?

## 5. Interaction Rules

- Actions should have visible state.
- Approval should be unmistakable.
- Tool calls should be inspectable.
- Evidence should be distinguishable from AI inference.
- Use progressive disclosure for technical detail.
- Never hide a failed action behind a generic toast.

## 6. Evidence Presentation

Use explicit labels:

`OBSERVED`
`INFERRED`
`PROPOSED`
`APPROVED`
`EXECUTED`
`VERIFIED`

This prevents users from confusing AI hypotheses with system facts.

## 7. Motion

Use restrained motion:
- timeline events enter subtly;
- active tool execution can pulse;
- approval state can transition clearly;
- verification can animate from pending to confirmed.

Avoid continuous decorative animation.

## 8. Responsive Priority

Primary judging target:
- desktop 1440px.

Secondary:
- 1280px.
- 1024px.

Mobile is not an MVP priority.

## 9. Accessibility

- Keyboard navigation.
- Visible focus states.
- Semantic buttons.
- ARIA labels where required.
- Do not encode meaning only through color.
- Respect reduced-motion preferences.

## 10. Brand Voice

Use concise operational language.

Good:
> Rollback recommended — evidence confidence 91%.

Bad:
> The AI thinks maybe we should probably consider rolling back.

Good:
> Approval required: production write action.

Bad:
> Uh-oh! The AI wants to do something risky.

## 12. Alexa+ Simulation Workspace (Phase 8B)

The Alexa+ simulation workspace combines natural conversational intelligence with the dense, mission-control reliability console:

- **Conversational Panel**: Left rail displaying user commands, assistant speech, and suggestion chips. Styled like a professional terminal dialogue.
- **Investigation & Execution Timeline**: Chronological, icon-badged steps showing exact MCP tools invoked, latency, and operational outcomes.
- **Strict Epistemic Evidence Ledger**: Badged cards distinguishing `OBSERVED`, `INFERRED`, `PROPOSED`, `APPROVED`, `EXECUTED`, and `VERIFIED`.
- **Governance Approval Gate**: High-visibility risk box and explicit `[APPROVE ROLLBACK]` / `[REJECT]` buttons enforcing human-in-the-loop authorization.
- **Recovery & Verification Panel**: Displays reinstated deployment version, independently verified error rate, and final `RESOLVED` classification.
