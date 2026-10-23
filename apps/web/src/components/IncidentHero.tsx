import React from 'react'

interface IncidentHeroProps {
  state: string
  serviceId?: string
  activeDeployment?: string
  errorRate?: number | null
  baseline?: number
  confidence?: number | null
  primaryHypothesis?: string | null
  onInvestigate: () => void
  onReset: () => void
  isProcessing: boolean
  onNavigate?: (path: string) => void
}

export const IncidentHero: React.FC<IncidentHeroProps> = ({
  state,
  serviceId = 'checkout-service',
  activeDeployment = 'checkout-v42',
  errorRate,
  baseline = 0.7,
  confidence = 0.95,
  primaryHypothesis,
  onInvestigate,
  onReset,
  isProcessing,
  onNavigate,
}) => {
  const isIdle = state === 'IDLE'
  const isInvestigating = state === 'INVESTIGATING' || state === 'REASONING'
  const currentVal = isIdle ? 18.4 : errorRate ?? 18.4
  const confidencePercent = Math.round((confidence ?? 0.95) * 100)

  return (
    <div className="relative overflow-hidden bg-obsidian border border-crimson/50 rounded p-6 sm:p-8 select-none transition-all shadow-tactical-crimson">
      {/* Ambient Crimson Radial Lighting */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[350px] bg-crimson/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Meta Header: Incident Level + Real State */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-steel/60 pb-4 mb-6">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="px-2 py-0.5 rounded bg-crimson text-off-white text-[10px] font-mono font-bold uppercase tracking-wider">
            CRITICAL INCIDENT #4821
          </span>
          <span className="px-2 py-0.5 rounded bg-crimson/15 border border-crimson/40 text-crimson text-[10px] font-mono font-bold uppercase">
            SEV-2
          </span>
          <span className="text-steel">|</span>
          <span className="font-mono text-xs text-off-white uppercase font-bold tracking-wider">
            {serviceId}
          </span>
          <span className="text-steel">|</span>
          <span className="text-[10px] font-mono text-tactical-gold bg-charcoal px-2 py-0.5 rounded border border-steel">
            STATE: {state}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('/incident')}
              className="px-3.5 py-1.5 rounded bg-charcoal hover:bg-graphite border border-steel text-xs font-mono text-off-white transition-colors"
            >
              VIEW INVESTIGATION →
            </button>
          )}

          {isIdle ? (
            <button
              type="button"
              onClick={onInvestigate}
              disabled={isProcessing}
              className="px-5 py-1.5 rounded bg-tactical-gold hover:bg-tactical-gold/90 text-void-black text-xs font-mono font-bold transition-all shadow-tactical-gold disabled:opacity-40"
            >
              {isProcessing ? 'AGENT INVESTIGATING…' : 'INVESTIGATE INCIDENT'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onReset}
              disabled={isProcessing}
              className="px-3.5 py-1.5 rounded bg-charcoal hover:bg-graphite border border-steel text-xs font-mono text-ash hover:text-off-white transition-colors disabled:opacity-40"
            >
              RESET SIMULATION
            </button>
          )}
        </div>
      </div>

      {/* Main Cinematic Grid: Dramatic Title + Dominant Hero Metric */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
        {/* Left: Giant Bebas Neue Title + Editorial Quote */}
        <div className="lg:col-span-8">
          <div className="font-editorial italic text-tactical-gold text-base sm:text-lg mb-1">
            "When systems fail, clarity matters."
          </div>
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl tracking-tight text-off-white leading-none uppercase">
            CHECKOUT REGRESSION
          </h1>
          <p className="font-sans text-sm sm:text-base text-ash max-w-2xl mt-2 leading-relaxed">
            {primaryHypothesis ? (
              <span>
                Root cause identified as <strong className="text-off-white font-mono">{primaryHypothesis}</strong> following deployment of <strong className="text-off-white font-mono">{activeDeployment}</strong>.
              </span>
            ) : (
              <span>
                Severe validation anomaly triggered in production following deployment of{' '}
                <strong className="text-off-white font-mono">{activeDeployment}</strong>. Correlated errors indicate catastrophic cart drop-offs.
              </span>
            )}
          </p>
        </div>

        {/* Right: Giant Hero Metric Display */}
        <div className="lg:col-span-4 flex flex-col items-start lg:items-end bg-charcoal/70 border border-steel/80 rounded p-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-ash">
            ERROR RATE SPIKE
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-display text-6xl sm:text-7xl lg:text-8xl text-crimson leading-none">
              {currentVal.toFixed(1)}
            </span>
            <span className="font-mono text-2xl text-crimson/80">%</span>
          </div>
          <span className="text-[11px] font-mono text-ash mt-1">
            ↑ from <strong className="text-off-white">{baseline.toFixed(2)}%</strong> baseline
          </span>
        </div>
      </div>

      {/* Supporting Technical Callout Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-steel/60">
        <div>
          <div className="text-[10px] font-mono text-ash uppercase">TARGET SERVICE</div>
          <div className="font-mono text-sm font-bold text-off-white mt-0.5">{serviceId}</div>
          <div className="text-[10px] font-mono text-ash mt-0.5">Tier-1 Core Checkout</div>
        </div>

        <div>
          <div className="text-[10px] font-mono text-ash uppercase">ANOMALOUS DEPLOYMENT</div>
          <div className="font-mono text-sm font-bold text-crimson mt-0.5">{activeDeployment}</div>
          <div className="text-[10px] font-mono text-ash mt-0.5">Diff detected from v41</div>
        </div>

        <div>
          <div className="text-[10px] font-mono text-ash uppercase">AUTONOMOUS CONFIDENCE</div>
          <div className="font-mono text-sm font-bold text-tactical-gold mt-0.5">{confidencePercent}% CONFIDENCE</div>
          <div className="text-[10px] font-mono text-ash mt-0.5">Telemetry correlation</div>
        </div>

        <div>
          <div className="text-[10px] font-mono text-ash uppercase">OPERATIONAL STATUS</div>
          <div className="font-mono text-sm font-bold text-off-white mt-0.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-crimson animate-pulse" />
            <span>{isInvestigating ? 'ANALYZING TRACES' : 'AWAITING REMEDIATION'}</span>
          </div>
          <div className="text-[10px] font-mono text-ash mt-0.5">Payment/Inventory stable</div>
        </div>
      </div>
    </div>
  )
}
