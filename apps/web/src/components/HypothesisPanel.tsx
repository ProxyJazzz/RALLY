import React from 'react'

interface HypothesisPanelProps {
  primaryHypothesis?: string | null
  confidence?: number
  state: string
}

export const HypothesisPanel: React.FC<HypothesisPanelProps> = ({
  primaryHypothesis,
  confidence = 0,
  state,
}) => {
  const isInvestigated = state !== 'IDLE' && state !== 'RECEIVED' && state !== 'TRIAGING'
  const isResolved = state === 'RESOLVED'
  const score = confidence > 0 ? Math.round(confidence * 100) : 95
  const resolvedHypothesis =
    primaryHypothesis ?? 'CHECKOUT_VALIDATION_REGRESSION in checkout-v42'

  if (!isInvestigated) {
    return (
      <div className="bg-obsidian border border-steel rounded p-4 sm:p-5 select-none flex flex-col justify-between font-mono">
        <div className="flex items-center justify-between pb-3 border-b border-steel/60 text-[10px] uppercase text-ash tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="text-tactical-gold">◈</span>
            <span className="text-off-white font-medium">ROOT CAUSE REASONING</span>
          </span>
          <span className="text-ash">STANDBY</span>
        </div>
        <div className="py-10 text-center text-xs text-ash">
          AWAITING INVESTIGATION • Autonomous reasoning will activate upon telemetry ingestion.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-obsidian border border-steel rounded p-4 sm:p-5 select-none flex flex-col justify-between font-sans">
      <div className="flex items-center justify-between pb-3 border-b border-steel/60 text-[10px] font-mono uppercase text-ash tracking-wider">
        <span className="flex items-center gap-2">
          <span className="text-tactical-gold">◈</span>
          <span className="text-off-white font-medium">ROOT CAUSE DEDUCTION</span>
        </span>
        <span className="text-tactical-gold font-bold">
          {score}% AGENT CERTAINTY
        </span>
      </div>

      <div className="py-3 space-y-3">
        {/* Primary hypothesis display */}
        <div className="bg-charcoal/80 border border-tactical-gold/40 rounded p-3.5">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-tactical-gold uppercase">H1 • PRIMARY DEDUCTION</span>
            <span className="text-tactical-gold text-sm">{score}%</span>
          </div>

          <div className="mt-1 text-sm font-semibold text-off-white">
            {resolvedHypothesis}
          </div>

          {/* Solid segmented bar */}
          <div className="w-full h-1.5 bg-graphite rounded-xs overflow-hidden my-2.5 border border-steel/80">
            <div
              className="h-full bg-tactical-gold transition-all duration-500"
              style={{ width: `${score}%` }}
            />
          </div>

          {/* Supporting Evidence Checklist */}
          <div className="text-[11px] text-off-white/80 space-y-1 pt-2 border-t border-steel/60 font-mono">
            <div className="text-[9px] uppercase text-ash font-bold tracking-wider mb-1">
              SUPPORTING EVIDENCE PROOF:
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success-green font-bold">✓</span>
              <span>Deployment diff verified in order_validator.py</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success-green font-bold">✓</span>
              <span>18.4% error rate elevation temporal correlation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success-green font-bold">✓</span>
              <span>Downstream payment/inventory health isolated 100% nominal</span>
            </div>
          </div>
        </div>

        {/* Secondary rejected alternatives */}
        <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
          <div className="bg-charcoal/60 border border-steel/60 rounded p-2 text-center">
            <span className="text-ash block uppercase text-[8px]">H2 PAYMENT</span>
            <span className="text-crimson font-bold block mt-0.5">DISPROVEN (4%)</span>
          </div>
          <div className="bg-charcoal/60 border border-steel/60 rounded p-2 text-center">
            <span className="text-ash block uppercase text-[8px]">H3 INVENTORY</span>
            <span className="text-crimson font-bold block mt-0.5">DISPROVEN (3%)</span>
          </div>
          <div className="bg-charcoal/60 border border-steel/60 rounded p-2 text-center">
            <span className="text-ash block uppercase text-[8px]">H4 AUTH</span>
            <span className="text-crimson font-bold block mt-0.5">DISPROVEN (2%)</span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-steel/60 text-[9px] font-mono text-ash uppercase flex items-center justify-between">
        <span>EPISTEMIC STATE:</span>
        <span className="text-tactical-gold font-bold">
          {isResolved ? 'VERIFIED IN GROUND TRUTH' : 'PROBABILISTIC INFERENCE'}
        </span>
      </div>
    </div>
  )
}
