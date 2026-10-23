import React from 'react'

interface RecoverySummaryProps {
  onReset: () => void
  isProcessing: boolean
  onNavigate?: (path: string) => void
}

export const RecoverySummary: React.FC<RecoverySummaryProps> = ({
  onReset,
  isProcessing,
  onNavigate,
}) => {
  return (
    <div className="relative overflow-hidden bg-obsidian border border-success-green/40 rounded p-6 sm:p-8 select-none transition-all shadow-tactical-green">
      {/* Ambient green radial lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-success-green/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top operational badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-steel/60 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-success-green animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-widest text-success-green font-semibold">
            STATUS: SYSTEM RECOVERED & FULLY VERIFIED
          </span>
          <span className="text-steel">|</span>
          <span className="font-mono text-xs text-ash">INCIDENT #4821 CLOSED</span>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('/execution')}
              className="px-3.5 py-1.5 rounded bg-charcoal hover:bg-graphite border border-steel text-xs font-mono text-off-white transition-colors"
            >
              VERIFICATION AUDIT →
            </button>
          )}
          <button
            type="button"
            onClick={onReset}
            disabled={isProcessing}
            className="px-4 py-1.5 rounded bg-success-green/20 hover:bg-success-green/30 border border-success-green/40 text-xs font-mono font-bold text-success-green transition-colors disabled:opacity-40"
          >
            RESET SIMULATION
          </button>
        </div>
      </div>

      {/* Main recovery cinematic title */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
        <div className="lg:col-span-8">
          <div className="font-editorial italic text-tactical-gold text-base sm:text-lg mb-1">
            "When the board is broken, precision restores order."
          </div>
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl tracking-tight text-off-white leading-none uppercase">
            SYSTEM RECOVERED
          </h1>
          <p className="font-sans text-sm sm:text-base text-ash max-w-2xl mt-2 leading-relaxed">
            Autonomous rollback to <strong className="text-off-white font-mono">checkout-v41</strong> executed under operator governance. Post-mitigation health check completed with zero residual error telemetry.
          </p>
        </div>

        {/* Transition Hero Metric */}
        <div className="lg:col-span-4 flex flex-col items-start lg:items-end bg-charcoal/60 border border-steel/60 rounded p-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-ash">
            ERROR RATE RECOVERY
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-4xl sm:text-5xl text-crimson/60 line-through leading-none">
              18.4%
            </span>
            <span className="text-ash font-mono text-lg">→</span>
            <span className="font-display text-5xl sm:text-6xl text-success-green leading-none">
              0.70%
            </span>
          </div>
          <span className="text-[11px] font-mono text-success-green mt-1 flex items-center gap-1">
            <span>✓</span> INDEPENDENT HEALTH CHECK PASSED
          </span>
        </div>
      </div>

      {/* Recovery Telemetry Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-steel/60">
        <div>
          <div className="text-[10px] font-mono text-ash uppercase">ACTIVE DEPLOYMENT</div>
          <div className="font-mono text-sm font-bold text-off-white mt-0.5">checkout-v41</div>
          <div className="text-[10px] font-mono text-success-green mt-0.5">Stable baseline active</div>
        </div>

        <div>
          <div className="text-[10px] font-mono text-ash uppercase">TELEMETRY VERIFICATION</div>
          <div className="font-mono text-sm font-bold text-success-green mt-0.5">PASSED (5/5)</div>
          <div className="text-[10px] font-mono text-ash mt-0.5">0 anomalous payloads</div>
        </div>

        <div>
          <div className="text-[10px] font-mono text-ash uppercase">GOVERNANCE RECORD</div>
          <div className="font-mono text-sm font-bold text-off-white mt-0.5">AUDITED & SEALED</div>
          <div className="text-[10px] font-mono text-ash mt-0.5">Operator signature logged</div>
        </div>

        <div>
          <div className="text-[10px] font-mono text-ash uppercase">MCP TOOLS EXECUTED</div>
          <div className="font-mono text-sm font-bold text-signal-cyan mt-0.5">7 INVOCATIONS</div>
          <div className="text-[10px] font-mono text-ash mt-0.5">Streamable HTTP verified</div>
        </div>
      </div>
    </div>
  )
}
