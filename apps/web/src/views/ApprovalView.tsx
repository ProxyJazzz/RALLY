import React from 'react'
import { ActionPlan } from '../api/client'

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
  const isAwaitingApproval = state === 'AWAITING_APPROVAL'
  const isApproved = state === 'APPROVED' || state === 'EXECUTING' || state === 'VERIFYING' || state === 'RESOLVED'
  const isRejected = state === 'REJECTED'

  return (
    <div className="space-y-3 font-mono">
      {/* Workspace Header */}
      <div className="bg-rally-surface border border-rally-border rounded p-3.5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-rally-text uppercase tracking-wider">
              HUMAN GOVERNANCE & APPROVAL GATE
            </h1>
            <span
              className={`px-2 py-0.2 rounded-sm text-xs font-bold uppercase ${
                isAwaitingApproval
                  ? 'bg-rally-amber/20 text-rally-amber border border-rally-amber/40 animate-pulse'
                  : isApproved
                  ? 'bg-rally-green/20 text-rally-green border border-rally-green/40'
                  : isRejected
                  ? 'bg-rally-red/20 text-rally-red border border-rally-red/40'
                  : 'bg-rally-bg text-rally-muted border border-rally-border'
              }`}
            >
              {isAwaitingApproval
                ? 'APPROVAL REQUIRED'
                : isApproved
                ? '✓ APPROVED'
                : isRejected
                ? '✕ REJECTED'
                : 'GATE STANDBY'}
            </span>
          </div>
          <p className="text-xs text-rally-secondary font-sans mt-0.5">
            Non-repudiated operator sign-off surface preventing unauthorized production infrastructure mutation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/action-plan')}
            className="px-2.5 py-1 rounded bg-rally-bg border border-rally-border hover:border-rally-blue text-xs text-rally-secondary hover:text-rally-text"
          >
            Action Plan →
          </button>
          <button
            onClick={() => onNavigate('/execution')}
            className="px-2.5 py-1 rounded bg-rally-bg border border-rally-border hover:border-rally-blue text-xs text-rally-secondary hover:text-rally-text"
          >
            Execution Audit →
          </button>
        </div>
      </div>

      {!plan ? (
        <div className="bg-rally-surface border border-rally-border rounded p-12 text-center">
          <div className="text-rally-muted text-sm uppercase">NO APPROVAL REQUEST</div>
          <p className="text-xs text-rally-secondary font-sans mt-1">
            There is currently no remediation plan pending authorization. Trigger investigation from the Overview workspace.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Main Change Control Authorization Panel */}
          <div className="bg-rally-surface border border-rally-border rounded p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-rally-border pb-3">
              <div>
                <span className="text-xs font-bold text-rally-amber uppercase tracking-wider block">
                  PRODUCTION MUTATION AUTHORIZATION
                </span>
                <span className="text-sm font-bold text-rally-text mt-0.5 block">
                  ROLLBACK checkout-service
                </span>
              </div>
              <div className="text-right text-xs">
                <span className="text-rally-muted uppercase text-[10px] block">TARGET IDENTIFIER</span>
                <span className="text-rally-cyan font-bold">{plan.target_deployment_id}</span>
              </div>
            </div>

            {/* Change Specifications */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-rally-bg border border-rally-border rounded p-3">
                <span className="text-[10px] text-rally-muted uppercase block">DEPLOYMENT FROM</span>
                <span className="text-sm font-bold text-rally-red mt-1 block">checkout-v42</span>
                <span className="text-[10px] text-rally-muted">Active regression</span>
              </div>

              <div className="bg-rally-bg border border-rally-border rounded p-3">
                <span className="text-[10px] text-rally-muted uppercase block">DEPLOYMENT TO</span>
                <span className="text-sm font-bold text-rally-green mt-1 block">{plan.target_deployment_id}</span>
                <span className="text-[10px] text-rally-muted">Previous known-good</span>
              </div>

              <div className="bg-rally-bg border border-rally-border rounded p-3">
                <span className="text-[10px] text-rally-muted uppercase block">RISK CLASSIFICATION</span>
                <span className="text-sm font-bold text-rally-red mt-1 block">{plan.risk_level} ({plan.risk_score}/100)</span>
                <span className="text-[10px] text-rally-muted">Consequential blast radius</span>
              </div>
            </div>

            {/* Rationale & Safety Guardrails */}
            <div className="bg-rally-bg border border-rally-border rounded p-3 text-xs space-y-1.5">
              <div className="text-[10px] text-rally-muted uppercase font-bold">GOVERNANCE CONTEXT:</div>
              <p className="text-rally-secondary font-sans leading-relaxed">
                {plan.reason} Blast radius is strictly constrained to <span className="font-mono text-rally-text">{plan.service_id}</span> with reversibility available via re-deployment.
              </p>
            </div>

            {/* Decision Status / Controls */}
            {isAwaitingApproval && (
              <div className="pt-3 border-t border-rally-border space-y-3">
                <div className="p-3 bg-rally-amber/10 border border-rally-amber/40 rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rally-amber animate-ping" />
                    <span className="text-xs font-bold text-rally-amber tracking-wide">
                      OPERATOR DECISION MANDATED • CLICK BELOW TO COMMIT OR REJECT
                    </span>
                  </div>
                  <span className="text-[10px] text-rally-muted">
                    Signer: sre-lead@rally.internal
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={onReject}
                    disabled={isProcessing}
                    className="py-2.5 px-4 rounded bg-rally-bg border border-rally-border hover:border-rally-red text-rally-secondary hover:text-rally-red text-xs font-bold transition-all disabled:opacity-40"
                  >
                    ✕ REJECT ROLLBACK
                  </button>
                  <button
                    type="button"
                    onClick={onApprove}
                    disabled={isProcessing}
                    className="py-2.5 px-4 rounded bg-rally-amber text-black hover:bg-rally-amber/90 text-xs font-bold transition-all shadow-md disabled:opacity-40"
                  >
                    {isProcessing ? 'AUTHORIZING & COMMITTING…' : '✓ APPROVE ROLLBACK'}
                  </button>
                </div>
              </div>
            )}

            {isApproved && (
              <div className="p-3 bg-rally-green/10 border border-rally-green/40 rounded flex items-center justify-between text-xs text-rally-green">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">✓</span>
                  <span className="font-bold">
                    APPROVAL GRANTED • EXECUTION PERMITTED & RUNNING
                  </span>
                </div>
                <button
                  onClick={() => onNavigate('/execution')}
                  className="px-3 py-1 rounded bg-rally-green text-black font-bold hover:bg-rally-green/90 text-xs"
                >
                  View Execution Audit →
                </button>
              </div>
            )}

            {isRejected && (
              <div className="p-3 bg-rally-red/10 border border-rally-red/40 rounded flex items-center justify-between text-xs text-rally-red">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">✕</span>
                  <span className="font-bold">
                    REMEDIATION REJECTED BY OPERATOR • EXECUTION BLOCKED
                  </span>
                </div>
                <span className="text-[10px] text-rally-muted">
                  Escalated to human SRE on-call
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
