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
  const isAwaitingApproval = state === 'AWAITING_APPROVAL'
  const isExecuting = state === 'APPROVED' || state === 'EXECUTING'
  const isVerifying = state === 'VERIFYING'
  const isResolved = state === 'RESOLVED' || execVerif.verification_status === 'PASSED'
  const isExecuted =
    execVerif.execution_status === 'EXECUTED' ||
    isExecuting ||
    isVerifying ||
    isResolved

  return (
    <div className="bg-rally-surface border border-rally-border rounded p-3 select-none flex flex-col justify-between font-mono">
      <div className="flex items-center justify-between pb-1.5 border-b border-rally-border text-[10px] uppercase text-rally-muted tracking-wider">
        <span>GOVERNANCE & CHANGE CONTROL</span>
        <span
          className={`font-semibold ${
            isAwaitingApproval
              ? 'text-rally-amber'
              : isResolved
              ? 'text-rally-green'
              : isExecuting
              ? 'text-rally-blue'
              : 'text-rally-secondary'
          }`}
        >
          {isAwaitingApproval
            ? 'APPROVAL REQUIRED'
            : isResolved
            ? 'VERIFIED RESTORATION'
            : isExecuting
            ? 'EXECUTING ROLLBACK'
            : 'CONTROLLED GATE'}
        </span>
      </div>

      {plan ? (
        <div className="py-2 space-y-2.5 text-xs">
          {/* Action Spec */}
          <div className="bg-rally-bg border border-rally-border rounded p-2.5">
            <div className="flex items-center justify-between text-[10px] text-rally-muted uppercase">
              <span className="font-bold text-rally-text">CHANGE PROPOSED</span>
              <span className="text-rally-red font-bold">RISK: {plan.risk_level}</span>
            </div>

            <div className="flex items-center gap-2 font-bold text-rally-text mt-1 text-xs">
              <span className="text-rally-red">checkout-v42</span>
              <span className="text-rally-muted">────────►</span>
              <span className="text-rally-green">{plan.target_deployment_id}</span>
            </div>

            <div className="text-[10px] text-rally-muted mt-1">
              BLAST RADIUS: <span className="text-rally-text">{plan.service_id}</span> • RISK SCORE: <span className="text-rally-amber">{plan.risk_score}/100</span>
            </div>
          </div>

          <div className="text-[11px] text-rally-secondary leading-snug font-sans">
            <span className="font-mono text-[10px] text-rally-muted block uppercase">REASON:</span>
            {plan.reason || 'Deployment regression supported by observed telemetry.'}
          </div>

          {/* HUMAN APPROVAL REQUIRED GATE */}
          {isAwaitingApproval && (
            <div className="pt-2 border-t border-rally-border space-y-2">
              <div className="flex items-center gap-2 text-xs text-rally-amber font-semibold">
                <span className="w-2 h-2 rounded-full bg-rally-amber animate-ping" />
                <span>⚠ HUMAN APPROVAL REQUIRED</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onReject}
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded-sm bg-rally-bg border border-rally-border hover:border-rally-red/40 text-rally-secondary hover:text-rally-red text-xs font-mono font-medium transition-colors disabled:opacity-40"
                >
                  REJECT
                </button>
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded-sm bg-rally-amber/20 hover:bg-rally-amber/30 border border-rally-amber/50 text-rally-amber font-mono font-bold text-xs transition-colors disabled:opacity-40 shadow-sm"
                >
                  {isProcessing ? 'COMMITTING…' : 'APPROVE ROLLBACK'}
                </button>
              </div>
            </div>
          )}

          {/* EXECUTION & INDEPENDENT VERIFICATION */}
          {isExecuted && (
            <div className="pt-2 border-t border-rally-border space-y-2 text-[11px]">
              {/* Execution State */}
              <div className="flex items-center justify-between text-rally-green font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rally-green" />
                  <span>
                    {isExecuting ? 'EXECUTING: checkout-v42 → checkout-v41' : 'ROLLBACK EXECUTED'}
                  </span>
                </div>
                <span>✓</span>
              </div>

              {/* Independent Verification Panel */}
              <div
                className={`p-2.5 rounded border transition-all ${
                  isResolved
                    ? 'bg-rally-green/10 border-rally-green/40 text-rally-green'
                    : 'bg-rally-bg border-rally-border text-rally-secondary'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span>INDEPENDENT VERIFICATION</span>
                  <span>{isResolved ? '✓ PASSED' : 'IN PROGRESS'}</span>
                </div>

                <div className="grid grid-cols-3 gap-1 text-[10px] text-rally-text py-1 border-t border-b border-rally-border/60">
                  <div>
                    <span className="text-rally-muted block">HEALTH</span>
                    <span className="text-rally-green font-bold">HEALTHY</span>
                  </div>
                  <div>
                    <span className="text-rally-muted block">ERROR RATE</span>
                    <span className="text-rally-green font-bold">
                      {isResolved ? '0.70%' : '18.4% → 0.70%'}
                    </span>
                  </div>
                  <div>
                    <span className="text-rally-muted block">DEPLOYMENT</span>
                    <span className="text-rally-green font-bold">checkout-v41</span>
                  </div>
                </div>

                {isResolved && (
                  <div className="text-[10px] font-bold text-rally-green mt-1">
                    ✓ RECOVERY INDEPENDENTLY VERIFIED
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-rally-muted">
          No action proposed. Remediation plan formulated following root-cause deduction.
        </div>
      )}
    </div>
  )
}
