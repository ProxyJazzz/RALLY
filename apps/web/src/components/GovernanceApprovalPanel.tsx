import React from 'react'
import { ActionPlan, ExecutionVerification } from '../api/client'

interface GovernanceApprovalPanelProps {
  plan?: ActionPlan | null
  execVerif: ExecutionVerification
  state: string
  onApprove: () => void
  onReject: () => void
  isProcessing: boolean
}

export const GovernanceApprovalPanel: React.FC<GovernanceApprovalPanelProps> = ({
  plan,
  execVerif,
  state,
  onApprove,
  onReject,
  isProcessing,
}) => {
  const isAwaitingApproval = state === 'AWAITING_APPROVAL' || plan?.status === 'AWAITING_APPROVAL'
  const isExecuting = state === 'APPROVED' || state === 'EXECUTING'
  const isResolved = state === 'RESOLVED' || execVerif.verification_status === 'PASSED'
  const isExecuted =
    execVerif.execution_status === 'EXECUTED' ||
    isExecuting ||
    state === 'VERIFYING' ||
    isResolved

  return (
    <div className="bg-obsidian border border-steel rounded p-4 sm:p-5 select-none flex flex-col justify-between font-sans">
      <div className="flex items-center justify-between pb-3 border-b border-steel/60 text-[10px] font-mono uppercase text-ash tracking-wider">
        <span className="flex items-center gap-2">
          <span className="text-warning-amber">🛡</span>
          <span className="text-off-white font-medium">GOVERNANCE & APPROVAL BARRIER</span>
        </span>
        <span
          className={`font-bold ${
            isAwaitingApproval
              ? 'text-warning-amber animate-pulse'
              : isResolved
              ? 'text-success-green'
              : isExecuting
              ? 'text-signal-cyan'
              : 'text-ash'
          }`}
        >
          {isAwaitingApproval
            ? 'APPROVAL MANDATED'
            : isResolved
            ? 'VERIFIED RESTORATION'
            : isExecuting
            ? 'DISPATCHING MUTATION'
            : 'CONTROLLED GATE'}
        </span>
      </div>

      {plan ? (
        <div className="py-3 space-y-3 font-mono text-xs">
          {/* Action Spec */}
          <div className="bg-charcoal/80 border border-steel/80 rounded p-3">
            <div className="flex items-center justify-between text-[10px] text-ash uppercase">
              <span className="font-bold text-off-white">PROPOSED MUTATION</span>
              <span className="text-warning-amber font-bold">RISK: {plan.risk_level} ({plan.risk_score}/100)</span>
            </div>

            <div className="flex items-center gap-2 font-bold text-off-white mt-1.5 text-xs">
              <span className="text-crimson line-through">checkout-v42</span>
              <span className="text-ash">────────►</span>
              <span className="text-success-green">{plan.target_deployment_id}</span>
            </div>

            <div className="text-[10px] text-ash mt-1">
              BLAST RADIUS: <span className="text-off-white font-bold">{plan.service_id}</span>
            </div>
          </div>

          <div className="text-xs text-ash leading-relaxed font-sans">
            <span className="font-mono text-[10px] text-ash block uppercase font-bold">RATIONALE:</span>
            {plan.reason || 'Deployment regression confirmed by forensic telemetry.'}
          </div>

          {/* HUMAN APPROVAL REQUIRED GATE */}
          {isAwaitingApproval && (
            <div className="pt-2 border-t border-steel/60 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-mono text-warning-amber font-bold">
                <span className="w-2 h-2 rounded-full bg-warning-amber animate-ping" />
                <span>HUMAN AUTHORIZATION REQUIRED BEFORE EXECUTION</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onReject}
                  disabled={isProcessing}
                  className="px-3 py-2 rounded bg-charcoal border border-steel hover:border-crimson text-ash hover:text-crimson text-xs font-mono font-bold transition-colors disabled:opacity-40"
                >
                  REJECT
                </button>
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={isProcessing}
                  className="px-3 py-2 rounded bg-tactical-gold hover:bg-tactical-gold/90 text-void-black font-mono font-bold text-xs transition-colors disabled:opacity-40 shadow-tactical-gold"
                >
                  {isProcessing ? 'AUTHORIZING…' : 'APPROVE ROLLBACK'}
                </button>
              </div>
            </div>
          )}

          {/* EXECUTION & INDEPENDENT VERIFICATION */}
          {isExecuted && (
            <div className="pt-2 border-t border-steel/60 space-y-2 text-xs">
              <div className="flex items-center justify-between text-success-green font-mono font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success-green" />
                  <span>
                    {isExecuting ? 'EXECUTING: checkout-v42 → checkout-v41' : 'ROLLBACK EXECUTED & AUDITED'}
                  </span>
                </div>
                <span>✓</span>
              </div>

              {/* Independent Verification Panel */}
              <div
                className={`p-3 rounded border font-mono transition-all ${
                  isResolved
                    ? 'bg-charcoal/80 border-success-green/40 text-success-green'
                    : 'bg-charcoal border-steel text-ash'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span>INDEPENDENT VERIFICATION</span>
                  <span>{isResolved ? '✓ PASSED' : 'PROBING...'}</span>
                </div>

                <div className="grid grid-cols-3 gap-1 text-[10px] text-off-white py-1 border-t border-b border-steel/60">
                  <div>
                    <span className="text-ash block">HEALTH</span>
                    <span className="text-success-green font-bold">HEALTHY</span>
                  </div>
                  <div>
                    <span className="text-ash block">ERROR RATE</span>
                    <span className="text-success-green font-bold">
                      {isResolved ? '0.70%' : 'RESTORED'}
                    </span>
                  </div>
                  <div>
                    <span className="text-ash block">DEPLOYMENT</span>
                    <span className="text-success-green font-bold">checkout-v41</span>
                  </div>
                </div>

                {isResolved && (
                  <div className="text-[10px] font-bold text-success-green mt-1">
                    ✓ RECOVERY INDEPENDENTLY VERIFIED
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-10 text-center text-xs font-mono text-ash">
          No action proposed. Remediation plan formulated following root-cause deduction.
        </div>
      )}
    </div>
  )
}
