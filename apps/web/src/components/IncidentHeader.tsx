import React from 'react'

interface IncidentHeaderProps {
  state: string
  serviceId?: string
  activeDeployment?: string
  errorRate?: number | null
  onInvestigate: () => void
  onReset: () => void
  isProcessing: boolean
}

export const IncidentHeader: React.FC<IncidentHeaderProps> = ({
  state,
  serviceId = 'checkout-service',
  activeDeployment = 'checkout-v42',
  errorRate,
  onInvestigate,
  onReset,
  isProcessing,
}) => {
  const isIdle = state === 'IDLE'
  const isResolved = state === 'RESOLVED'

  // If resolved, transform header as specified
  if (isResolved) {
    return (
      <div className="bg-rally-surface border border-rally-green/40 rounded p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-rally-border pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-sm text-xs font-mono font-bold bg-rally-green/20 text-rally-green border border-rally-green/40">
              RESOLVED
            </span>
            <span className="font-mono font-bold text-sm text-rally-text tracking-wide">
              CHECKOUT SERVICE RECOVERED
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              disabled={isProcessing}
              className="text-xs font-mono text-rally-secondary hover:text-rally-text bg-rally-bg border border-rally-border px-3 py-1.5 rounded transition-colors"
            >
              RESET SIMULATION
            </button>
          </div>
        </div>

        {/* Metric Transformation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-rally-bg border border-rally-border rounded p-2.5">
            <div className="text-[10px] font-mono text-rally-muted uppercase">ERROR RATE</div>
            <div className="font-mono text-xs flex items-center gap-1.5 mt-0.5">
              <span className="text-rally-red line-through">18.4%</span>
              <span className="text-rally-muted">↓</span>
              <span className="text-rally-green font-bold">0.70%</span>
            </div>
          </div>

          <div className="bg-rally-bg border border-rally-border rounded p-2.5">
            <div className="text-[10px] font-mono text-rally-muted uppercase">DEPLOYMENT</div>
            <div className="font-mono text-xs flex items-center gap-1.5 mt-0.5">
              <span className="text-rally-red line-through">checkout-v42</span>
              <span className="text-rally-muted">↓</span>
              <span className="text-rally-green font-bold">checkout-v41</span>
            </div>
          </div>

          <div className="bg-rally-bg border border-rally-border rounded p-2.5">
            <div className="text-[10px] font-mono text-rally-muted uppercase">SERVICE HEALTH</div>
            <div className="font-mono text-xs text-rally-green font-bold mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rally-green" />
              HEALTHY
            </div>
          </div>

          <div className="bg-rally-bg border border-rally-border rounded p-2.5">
            <div className="text-[10px] font-mono text-rally-muted uppercase">INDEPENDENT VERIFICATION</div>
            <div className="font-mono text-xs text-rally-green font-bold mt-0.5">
              ✓ RECOVERY VERIFIED
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-rally-green pt-1 border-t border-rally-border/60">
          <span>✓ rollback executed</span>
          <span>✓ health check passed</span>
          <span>✓ recovery independently verified</span>
        </div>
      </div>
    )
  }

  // Active or Idle Incident State
  return (
    <div className="bg-rally-surface border border-rally-border rounded p-4 flex flex-col gap-3">
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-rally-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-rally-secondary tracking-wider uppercase">
              INCIDENT / CHECKOUT-REGRESSION
            </span>
            <span
              className={`px-1.5 py-0.2 rounded-sm text-[10px] font-mono font-bold uppercase ${
                isIdle
                  ? 'bg-rally-surface-card text-rally-secondary border border-rally-border'
                  : 'bg-rally-red/15 text-rally-red border border-rally-red/40'
              }`}
            >
              {isIdle ? 'IDLE' : 'SEV-2'}
            </span>
            <span className="px-1.5 py-0.2 rounded-sm text-[10px] font-mono bg-rally-blue/15 text-rally-blue border border-rally-blue/40 uppercase">
              {state}
            </span>
          </div>
          <h2 className="text-base font-bold text-rally-text tracking-wide mt-1">
            CHECKOUT REGRESSION
          </h2>
          <p className="text-xs text-rally-secondary font-mono mt-0.5">
            Elevated error rate following release checkout-v42
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isIdle ? (
            <button
              type="button"
              onClick={onInvestigate}
              disabled={isProcessing}
              className="text-xs font-mono font-medium text-rally-text bg-rally-blue/20 hover:bg-rally-blue/30 border border-rally-blue/40 px-3.5 py-1.5 rounded transition-colors disabled:opacity-40"
            >
              {isProcessing ? 'INVESTIGATING…' : 'INVESTIGATE CHECKOUT INCIDENT'}
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

      {/* Dense Metric Blocks with subtle separators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-0.5">
        <div className="bg-rally-bg border border-rally-border rounded p-2.5">
          <div className="text-[10px] font-mono text-rally-muted uppercase tracking-wider">ERROR RATE</div>
          <div className="font-mono text-sm font-bold mt-1 text-rally-red">
            {isIdle ? '18.4% (PRIMED)' : errorRate !== null && errorRate !== undefined ? `${errorRate}%` : '18.4%'}
          </div>
          <div className="text-[10px] font-mono text-rally-muted mt-0.5">Baseline: 0.70%</div>
        </div>

        <div className="bg-rally-bg border border-rally-border rounded p-2.5">
          <div className="text-[10px] font-mono text-rally-muted uppercase tracking-wider">DEPLOYMENT</div>
          <div className="font-mono text-sm font-bold mt-1 text-rally-text">
            {activeDeployment}
          </div>
          <div className="text-[10px] font-mono text-rally-secondary mt-0.5">Suspected regression</div>
        </div>

        <div className="bg-rally-bg border border-rally-border rounded p-2.5">
          <div className="text-[10px] font-mono text-rally-muted uppercase tracking-wider">SERVICE</div>
          <div className="font-mono text-sm font-bold mt-1 text-rally-text">
            {serviceId}
          </div>
          <div className="text-[10px] font-mono text-rally-muted mt-0.5">Tier-1 Critical</div>
        </div>

        <div className="bg-rally-bg border border-rally-border rounded p-2.5">
          <div className="text-[10px] font-mono text-rally-muted uppercase tracking-wider">SERVICE HEALTH</div>
          <div className="font-mono text-sm font-bold mt-1 flex items-center gap-1.5 text-rally-red">
            <span className="w-2 h-2 rounded-full bg-rally-red animate-pulse" />
            DEGRADED
          </div>
          <div className="text-[10px] font-mono text-rally-muted mt-0.5">Payments & Inventory OK</div>
        </div>
      </div>
    </div>
  )
}
