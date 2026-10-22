import React from 'react'

interface HypothesisPanelProps {
  primaryHypothesis?: string | null
  confidence?: number
  state: string
}

export const HypothesisPanel: React.FC<HypothesisPanelProps> = ({
  confidence = 0,
  state,
}) => {
  const isInvestigated = state !== 'IDLE' && state !== 'RECEIVED' && state !== 'TRIAGING'

  const hypotheses = [
    {
      id: 'H1',
      title: 'CHECKOUT REGRESSION (checkout-v42)',
      score: confidence > 0 ? Math.round(confidence * 100) : 91,
      evidence: [
        'Deployment timestamp correlation',
        'Elevated 18.4% error spike',
        'Payment/Inventory dependency health normal',
        'Deployment diff identified regression',
        'Temporal causality confirmed',
      ],
    },
    { id: 'H2', title: 'PAYMENT DEPENDENCY FAILURE', score: 4, evidence: [] },
    { id: 'H3', title: 'INVENTORY DEPENDENCY FAILURE', score: 3, evidence: [] },
    { id: 'H4', title: 'AUTHENTICATION FAILURE', score: 2, evidence: [] },
  ]

  if (!isInvestigated) {
    return (
      <div className="bg-rally-surface border border-rally-border rounded p-3 select-none flex flex-col justify-between font-mono">
        <div className="flex items-center justify-between pb-1.5 border-b border-rally-border text-[10px] uppercase text-rally-muted tracking-wider">
          <span>ROOT CAUSE ANALYSIS</span>
          <span className="text-rally-muted">AWAITING INVESTIGATION</span>
        </div>
        <div className="py-8 text-center text-xs text-rally-muted">
          AWAITING INVESTIGATION • Autonomous reasoning will activate upon telemetry ingestion.
        </div>
      </div>
    )
  }

  const h1 = hypotheses[0]

  return (
    <div className="bg-rally-surface border border-rally-border rounded p-3 select-none flex flex-col justify-between font-mono">
      <div className="flex items-center justify-between pb-1.5 border-b border-rally-border text-[10px] uppercase text-rally-muted tracking-wider">
        <span>ROOT CAUSE ANALYSIS</span>
        <span className="text-rally-cyan font-bold">H1 HIGH CONFIDENCE ({h1.score}%)</span>
      </div>

      <div className="py-1.5 space-y-2">
        {/* Primary hypothesis card */}
        <div className="bg-rally-bg border border-rally-border rounded p-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-rally-text">
            <span className="text-rally-cyan">H1 {h1.title}</span>
            <span className="text-rally-cyan text-sm">{h1.score}%</span>
          </div>

          {/* ASCII / Solid Confidence Bar */}
          <div className="w-full h-2 bg-rally-surface-card rounded-sm overflow-hidden my-2 border border-rally-border">
            <div
              className="h-full bg-rally-cyan transition-all duration-500"
              style={{ width: `${h1.score}%` }}
            />
          </div>

          {/* Supporting Evidence Checklist */}
          <div className="text-[10px] text-rally-secondary space-y-0.5 pt-1 border-t border-rally-border/60">
            <div className="text-[9px] uppercase text-rally-muted font-bold tracking-wider mb-1">
              SUPPORTING EVIDENCE:
            </div>
            {h1.evidence.map((ev, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-rally-green font-bold">✓</span>
                <span className="text-rally-text">{ev}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary ranked hypotheses */}
        <div className="grid grid-cols-3 gap-1.5 text-[10px]">
          {hypotheses.slice(1).map((h) => (
            <div key={h.id} className="bg-rally-bg border border-rally-border rounded p-1.5">
              <div className="flex items-center justify-between text-rally-muted">
                <span>{h.id} {h.title.split(' ')[0]}</span>
                <span>{h.score}%</span>
              </div>
              <div className="w-full h-1 bg-rally-surface-card rounded-sm overflow-hidden mt-1">
                <div className="h-full bg-rally-muted/40" style={{ width: `${h.score * 5}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
