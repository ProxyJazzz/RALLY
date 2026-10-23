import React from 'react'

interface ForensicFindingProps {
  primaryHypothesis?: string | null
  confidence?: number | null
  deployment?: string
  state?: string
  onViewHypotheses?: () => void
}

export const ForensicFinding: React.FC<ForensicFindingProps> = ({
  primaryHypothesis,
  confidence,
  deployment = 'checkout-v42',
  state = 'IDLE',
  onViewHypotheses,
}) => {
  const isResolved = state === 'RESOLVED'
  const confidencePercent = Math.round((confidence ?? (isResolved ? 0.98 : 0.95)) * 100)

  return (
    <div className="relative overflow-hidden bg-obsidian border border-steel rounded p-5 select-none transition-all hover:border-tactical-gold/40">
      {/* Subtle architectural ambient accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-tactical-gold/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between border-b border-steel/60 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-tactical-gold font-mono text-xs">◈</span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-ash font-semibold">
            PRIMARY FORENSIC DEDUCTION
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-ash uppercase">OBSERVED IN</span>
          <span className="text-[11px] font-mono text-off-white font-bold bg-charcoal px-2 py-0.5 rounded border border-steel">
            {deployment}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="max-w-xl">
          <h3 className="font-display text-2xl sm:text-3xl tracking-wide text-off-white uppercase leading-tight">
            {primaryHypothesis ??
              (isResolved
                ? 'CHECKOUT VALIDATION REGRESSION RESOLVED VIA ROLLBACK'
                : 'CHECKOUT VALIDATION REGRESSION DETECTED')}
          </h3>
          <p className="font-editorial italic text-base text-ash mt-1.5 leading-snug">
            Autonomous correlation isolated anomalous payload validation logic committed in recent canary release.
          </p>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <div className="flex flex-col items-start md:items-end">
            <span className="text-[9px] font-mono uppercase tracking-widest text-ash">
              AGENT CONFIDENCE
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-display text-4xl sm:text-5xl text-tactical-gold leading-none">
                {confidencePercent}
              </span>
              <span className="font-mono text-sm text-tactical-gold/80">%</span>
            </div>
          </div>

          {onViewHypotheses && (
            <button
              type="button"
              onClick={onViewHypotheses}
              className="px-3.5 py-2 rounded bg-charcoal hover:bg-graphite border border-steel hover:border-tactical-gold/60 text-xs font-mono text-off-white transition-all self-end"
            >
              MATRIX →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
