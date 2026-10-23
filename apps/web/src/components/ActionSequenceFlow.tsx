import React from 'react'
import { ActionPlan } from '../api/client'

interface ActionSequenceFlowProps {
  plan: ActionPlan
  state: string
}

export const ActionSequenceFlow: React.FC<ActionSequenceFlowProps> = ({
  plan,
  state,
}) => {
  const isApproved = plan.status === 'APPROVED' || state === 'APPROVED' || state === 'RESOLVED'
  const isExecuted = plan.execution_status === 'EXECUTED' || state === 'RESOLVED'
  const isVerified = state === 'RESOLVED'

  const steps = [
    {
      num: '01',
      title: 'REVALIDATE TELEMETRY',
      desc: 'Probe checkout-service error baseline and assert active anomalous deployment checkout-v42.',
      status: 'COMPLETED',
      tool: 'get_service_health',
    },
    {
      num: '02',
      title: 'GOVERNANCE APPROVAL BARRIER',
      desc: 'Verify designated SRE governance authorization decision before dispatching production mutation.',
      status: isApproved ? 'APPROVED' : 'AWAITING_APPROVAL',
      tool: 'ApprovalGateway',
    },
    {
      num: '03',
      title: `ROLLBACK DEPLOYMENT (${plan.target_deployment_id})`,
      desc: `Safely revert ECS container task definition from checkout-v42 to ${plan.target_deployment_id}.`,
      status: isExecuted ? 'EXECUTED' : isApproved ? 'READY' : 'PENDING',
      tool: plan.action_type,
    },
    {
      num: '04',
      title: 'INDEPENDENT HEALTH VERIFICATION',
      desc: 'Monitor error rate across 5-minute sliding window to confirm return to < 1.0% threshold.',
      status: isVerified ? 'VERIFIED' : isExecuted ? 'VERIFYING' : 'PENDING',
      tool: 'IndependentVerifier',
    },
  ]

  return (
    <div className="bg-obsidian border border-steel rounded p-5 sm:p-6 select-none">
      <div className="flex items-center justify-between pb-3 border-b border-steel/60 text-[10px] font-mono uppercase text-ash tracking-wider">
        <span className="flex items-center gap-2">
          <span className="text-tactical-gold">⚡</span>
          <span className="text-off-white font-medium">REMEDIATION EXECUTION SEQUENCE</span>
        </span>
        <span className="text-tactical-gold font-bold">
          GOVERNED 4-STAGE PIPELINE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        {steps.map((st) => {
          let badgeColor = 'bg-charcoal text-ash border-steel/80'
          let titleColor = 'text-ash'

          if (st.status === 'COMPLETED' || st.status === 'EXECUTED' || st.status === 'VERIFIED') {
            badgeColor = 'bg-success-green/15 text-success-green border-success-green/40'
            titleColor = 'text-off-white'
          } else if (st.status === 'APPROVED' || st.status === 'READY') {
            badgeColor = 'bg-tactical-gold/15 text-tactical-gold border-tactical-gold/40'
            titleColor = 'text-off-white'
          } else if (st.status === 'AWAITING_APPROVAL') {
            badgeColor = 'bg-warning-amber/20 text-warning-amber border-warning-amber/50 animate-pulse'
            titleColor = 'text-warning-amber'
          }

          return (
            <div
              key={st.num}
              className="bg-charcoal/80 border border-steel/80 p-4 rounded flex flex-col justify-between hover:border-tactical-gold/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between font-mono text-[10px] pb-2 border-b border-steel/60">
                  <span className="font-bold text-ash">{st.num}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${badgeColor}`}>
                    {st.status}
                  </span>
                </div>

                <div className="mt-3">
                  <span className={`font-display text-base tracking-wide uppercase block leading-snug ${titleColor}`}>
                    {st.title}
                  </span>
                  <p className="font-sans text-xs text-ash mt-1.5 leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-steel/60 font-mono text-[10px] text-signal-cyan flex items-center justify-between">
                <span>TOOL:</span>
                <span className="font-bold">{st.tool}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
