import React from 'react'
import { ActionPlan } from '../api/client'

interface ActionPlanViewProps {
  plan?: ActionPlan | null
  state: string
  onNavigate: (route: string) => void
}

export const ActionPlanView: React.FC<ActionPlanViewProps> = ({
  plan,
  state,
  onNavigate,
}) => {
  return (
    <div className="space-y-3 font-mono">
      {/* Workspace Header */}
      <div className="bg-rally-surface border border-rally-border rounded p-3.5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-rally-text uppercase tracking-wider">
              REMEDIATION ACTION PLAN
            </h1>
            <span className="px-2 py-0.2 rounded-sm text-xs bg-rally-amber/15 text-rally-amber border border-rally-amber/40">
              STATUS: {plan?.status ?? (state === 'IDLE' ? 'NO PLAN' : state)}
            </span>
          </div>
          <p className="text-xs text-rally-secondary font-sans mt-0.5">
            Governed operational execution specifications formulated by RALLY ActionPlanner.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/approval')}
            className="px-2.5 py-1 rounded bg-rally-amber/20 hover:bg-rally-amber/30 border border-rally-amber/50 text-xs font-bold text-rally-amber"
          >
            Go to Approval Gate →
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
          <div className="text-rally-muted text-sm uppercase">NO REMEDIATION PLAN</div>
          <p className="text-xs text-rally-secondary font-sans mt-1">
            No action plan currently formulated. Investigation must correlate root cause before planning remediation.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Action Spec Banner */}
          <div className="bg-rally-surface border border-rally-border rounded p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-rally-border pb-2.5">
              <div>
                <span className="text-[10px] text-rally-muted uppercase">PROPOSED MUTATION</span>
                <div className="text-base font-bold text-rally-text mt-0.5">
                  {plan.action_type} ({plan.service_id})
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-rally-muted uppercase block">PLAN IDENTIFIER</span>
                <span className="text-xs text-rally-cyan">{plan.plan_id}</span>
              </div>
            </div>

            {/* Target Deployment Transition */}
            <div className="bg-rally-bg border border-rally-border rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-rally-muted uppercase">DEPLOYMENT REVERSION</span>
                <div className="text-sm font-bold flex items-center gap-2 mt-1">
                  <span className="text-rally-red">checkout-v42</span>
                  <span className="text-rally-muted">────────►</span>
                  <span className="text-rally-green">{plan.target_deployment_id}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-rally-muted uppercase block">RISK LEVEL</span>
                  <span className="text-rally-red font-bold">{plan.risk_level}</span>
                </div>
                <div>
                  <span className="text-[10px] text-rally-muted uppercase block">RISK SCORE</span>
                  <span className="text-rally-amber font-bold">{plan.risk_score} / 100</span>
                </div>
                <div>
                  <span className="text-[10px] text-rally-muted uppercase block">BLAST RADIUS</span>
                  <span className="text-rally-text font-bold">{plan.service_id}</span>
                </div>
              </div>
            </div>

            {/* Rationale & Expected Impact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
              <div className="bg-rally-bg border border-rally-border rounded p-3">
                <span className="font-mono text-[10px] text-rally-muted uppercase font-bold block mb-1">
                  RATIONALE & JUSTIFICATION
                </span>
                <p className="text-rally-secondary leading-relaxed">
                  {plan.reason}
                </p>
              </div>

              <div className="bg-rally-bg border border-rally-border rounded p-3">
                <span className="font-mono text-[10px] text-rally-muted uppercase font-bold block mb-1">
                  EXPECTED OPERATIONAL OUTCOME
                </span>
                <p className="text-rally-secondary leading-relaxed">
                  {plan.impact}
                </p>
              </div>
            </div>

            {/* Governance Requirements */}
            <div className="p-3 rounded bg-rally-amber/10 border border-rally-amber/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rally-amber" />
                <span className="text-rally-amber font-bold">
                  {plan.approval_required ? 'HUMAN SRE APPROVAL STRICTLY MANDATED' : 'AUTONOMOUS EXECUTION PERMITTED'}
                </span>
              </div>
              <button
                onClick={() => onNavigate('/approval')}
                className="px-3 py-1 rounded bg-rally-amber text-black font-bold hover:bg-rally-amber/90 transition-all text-xs"
              >
                Inspect Governance Gate →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
