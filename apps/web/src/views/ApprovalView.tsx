import React, { useState } from 'react'
import { ActionPlan } from '../api/client'
import { RiskMatrixCard } from '../components/RiskMatrixCard'

interface ApprovalViewProps {
  plan?: ActionPlan | null
  state: string
  isProcessing: boolean
  onApprove: () => void
  onReject: () => void
  onNavigate: (route: string) => void
}

export const ApprovalView: React.FC<ApprovalViewProps> = ({
  plan,
  state,
  isProcessing,
  onApprove,
  onReject,
  onNavigate,
}) => {
  const [approverEmail, setApproverEmail] = useState('sre-lead@rally.internal')
  const [approvalReason, setApprovalReason] = useState(
    'Authorized by Lead SRE after reviewing diff, rollback safety guardrails, and telemetry logs.'
  )
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const isAwaitingApproval = state === 'AWAITING_APPROVAL' || plan?.status === 'AWAITING_APPROVAL'
  const isApproved =
    state === 'APPROVED' ||
    state === 'EXECUTING' ||
    state === 'VERIFYING' ||
    state === 'RESOLVED' ||
    plan?.status === 'APPROVED'
  const isRejected = state === 'REJECTED' || plan?.status === 'REJECTED'

  const handleConfirmApproval = () => {
    setShowConfirmModal(false)
    onApprove()
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* ── 1. CINEMATIC EDITORIAL HERO ─────────────────────────────────── */}
      <div className="relative overflow-hidden bg-obsidian border border-steel rounded p-6 sm:p-8 select-none">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-tactical-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-steel/60 pb-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-warning-amber" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-off-white font-semibold">
              HUMAN GOVERNANCE GATEWAY • AUTHORITY DECISION
            </span>
            <span className="text-steel">|</span>
            <span className="text-[10px] font-mono text-tactical-gold">
              MANDATORY AUTHORIZATION BARRIER
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('/action-plan')}
              className="px-3.5 py-1.5 rounded bg-charcoal hover:bg-graphite border border-steel text-xs font-mono text-off-white transition-colors"
            >
              ← REMEDIATION PLAN
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/execution')}
              className="px-3.5 py-1.5 rounded bg-charcoal hover:bg-graphite border border-steel text-xs font-mono text-off-white transition-colors"
            >
              EXECUTION AUDIT →
            </button>
          </div>
        </div>

        <div className="max-w-3xl">
          <div className="font-editorial italic text-tactical-gold text-base sm:text-lg mb-1">
            "Intelligence proposes. Authority decides."
          </div>
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl tracking-tight text-off-white leading-none uppercase">
            GOVERNANCE GATE
          </h1>
          <p className="font-sans text-sm sm:text-base text-ash mt-3 leading-relaxed">
            RALLY enforces a Human SRE Governance Authorization barrier before applying any production mutation. Autonomous agents are permanently restricted from self-executing destructive operations.
          </p>
        </div>
      </div>

      {!plan ? (
        <div className="bg-obsidian border border-steel rounded p-16 text-center">
          <span className="text-ash font-mono text-2xl block mb-2">🛡</span>
          <div className="text-ash font-mono text-sm uppercase tracking-widest">
            GATEWAY STANDBY • NO ACTION PENDING
          </div>
          <p className="text-xs text-ash/80 font-sans mt-2 max-w-md mx-auto">
            The governance gate remains in standby until root cause deduction formulates a remediation action plan.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/overview')}
            className="mt-4 px-4 py-2 rounded bg-charcoal border border-steel hover:border-tactical-gold text-xs font-mono text-tactical-gold transition-colors"
          >
            ← Back to Overview
          </button>
        </div>
      ) : (
        <>
          {/* ── 2. HIGH-STAKES APPROVAL SPECIFICATION BANNER ──────────────── */}
          <div className="bg-obsidian border border-steel rounded p-6 sm:p-8 select-none">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-steel/60 pb-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-warning-amber font-bold">
                  PROPOSED PRODUCTION MUTATION SPECIFICATION
                </span>
                <h2 className="font-display text-4xl sm:text-5xl text-off-white tracking-wide uppercase leading-tight mt-1">
                  ROLLBACK {plan.service_id}
                </h2>
                <div className="flex items-center gap-2 mt-2 font-mono text-xs">
                  <span className="text-ash">PLAN ID:</span>
                  <span className="text-off-white font-bold">{plan.plan_id}</span>
                  <span className="text-steel">|</span>
                  <span className="text-ash">MUTATION TOOL:</span>
                  <span className="text-signal-cyan font-bold">{plan.action_type}</span>
                </div>
              </div>

              {/* Version Comparison */}
              <div className="bg-charcoal border border-steel/80 p-4 rounded flex items-center gap-4 shrink-0 font-mono">
                <div>
                  <span className="text-[9px] text-ash block uppercase">CURRENT STATE</span>
                  <span className="text-crimson font-bold text-base block mt-0.5 line-through">
                    checkout-v42
                  </span>
                </div>
                <span className="text-ash text-lg">────────►</span>
                <div>
                  <span className="text-[9px] text-ash block uppercase">AUTHORIZED TARGET</span>
                  <span className="text-success-green font-bold text-base block mt-0.5">
                    {plan.target_deployment_id}
                  </span>
                </div>
              </div>
            </div>

            {/* Risk & Safety Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-6">
              <div className="lg:col-span-7">
                <RiskMatrixCard
                  level={plan.risk_level}
                  score={plan.risk_score}
                  serviceId={plan.service_id}
                  reason={plan.reason}
                />
              </div>

              <div className="lg:col-span-5 bg-charcoal/70 border border-steel/80 p-5 rounded flex flex-col justify-between font-sans">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-tactical-gold font-bold block mb-2">
                    SAFETY GUARDRAILS ASSERTION
                  </span>
                  <ul className="space-y-2 text-xs font-mono text-off-white/90">
                    <li className="flex items-start gap-2">
                      <span className="text-success-green font-bold">✓</span>
                      <span>Zero schema migrations required for rollback</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success-green font-bold">✓</span>
                      <span>Precondition revalidation enforced before execution</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success-green font-bold">✓</span>
                      <span>Independent post-action telemetry probing mandated</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-3 border-t border-steel/60 font-mono text-[10px] text-ash">
                  POLICY: AppDev Governance Rule #2026-R4
                </div>
              </div>
            </div>
          </div>

          {/* ── 3. VISUAL GOVERNANCE AUTHORIZATION BARRIER ─────────────────── */}
          <div className="bg-obsidian border border-warning-amber/60 rounded p-6 sm:p-8 select-none shadow-tactical-gold">
            <div className="flex items-center justify-between pb-3 border-b border-steel/60 text-[10px] font-mono uppercase text-ash tracking-wider">
              <span className="flex items-center gap-2 text-warning-amber font-bold">
                <span className="w-2 h-2 rounded-full bg-warning-amber animate-pulse" />
                HUMAN OPERATOR AUTHORIZATION BARRIER
              </span>
              <span>SIGNATURE REQUIRED</span>
            </div>

            {isAwaitingApproval && (
              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-ash tracking-wider block mb-1">
                      AUTHORIZED SRE SIGNER EMAIL
                    </label>
                    <input
                      type="text"
                      value={approverEmail}
                      onChange={(e) => setApproverEmail(e.target.value)}
                      className="w-full bg-charcoal border border-steel rounded px-3 py-2 text-xs font-mono text-off-white focus:outline-none focus:border-tactical-gold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-ash tracking-wider block mb-1">
                      AUDIT-LOGGED OPERATOR APPROVAL JUSTIFICATION
                    </label>
                    <input
                      type="text"
                      value={approvalReason}
                      onChange={(e) => setApprovalReason(e.target.value)}
                      className="w-full bg-charcoal border border-steel rounded px-3 py-2 text-xs font-sans text-off-white focus:outline-none focus:border-tactical-gold"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-steel/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs font-mono text-ash">
                    Clicking APPROVE will authorize RALLY Controlled Executor to dispatch{' '}
                    <strong className="text-signal-cyan font-bold">{plan.action_type}</strong>.
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={onReject}
                      disabled={isProcessing}
                      className="flex-1 sm:flex-none px-5 py-2.5 rounded bg-charcoal hover:bg-graphite border border-crimson/50 hover:border-crimson text-crimson text-xs font-mono font-bold transition-all disabled:opacity-40"
                    >
                      ✕ REJECT MUTATION
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmModal(true)}
                      disabled={isProcessing}
                      className="flex-1 sm:flex-none px-6 py-2.5 rounded bg-tactical-gold hover:bg-tactical-gold/90 text-void-black text-xs font-mono font-bold transition-all shadow-tactical-gold disabled:opacity-40"
                    >
                      {isProcessing ? 'AUTHORIZING & COMMITTING…' : '✓ APPROVE & EXECUTE ROLLBACK'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isApproved && (
              <div className="mt-6 p-4 rounded bg-success-green/10 border border-success-green/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-success-green/20 text-success-green flex items-center justify-center font-bold">
                    ✓
                  </span>
                  <div>
                    <span className="text-success-green font-bold text-sm block">
                      PRODUCTION MUTATION AUTHORIZED & COMMITTED
                    </span>
                    <span className="text-ash text-xs mt-0.5 block">
                      Signed by {approverEmail} • Dispatched to Controlled Executor
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('/execution')}
                  className="px-4 py-2 rounded bg-success-green text-void-black text-xs font-mono font-bold hover:bg-success-green/90 transition-all shrink-0"
                >
                  Inspect Execution Audit →
                </button>
              </div>
            )}

            {isRejected && (
              <div className="mt-6 p-4 rounded bg-crimson/10 border border-crimson/40 text-xs font-mono text-crimson flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm block">
                    REMEDIATION REJECTED BY OPERATOR • MUTATION BLOCKED
                  </span>
                  <span className="text-ash text-xs mt-0.5 block">
                    Action halted. Incident escalated to human SRE on-call rotation.
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── 4. CONFIRMATION MODAL ─────────────────────────────────────── */}
      {showConfirmModal && plan && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="bg-obsidian border border-warning-amber/70 rounded p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-steel/60">
              <span className="font-display text-xl text-off-white uppercase">
                CONFIRM PRODUCTION MUTATION
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-warning-amber text-void-black font-bold">
                HIGH RISK
              </span>
            </div>

            <p className="text-xs font-sans text-ash leading-relaxed">
              You are authorizing an infrastructure rollback of <strong className="text-off-white font-mono">{plan.service_id}</strong> from <strong className="text-crimson font-mono">checkout-v42</strong> to <strong className="text-success-green font-mono">{plan.target_deployment_id}</strong>.
            </p>

            <div className="p-3 rounded bg-charcoal border border-steel/80 font-mono text-xs space-y-1">
              <div>
                <span className="text-ash">SIGNER: </span>
                <span className="text-off-white">{approverEmail}</span>
              </div>
              <div>
                <span className="text-ash">REVERSIBILITY: </span>
                <span className="text-success-green font-bold">HIGH</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-steel/60 font-mono text-xs">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded bg-charcoal text-ash hover:text-off-white border border-steel"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                className="px-5 py-2 rounded bg-tactical-gold text-void-black font-bold hover:bg-tactical-gold/90 shadow-tactical-gold"
              >
                CONFIRM AUTHORIZATION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
