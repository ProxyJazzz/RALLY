import React from 'react'

interface IncidentHeroProps {
  state: string
  serviceId?: string
  activeDeployment?: string
  errorRate?: number | null
  baseline?: number
  onInvestigate: () => void
  onReset: () => void
  isProcessing: boolean
}

export const IncidentHero: React.FC<IncidentHeroProps> = ({
  state,
  serviceId = 'checkout-service',
  activeDeployment = 'checkout-v42',
  errorRate,
  baseline = 0.7,
  onInvestigate,
  onReset,
  isProcessing,
}) => {
  const isIdle = state === 'IDLE'
  const isResolved = state === 'RESOLVED'

  // If resolved, transform header into resolution payoff banner
  if (isResolved) {
    return (
      <div className="bg-rally-surface border border-rally-green/40 rounded p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-rally-border pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-sm text-xs font-mono font-bold bg-rally-green/20 text-rally-green border border-rally-green/40">
              ✓ INCIDENT RESOLVED
            </span>
            <span className="font-mono font-bold text-sm text-rally-text tracking-wide">
              CHECKOUT SERVICE RECOVERED
            </span>
          </div>

          <button
            type="button"
            onClick={onReset}
            disabled={isProcessing}
            className="text-xs font-mono text-rally-secondary hover:text-rally-text bg-rally-bg border border-rally-border px-3 py-1.5 rounded transition-colors"
          >
            RESET SIMULATION
          </button>
        </div>

        {/* Transition Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="bg-rally-bg border border-rally-border rounded p-2.5">
            <div className="text-[10px] font-mono text-rally-muted uppercase">ERROR RATE TRANSITION</div>
            <div className="font-mono text-xs flex items-center gap-1.5 mt-1">
              <span className="text-rally-red line-through">18.4%</span>
              <span className="text-rally-muted">────────►</span>
              <span className="text-rally-green font-bold">0.70%</span>
            </div>
          </div>

          <div className="bg-rally-bg border border-rally-border rounded p-2.5">
            <div className="text-[10px] font-mono text-rally-muted uppercase">DEPLOYMENT RESTORATION</div>
            <div className="font-mono text-xs flex items-center gap-1.5 mt-1">
              <span className="text-rally-red line-through">checkout-v42</span>
              <span className="text-rally-muted">────────►</span>
              <span className="text-rally-green font-bold">checkout-v41</span>
            </div>
          </div>

          <div className="bg-rally-bg border border-rally-border rounded p-2.5">
            <div className="text-[10px] font-mono text-rally-muted uppercase">SERVICE HEALTH</div>
            <div className="font-mono text-xs text-rally-green font-bold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rally-green" />
              HEALTHY (0 ERRORS)
            </div>
          </div>

          <div className="bg-rally-bg border border-rally-border rounded p-2.5">
            <div className="text-[10px] font-mono text-rally-muted uppercase">VERIFICATION STATUS</div>
            <div className="font-mono text-xs text-rally-green font-bold mt-1">
              ✓ RECOVERY INDEPENDENTLY VERIFIED
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentVal = isIdle ? 18.4 : errorRate ?? 18.4

  return (
    <div className="bg-rally-surface border border-rally-border rounded p-3.5 flex flex-col gap-3">
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-rally-border pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.2 rounded-sm text-[10px] font-mono font-bold uppercase bg-rally-red/15 text-rally-red border border-rally-red/40">
              SEV-2
            </span>
            <span className="px-1.5 py-0.2 rounded-sm text-[10px] font-mono font-bold uppercase bg-rally-red/15 text-rally-red border border-rally-red/40">
              DEGRADED
            </span>
            <span className="text-xs font-mono font-bold text-rally-text tracking-wide uppercase">
              CHECKOUT SERVICE
            </span>
            <span className="text-rally-muted font-mono text-xs hidden sm:inline">•</span>
            <span className="text-[11px] font-mono text-rally-cyan bg-rally-cyan/10 border border-rally-cyan/30 px-1.5 py-0.2 rounded-sm">
              STATE: {state}
            </span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-rally-text tracking-tight mt-1">
            CHECKOUT REGRESSION
          </h1>
          <p className="text-xs text-rally-secondary font-mono mt-0.5">
            Elevated error rate following deployment <span className="text-rally-text font-bold">checkout-v42</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isIdle ? (
            <button
              type="button"
              onClick={onInvestigate}
              disabled={isProcessing}
              className="text-xs font-mono font-bold text-rally-text bg-rally-blue hover:bg-rally-blue/90 text-white px-3.5 py-1.5 rounded transition-all shadow-sm disabled:opacity-40"
            >
              {isProcessing ? 'INVESTIGATING…' : 'INVESTIGATE INCIDENT'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onReset}
              disabled={isProcessing}
              className="text-xs font-mono text-rally-secondary hover:text-rally-text bg-rally-bg border border-rally-border px-3 py-1.5 rounded transition-colors disabled:opacity-40"
            >
              RESET SIMULATION
            </button>
          )}
        </div>
      </div>

      {/* Telemetry Strip: Horizontal live metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
        <div className="bg-rally-bg border border-rally-border rounded p-2.5">
          <div className="text-[10px] text-rally-muted uppercase tracking-wider flex justify-between">
            <span>ERROR RATE</span>
            <span className="text-rally-red text-[9px] font-bold">CRITICAL</span>
          </div>
          <div className="text-base font-bold text-rally-red mt-0.5">
            {currentVal.toFixed(1)}%
          </div>
          <div className="text-[10px] text-rally-muted mt-0.5">
            ↑ from {baseline.toFixed(2)}% baseline
          </div>
        </div>

        <div className="bg-rally-bg border border-rally-border rounded p-2.5">
          <div className="text-[10px] text-rally-muted uppercase tracking-wider">DEPLOYMENT</div>
          <div className="text-sm font-bold text-rally-text mt-0.5">
            {activeDeployment}
          </div>
          <div className="text-[10px] text-rally-secondary mt-0.5">v41 → v42 (diff detected)</div>
        </div>

        <div className="bg-rally-bg border border-rally-border rounded p-2.5">
          <div className="text-[10px] text-rally-muted uppercase tracking-wider">SERVICE</div>
          <div className="text-sm font-bold text-rally-text mt-0.5">
            {serviceId}
          </div>
          <div className="text-[10px] text-rally-muted mt-0.5">Tier-1 Core Checkout</div>
        </div>

        <div className="bg-rally-bg border border-rally-border rounded p-2.5">
          <div className="text-[10px] text-rally-muted uppercase tracking-wider">HEALTH</div>
          <div className="text-sm font-bold text-rally-red mt-0.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rally-red animate-pulse" />
            DEGRADED
          </div>
          <div className="text-[10px] text-rally-muted mt-0.5">Payment/Inventory: OK</div>
        </div>
      </div>
    </div>
  )
}
