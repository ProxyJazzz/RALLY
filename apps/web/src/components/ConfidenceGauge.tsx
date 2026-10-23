import React from 'react'

interface ConfidenceGaugeProps {
  score: number // e.g. 95 (percentage 0-100)
  tier?: 'HIGH' | 'MODERATE' | 'LOW'
  status?: string
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({
  score,
  tier = 'HIGH',
  status = 'INFERRED',
}) => {
  return (
    <div className="bg-charcoal border border-steel/80 rounded p-4 flex flex-col justify-between font-mono">
      <div className="flex items-center justify-between text-[10px] uppercase text-ash tracking-widest pb-2 border-b border-steel/60">
        <span>BAYESIAN CONFIDENCE</span>
        <span className="text-tactical-gold font-bold">{tier} CERTAINTY</span>
      </div>

      <div className="my-4 flex items-baseline gap-2">
        <span className="font-display text-6xl sm:text-7xl text-tactical-gold leading-none">
          {score}
        </span>
        <div className="flex flex-col">
          <span className="text-lg text-tactical-gold/80 font-bold leading-none">%</span>
          <span className="text-[9px] text-ash uppercase tracking-wider mt-1">POSTERIOR PROB</span>
        </div>
      </div>

      {/* Discrete Segmented Gauge Bars (10 segments) */}
      <div className="space-y-1.5">
        <div className="grid grid-cols-10 gap-1 h-2">
          {Array.from({ length: 10 }).map((_, idx) => {
            const filled = (idx + 1) * 10 <= score
            return (
              <div
                key={idx}
                className={`rounded-xs transition-all ${
                  filled ? 'bg-tactical-gold shadow-xs' : 'bg-steel/50'
                }`}
              />
            )
          })}
        </div>

        <div className="flex items-center justify-between text-[9px] text-ash uppercase">
          <span>0% NOISE</span>
          <span>50% EQUIVOCAL</span>
          <span>100% PROVEN</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-steel/60 flex items-center justify-between text-[10px]">
        <span className="text-ash uppercase">EPISTEMIC STATE:</span>
        <span className="text-tactical-gold font-semibold uppercase">{status}</span>
      </div>
    </div>
  )
}
