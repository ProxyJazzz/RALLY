import React from 'react'
import { AlexaSimulationState } from '../api/client'
import { IncidentJourney } from '../components/IncidentJourney'
import { ErrorRateChart } from '../components/ErrorRateChart'

interface IncidentViewProps {
  state: AlexaSimulationState | null
  activeState: string
  isProcessing: boolean
  numericErrorRate: number
  isResolved: boolean
  onInvestigate: () => void
  onReset: () => void
  onNavigate: (route: string) => void
}

export const IncidentView: React.FC<IncidentViewProps> = ({
  state,
  activeState,
  isProcessing,
  numericErrorRate,
  isResolved,
  onInvestigate,
  onReset,
  onNavigate,
}) => {
  return (
    <div className="space-y-3 font-mono">
      {/* Incident Header & Identity */}
      <div className="bg-rally-surface border border-rally-border rounded p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-rally-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-sm text-xs font-bold bg-rally-red/15 text-rally-red border border-rally-red/40">
                SEV-2
              </span>
              <span className="text-xs text-rally-muted uppercase">INCIDENT 4821</span>
              <span className="text-rally-border">•</span>
              <span className="px-2 py-0.5 rounded-sm text-xs bg-rally-cyan/15 text-rally-cyan border border-rally-cyan/30">
                STATE: {activeState}
              </span>
            </div>
            <h1 className="text-lg font-bold text-rally-text tracking-wide mt-1">
              CHECKOUT REGRESSION
            </h1>
            <p className="text-xs text-rally-secondary font-sans mt-0.5">
              Elevated customer-facing error rate (18.4%) on <span className="font-mono text-rally-text">checkout-service</span> following deployment of <span className="font-mono text-rally-text">checkout-v42</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeState === 'IDLE' ? (
              <button
                type="button"
                onClick={onInvestigate}
                disabled={isProcessing}
                className="text-xs font-bold text-white bg-rally-blue hover:bg-rally-blue/90 px-4 py-2 rounded transition-all disabled:opacity-40"
              >
                {isProcessing ? 'INVESTIGATING…' : 'INVESTIGATE INCIDENT'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onReset}
                disabled={isProcessing}
                className="text-xs text-rally-secondary hover:text-rally-text bg-rally-bg border border-rally-border px-3 py-1.5 rounded transition-colors disabled:opacity-40"
              >
                RESET SIMULATION
              </button>
            )}
          </div>
        </div>

        {/* Detailed Operational Incident Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-3">
          <div className="bg-rally-bg border border-rally-border rounded p-2.5">
            <span className="text-[10px] text-rally-muted uppercase block">ERROR RATE</span>
            <span className={`text-base font-bold mt-0.5 block ${isResolved ? 'text-rally-green' : 'text-rally-red'}`}>
              {numericErrorRate.toFixed(2)}%
            </span>
            <span className="text-[10px] text-rally-muted">Baseline: 0.70%</span>
          </div>

          <div className="bg-rally-bg border border-rally-border rounded p-2.5">
            <span className="text-[10px] text-rally-muted uppercase block">ACTIVE DEPLOYMENT</span>
            <span className="text-sm font-bold text-rally-text mt-0.5 block">
              {isResolved ? 'checkout-v41' : (state?.active_deployment ?? 'checkout-v42')}
            </span>
            <span className="text-[10px] text-rally-secondary">Target: checkout-v41</span>
          </div>

          <div className="bg-rally-bg border border-rally-border rounded p-2.5">
            <span className="text-[10px] text-rally-muted uppercase block">AFFECTED SERVICE</span>
            <span className="text-sm font-bold text-rally-text mt-0.5 block">
              {state?.service_id ?? 'checkout-service'}
            </span>
            <span className="text-[10px] text-rally-muted">Tier-1 Core Checkout</span>
          </div>

          <div className="bg-rally-bg border border-rally-border rounded p-2.5">
            <span className="text-[10px] text-rally-muted uppercase block">SERVICE HEALTH</span>
            <span className={`text-sm font-bold mt-0.5 flex items-center gap-1.5 ${isResolved ? 'text-rally-green' : 'text-rally-red'}`}>
              <span className={`w-2 h-2 rounded-full ${isResolved ? 'bg-rally-green' : 'bg-rally-red animate-pulse'}`} />
              {isResolved ? 'HEALTHY' : 'DEGRADED'}
            </span>
            <span className="text-[10px] text-rally-muted">
              {isResolved ? 'Verified restored' : 'Customer transactions impacted'}
            </span>
          </div>
        </div>
      </div>

      {/* Incident Lifecycle Journey */}
      <IncidentJourney state={activeState} />

      {/* Live Error Rate Telemetry Chart */}
      <ErrorRateChart
        currentRate={numericErrorRate}
        baseline={0.7}
        isRecovered={isResolved}
      />

      {/* Cross-navigation prompt */}
      <div className="p-3 bg-rally-surface border border-rally-border rounded flex items-center justify-between text-xs">
        <span className="text-rally-secondary">
          Next Operational Step: {activeState === 'AWAITING_APPROVAL' ? 'Review human approval gate' : 'Inspect evidence ledger and root cause'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/evidence')}
            className="px-2.5 py-1 rounded bg-rally-bg border border-rally-border hover:border-rally-blue text-rally-text"
          >
            Go to Evidence →
          </button>
          <button
            onClick={() => onNavigate('/approval')}
            className="px-2.5 py-1 rounded bg-rally-amber/15 border border-rally-amber/40 text-rally-amber hover:bg-rally-amber/25 font-bold"
          >
            Go to Approval →
          </button>
        </div>
      </div>
    </div>
  )
}
