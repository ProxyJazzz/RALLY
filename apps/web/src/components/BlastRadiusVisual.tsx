import React from 'react'

interface BlastRadiusVisualProps {
  activeDeployment?: string
  isRecovered?: boolean
  errorRate?: number
}

export const BlastRadiusVisual: React.FC<BlastRadiusVisualProps> = ({
  activeDeployment = 'checkout-v42',
  isRecovered = false,
  errorRate = 18.4,
}) => {
  return (
    <div className="bg-obsidian border border-steel rounded p-4 select-none flex flex-col justify-between">
      <div className="flex items-center justify-between pb-2 border-b border-steel/60 text-[10px] font-mono uppercase text-ash tracking-wider">
        <span className="flex items-center gap-2">
          <span className="text-tactical-gold font-mono">⛁</span>
          <span className="text-off-white font-medium">BLAST RADIUS & TOPOLOGY</span>
        </span>
        <span
          className={`font-semibold uppercase text-[10px] ${
            isRecovered ? 'text-success-green' : 'text-crimson'
          }`}
        >
          {isRecovered ? 'ALL SERVICES HEALTHY' : 'CORE INGRESS ISOLATED'}
        </span>
      </div>

      <div className="py-4 flex flex-col items-center justify-center font-mono text-xs">
        {/* USERS INGRESS */}
        <div className="flex flex-col items-center">
          <div className="px-3 py-1 rounded bg-charcoal border border-steel text-ash text-[10px] tracking-widest uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-cyan" />
            <span>PUBLIC INGRESS TRAFFIC</span>
          </div>
          <div className="h-4 w-px bg-steel/80 my-0.5" />
        </div>

        {/* CHECKOUT CORE SERVICE (DOMINANT NODE) */}
        <div
          className={`w-full max-w-[290px] p-3 rounded border transition-all ${
            isRecovered
              ? 'bg-charcoal/80 border-success-green/40 text-success-green shadow-tactical-green'
              : 'bg-charcoal/90 border-crimson/60 text-crimson shadow-tactical-crimson'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-lg tracking-wider text-off-white">
              CHECKOUT-SERVICE
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                isRecovered
                  ? 'bg-success-green/20 text-success-green border border-success-green/40'
                  : 'bg-crimson/20 text-crimson border border-crimson/40 animate-pulse'
              }`}
            >
              {isRecovered ? '● NORMAL' : '● DEGRADED'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono mt-1.5 text-off-white/80">
            <span className="text-ash">{isRecovered ? 'checkout-v41' : activeDeployment}</span>
            <span className={isRecovered ? 'text-success-green font-bold' : 'text-crimson font-bold'}>
              {isRecovered ? '0.70% ERR' : `${errorRate.toFixed(1)}% ERR`}
            </span>
          </div>
        </div>

        {/* Downstream Connector Edges (SVG) */}
        <div className="w-full max-w-[400px] h-6 relative my-1">
          <svg className="w-full h-full overflow-visible">
            <line x1="50%" y1="0" x2="50%" y2="10" stroke="#242424" strokeWidth="1.5" />
            <line x1="16.6%" y1="10" x2="83.3%" y2="10" stroke="#242424" strokeWidth="1.5" />
            <line x1="16.6%" y1="10" x2="16.6%" y2="24" stroke="#242424" strokeWidth="1.5" />
            <line x1="50%" y1="10" x2="50%" y2="24" stroke="#242424" strokeWidth="1.5" />
            <line x1="83.3%" y1="10" x2="83.3%" y2="24" stroke="#242424" strokeWidth="1.5" />
          </svg>
        </div>

        {/* DOWNSTREAM DEPENDENCY NODES (3 NODES) */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[460px]">
          {/* Payment */}
          <div className="bg-charcoal border border-steel/80 rounded p-2 text-center">
            <div className="text-[10px] font-medium text-off-white truncate font-sans">PAYMENT</div>
            <div className="flex items-center justify-center gap-1 text-[9px] font-mono text-success-green mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success-green" />
              0.02%
            </div>
            <div className="text-[8px] font-mono text-ash mt-0.5 uppercase">STABLE</div>
          </div>

          {/* Inventory */}
          <div className="bg-charcoal border border-steel/80 rounded p-2 text-center">
            <div className="text-[10px] font-medium text-off-white truncate font-sans">INVENTORY</div>
            <div className="flex items-center justify-center gap-1 text-[9px] font-mono text-success-green mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success-green" />
              0.05%
            </div>
            <div className="text-[8px] font-mono text-ash mt-0.5 uppercase">STABLE</div>
          </div>

          {/* Auth */}
          <div className="bg-charcoal border border-steel/80 rounded p-2 text-center">
            <div className="text-[10px] font-medium text-off-white truncate font-sans">AUTH</div>
            <div className="flex items-center justify-center gap-1 text-[9px] font-mono text-success-green mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success-green" />
              0.01%
            </div>
            <div className="text-[8px] font-mono text-ash mt-0.5 uppercase">STABLE</div>
          </div>
        </div>
      </div>
    </div>
  )
}
