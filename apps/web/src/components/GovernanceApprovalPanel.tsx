import React from 'react'
import { ActionPlan, ExecutionVerification } from '../api/client'

interface GovernanceApprovalPanelProps {
  plan: ActionPlan | null | undefined
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
  const isAwaitingApproval = state === 'AWAITING_APPROVAL' && plan?.approval_required

  return (
    <div className="bg-rally-surface border border-rally-border rounded-lg p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between pb-3 border-b border-rally-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rally-critical" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-rally-text">
            Deterministic Governance & Approval Gate
          </span>
        </div>
        <span className="text-[10px] font-mono text-rally-muted">
          Phase 5/6 Boundary Protected
        </span>
      </div>

      {/* Plan Details & Approval Callout */}
      {!plan ? (
        <div className="text-xs font-mono text-rally-muted py-4 text-center">
          No remediation plan currently active.
        </div>
      ) : (
        <div className="space-y-3 text-xs">
          {/* Status Box */}
          <div className="p-3 rounded bg-rally-graphite border border-rally-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-rally-muted font-mono">Proposed Action:</span>
              <span className="text-rally-text font-mono font-semibold uppercase">
                {plan.action_type}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-rally-muted font-mono">Target Service / Version:</span>
              <span className="text-rally-text font-mono">
                {plan.service_id} → {plan.target_deployment_id}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-rally-muted font-mono">Risk Level:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rally-critical/15 text-rally-critical border border-rally-critical/30">
                {plan.risk_level} (Score: {plan.risk_score})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-rally-muted font-mono">Approval Required:</span>
              <span className="text-rally-warning font-mono font-bold">
                {plan.approval_required ? 'YES (Human SRE Gate)' : 'NO'}
              </span>
            </div>
            <div className="pt-2 border-t border-rally-border/60">
              <p className="text-rally-secondary font-sans leading-relaxed text-[11px]">
                {plan.reason}
              </p>
            </div>
          </div>

          {/* Explicit Human Approval Action Gate */}
          {isAwaitingApproval && (
            <div className="p-3.5 rounded bg-rally-critical/10 border border-rally-critical/30 flex flex-col gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-rally-critical font-mono font-bold text-xs uppercase tracking-wide">
                  <span>⚠</span>
                  <span>Human SRE Authorization Required</span>
                </div>
                <p className="mt-1 text-[11px] text-rally-secondary font-sans leading-relaxed">
                  Consequential rollback to <strong className="text-rally-text font-mono">{plan.target_deployment_id}</strong> will
                  drain and revert active deployment. Conversational prompts alone cannot trigger execution.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="approve-rollback-btn"
                  disabled={isProcessing}
                  onClick={onApprove}
                  className="flex-1 py-2 px-3 rounded bg-rally-healthy text-rally-black font-mono font-bold text-xs hover:bg-rally-healthy/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
                >
                  {isProcessing ? 'Authorizing…' : '✓ Approve Rollback'}
                </button>
                <button
                  type="button"
                  id="reject-rollback-btn"
                  disabled={isProcessing}
                  onClick={onReject}
                  className="py-2 px-4 rounded bg-rally-graphite border border-rally-border text-rally-secondary font-mono text-xs hover:text-rally-critical hover:border-rally-critical/40 transition-colors disabled:opacity-40"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Execution & Independent Verification Status */}
          <div className="p-3 rounded bg-rally-graphite border border-rally-border space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-rally-muted">Controlled Execution:</span>
              <span
                className={`font-bold ${
                  execVerif.execution_status === 'EXECUTED'
                    ? 'text-rally-healthy'
                    : 'text-rally-muted'
                }`}
              >
                {execVerif.execution_status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-rally-muted">Independent Verification:</span>
              <span
                className={`font-bold ${
                  execVerif.verification_status === 'PASSED'
                    ? 'text-rally-healthy'
                    : execVerif.verification_status === 'FAILED'
                    ? 'text-rally-critical'
                    : 'text-rally-muted'
                }`}
              >
                {execVerif.verification_status}
              </span>
            </div>
            {execVerif.verified_error_rate !== undefined && execVerif.verified_error_rate !== null && (
              <div className="flex items-center justify-between pt-1 border-t border-rally-border/60">
                <span className="text-rally-muted">Verified Error Rate:</span>
                <span className="text-rally-healthy font-semibold">
                  {execVerif.verified_error_rate}% (Healthy Baseline)
                </span>
              </div>
            )}
            {execVerif.verified_active_deployment && (
              <div className="flex items-center justify-between">
                <span className="text-rally-muted">Reinstated Deployment:</span>
                <span className="text-rally-info font-semibold">
                  {execVerif.verified_active_deployment}
                </span>
              </div>
            )}
            {execVerif.recovery_decision && (
              <div className="flex items-center justify-between pt-1 border-t border-rally-border/60">
                <span className="text-rally-muted">Recovery Decision:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    execVerif.recovery_decision === 'RESOLVED'
                      ? 'bg-rally-healthy/15 text-rally-healthy border border-rally-healthy/30'
                      : 'bg-rally-critical/15 text-rally-critical border border-rally-critical/30'
                  }`}
                >
                  {execVerif.recovery_decision}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
