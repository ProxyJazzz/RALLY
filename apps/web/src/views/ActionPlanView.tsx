import React from 'react'
import { ActionPlan } from '../api/client'
import { RiskMatrixCard } from '../components/RiskMatrixCard'
import { ActionSequenceFlow } from '../components/ActionSequenceFlow'
import { BlastRadiusVisual } from '../components/BlastRadiusVisual'

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
  const isApproved = plan?.status === 'APPROVED' || state === 'APPROVED' || state === 'RESOLVED'
  const isResolved = state === 'RESOLVED'

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* ── 1. CINEMATIC EDITORIAL HERO ─────────────────────────────────── */}
      <div className="relative overflow-hidden bg-obsidian border border-steel rounded p-6 sm:p-8 select-none">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-warning-amber/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-steel/60 pb-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-warning-amber" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-off-white font-semibold">
              REMEDIATION SPECIFICATION • OPERATIONAL WORKSPACE
            </span>
            <span className="text-steel">|</span>
            <span className="text-[10px] font-mono text-tactical-gold">
              PLAN ID: {plan?.plan_id ?? 'PENDING'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('/hypotheses')}
              className="px-3.5 py-1.5 rounded bg-charcoal hover:bg-graphite border border-steel text-xs font-mono text-off-white transition-colors"
            >
              ← ROOT CAUSE
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/approval')}
              className="px-4 py-1.5 rounded bg-tactical-gold hover:bg-tactical-gold/90 text-void-black text-xs font-mono font-bold transition-all shadow-tactical-gold"
            >
              OPEN GOVERNANCE GATE →
            </button>
          </div>
        </div>

        <div className="max-w-3xl">
          <div className="font-editorial italic text-tactical-gold text-base sm:text-lg mb-1">
            "Diagnosis without action is only observation."
          </div>
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl tracking-tight text-off-white leading-none uppercase">
            REMEDIATION PLAN
          </h1>
          <p className="font-sans text-sm sm:text-base text-ash mt-3 leading-relaxed">
            Formulated mitigation sequence designed to restore baseline health with minimum blast radius. Destructive operations remain strictly gated behind human operator authorization.
          </p>
        </div>
      </div>

      {!plan ? (
        <div className="bg-obsidian border border-steel rounded p-16 text-center">
          <span className="text-warning-amber font-mono text-2xl block mb-2">▲</span>
          <div className="text-ash font-mono text-sm uppercase tracking-widest">
            NO REMEDIATION PLAN PRIMED
          </div>
          <p className="text-xs text-ash/80 font-sans mt-2 max-w-md mx-auto">
            ActionPlanner formulates safe rollback and mitigation plans once root cause deduction completes.
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
          {/* ── 2. PROPOSED MUTATION BANNER ──────────────────────────────── */}
          <div className="bg-obsidian border border-steel rounded p-6 sm:p-8 select-none">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-steel/60 pb-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-ash">
                  PROPOSED REMEDIATION ACTION
                </span>
                <h2 className="font-display text-4xl sm:text-5xl text-off-white tracking-wide uppercase leading-tight mt-1">
                  ROLLBACK DEPLOYMENT
                </h2>
                <div className="flex items-center gap-2 mt-2 font-mono text-xs">
                  <span className="text-ash">SERVICE:</span>
                  <span className="text-off-white font-bold uppercase">{plan.service_id}</span>
                  <span className="text-steel">|</span>
                  <span className="text-ash">ACTION TYPE:</span>
                  <span className="text-signal-cyan font-bold">{plan.action_type}</span>
                </div>
              </div>

              {/* Version Reversion Tag */}
              <div className="bg-charcoal border border-steel/80 p-4 rounded flex items-center gap-4 shrink-0 font-mono">
                <div>
                  <span className="text-[9px] text-ash block uppercase">FAULTY TARGET</span>
                  <span className="text-crimson font-bold text-base block mt-0.5 line-through">
                    checkout-v42
                  </span>
                </div>
                <span className="text-ash text-lg">────────►</span>
                <div>
                  <span className="text-[9px] text-ash block uppercase">PROPOSED STABLE</span>
                  <span className="text-success-green font-bold text-base block mt-0.5">
                    {plan.target_deployment_id}
                  </span>
                </div>
              </div>
            </div>

            {/* Impact & Justification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6 font-sans text-xs">
              <div className="bg-charcoal/60 border border-steel/60 rounded p-4">
                <span className="font-mono text-[10px] text-tactical-gold uppercase tracking-wider block mb-1 font-bold">
                  AUTONOMOUS RATIONALE
                </span>
                <p className="text-off-white/90 leading-relaxed text-sm">
                  {plan.reason}
                </p>
              </div>

              <div className="bg-charcoal/60 border border-steel/60 rounded p-4">
                <span className="font-mono text-[10px] text-signal-cyan uppercase tracking-wider block mb-1 font-bold">
                  PROJECTED OPERATIONAL IMPACT
                </span>
                <p className="text-off-white/90 leading-relaxed text-sm">
                  {plan.impact}
                </p>
              </div>
            </div>
          </div>

          {/* ── 3. ASYMMETRIC BENTO: Risk Matrix & Blast Radius Topology ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7">
              <RiskMatrixCard
                level={plan.risk_level}
                score={plan.risk_score}
                serviceId={plan.service_id}
                reason={plan.reason}
              />
            </div>

            <div className="lg:col-span-5">
              <BlastRadiusVisual
                activeDeployment="checkout-v42"
                isRecovered={isResolved}
                errorRate={18.4}
              />
            </div>
          </div>

          {/* ── 4. OPERATIONAL EXECUTION SEQUENCE ────────────────────────── */}
          <ActionSequenceFlow plan={plan} state={state} />

          {/* ── 5. GOVERNANCE AUTHORIZATION GATEWAY BARRIER ──────────────── */}
          <div className="bg-obsidian border border-warning-amber/50 rounded p-6 sm:p-7 select-none flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-warning-amber animate-pulse shrink-0" />
              <div>
                <span className="font-display text-2xl text-off-white tracking-wide uppercase block">
                  {isResolved
                    ? 'REMEDIATION VERIFIED & AUDITED'
                    : isApproved
                    ? 'GOVERNANCE GATE CLEARED • ACTION AUTHORIZED'
                    : 'GOVERNANCE GATEWAY PAUSED • HUMAN AUTHORIZATION REQUIRED'}
                </span>
                <span className="text-xs font-sans text-ash mt-0.5 block">
                  {isResolved
                    ? 'Action successfully executed and independently verified by telemetry probes.'
                    : isApproved
                    ? 'Operator approval logged. Controlled rollback dispatched through MCP.'
                    : 'RALLY governance mandates designated SRE signature before applying mutations.'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('/approval')}
                className="px-5 py-2.5 rounded bg-tactical-gold hover:bg-tactical-gold/90 text-void-black text-xs font-mono font-bold transition-all shadow-tactical-gold"
              >
                OPEN GOVERNANCE GATE →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
