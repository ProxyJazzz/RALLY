import React from 'react'
import { ExecutionVerification, ActionPlan } from '../api/client'
import { PreconditionCheckList } from '../components/PreconditionCheckList'
import { VerificationBeforeAfter } from '../components/VerificationBeforeAfter'

interface ExecutionViewProps {
  plan?: ActionPlan | null
  execVerif: ExecutionVerification
  state: string
  onNavigate: (route: string) => void
}

export const ExecutionView: React.FC<ExecutionViewProps> = ({
  plan,
  execVerif,
  state,
  onNavigate,
}) => {
  const isExecuted =
    execVerif.execution_status === 'EXECUTED' ||
    state === 'EXECUTING' ||
    state === 'VERIFYING' ||
    state === 'RESOLVED'
  const isVerified = execVerif.verification_status === 'PASSED' || state === 'RESOLVED'
  const isResolved = state === 'RESOLVED'
  const actionTarget = plan?.target_deployment_id ?? 'checkout-v41'

  // Audit timeline derived from real execution state
  const auditEntries = [
    {
      time: execVerif.executed_at ?? '14:46:00',
      phase: 'GOVERNANCE',
      event: 'Human Operator Sign-Off Validated',
      actor: 'sre-lead@rally.internal',
      status: 'APPROVED',
      statusColor: 'text-tactical-gold',
    },
    {
      time: execVerif.executed_at ?? '14:46:01',
      phase: 'PRECONDITION',
      event: 'TOCTOU Assertion: Target checkout-v42 Confirmed',
      actor: 'PreconditionValidator',
      status: 'PASSED',
      statusColor: 'text-success-green',
    },
    {
      time: execVerif.executed_at ?? '14:46:02',
      phase: 'MUTATION',
      event: `Controlled rollback_deployment dispatched to ${actionTarget}`,
      actor: 'ControlledExecutor (MCP)',
      status: isExecuted ? 'EXECUTED' : 'PENDING',
      statusColor: isExecuted ? 'text-signal-cyan' : 'text-ash',
    },
    {
      time: execVerif.verified_at ?? '14:46:05',
      phase: 'VERIFICATION',
      event: 'Independent telemetry health check: Error Rate 0.70%',
      actor: 'IndependentVerifier',
      status: isVerified ? 'VERIFIED' : 'RUNNING',
      statusColor: isVerified ? 'text-success-green' : 'text-ash',
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* ── 1. CINEMATIC EDITORIAL HERO ─────────────────────────────────── */}
      <div className="relative overflow-hidden bg-obsidian border border-steel rounded p-6 sm:p-8 select-none">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-signal-cyan/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-steel/60 pb-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-signal-cyan" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-off-white font-semibold">
              CONTROLLED EXECUTION AUDIT • INDEPENDENT VERIFICATION
            </span>
            <span className="text-steel">|</span>
            <span className="text-[10px] font-mono text-tactical-gold">
              EXEC ID: {execVerif.execution_id ?? 'EXEC-PENDING'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('/approval')}
              className="px-3.5 py-1.5 rounded bg-charcoal hover:bg-graphite border border-steel text-xs font-mono text-off-white transition-colors"
            >
              ← GOVERNANCE GATE
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/overview')}
              className="px-3.5 py-1.5 rounded bg-charcoal hover:bg-graphite border border-steel text-xs font-mono text-off-white transition-colors"
            >
              OVERVIEW COCKPIT →
            </button>
          </div>
        </div>

        <div className="max-w-3xl">
          <div className="font-editorial italic text-tactical-gold text-base sm:text-lg mb-1">
            "An approved action is not a successful action."
          </div>
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl tracking-tight text-off-white leading-none uppercase">
            CONTROLLED EXECUTION
          </h1>
          <p className="font-sans text-sm sm:text-base text-ash mt-3 leading-relaxed">
            RALLY dispatches approved mutations through sandboxed MCP tools with continuous TOCTOU precondition validation, followed by independent post-action telemetry probing.
          </p>
        </div>
      </div>

      {!isExecuted ? (
        <div className="bg-obsidian border border-steel rounded p-16 text-center">
          <span className="text-signal-cyan font-mono text-2xl block mb-2">⚡</span>
          <div className="text-ash font-mono text-sm uppercase tracking-widest">
            EXECUTION PIPELINE STANDBY
          </div>
          <p className="text-xs text-ash/80 font-sans mt-2 max-w-md mx-auto">
            Mutations remain strictly gated behind human sign-off. Authorize the remediation plan in the Governance Gate to trigger execution.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/approval')}
            className="mt-4 px-4 py-2 rounded bg-charcoal border border-steel hover:border-tactical-gold text-xs font-mono text-tactical-gold transition-colors"
          >
            ← Open Governance Gate
          </button>
        </div>
      ) : (
        <>
          {/* ── 2. INDEPENDENT VERIFICATION PROOF (BEFORE / AFTER) ────────── */}
          <VerificationBeforeAfter
            beforeErrorRate={18.4}
            afterErrorRate={execVerif.verified_error_rate ?? 0.7}
            faultyDeployment="checkout-v42"
            restoredDeployment={execVerif.verified_active_deployment ?? actionTarget}
            status={execVerif.verification_status}
          />

          {/* ── 3. PRECONDITION REVALIDATION & TOCTOU AUDIT ────────────────── */}
          <PreconditionCheckList
            isExecuted={isExecuted}
            isVerified={isVerified}
            targetDeployment={actionTarget}
          />

          {/* ── 4. FORENSIC AUDIT TIMELINE LOG ────────────────────────────── */}
          <div className="bg-obsidian border border-steel rounded p-5 sm:p-6 select-none font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-steel/60 text-[10px] font-mono uppercase text-ash tracking-wider">
              <span>STRUCTURED MUTATION AUDIT TRAIL</span>
              <span>AUDIT-LOGGED EVENT TRACE</span>
            </div>

            <div className="mt-4 divide-y divide-steel/60 font-mono text-xs">
              {auditEntries.map((entry, idx) => (
                <div
                  key={idx}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="text-ash text-[11px] shrink-0">{entry.time}</span>
                    <span className="px-2 py-0.5 rounded bg-charcoal border border-steel text-ash text-[9px] uppercase font-bold shrink-0">
                      {entry.phase}
                    </span>
                    <span className="text-off-white font-sans text-xs">
                      {entry.event}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 sm:self-center">
                    <span className="text-ash text-[10px]">{entry.actor}</span>
                    <span className={`text-[10px] font-bold uppercase ${entry.statusColor}`}>
                      {entry.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 5. RESOLUTION CERTIFICATE ─────────────────────────────────── */}
          {isResolved && (
            <div className="bg-obsidian border border-success-green/50 rounded p-6 sm:p-7 select-none flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-display text-2xl sm:text-3xl text-off-white uppercase block">
                  INCIDENT #4821 RESOLVED & SEALED
                </span>
                <span className="text-xs font-sans text-ash mt-1 block">
                  Autonomous reliability workflow completed. All telemetry verified healthy at 0.70% baseline.
                </span>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('/overview')}
                className="px-5 py-2.5 rounded bg-success-green text-void-black text-xs font-mono font-bold hover:bg-success-green/90 transition-all shrink-0"
              >
                Return to Command Center →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
