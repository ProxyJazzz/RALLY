import React from 'react'
import { ServiceTopology } from '../components/ServiceTopology'

interface ServicesViewProps {
  activeDeployment?: string
  isRecovered?: boolean
  errorRate?: number
  onNavigate: (route: string) => void
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  activeDeployment = 'checkout-v42',
  isRecovered = false,
  errorRate = 18.4,
  onNavigate,
}) => {
  const services = [
    {
      id: 'checkout-service',
      name: 'CHECKOUT SERVICE',
      tier: 'Tier-1 Core',
      status: isRecovered ? 'HEALTHY' : 'DEGRADED',
      healthColor: isRecovered ? 'green' : 'red',
      errorRate: isRecovered ? '0.70%' : `${errorRate.toFixed(1)}%`,
      deployment: isRecovered ? 'checkout-v41' : activeDeployment,
      role: 'Order placement and cart validation',
    },
    {
      id: 'payment-service',
      name: 'PAYMENT SERVICE',
      tier: 'Tier-1 Dependency',
      status: 'HEALTHY',
      healthColor: 'green',
      errorRate: '0.02%',
      deployment: 'payment-v12',
      role: 'Credit card processing and PSP tokenization',
    },
    {
      id: 'inventory-service',
      name: 'INVENTORY SERVICE',
      tier: 'Tier-2 Dependency',
      status: 'HEALTHY',
      healthColor: 'green',
      errorRate: '0.05%',
      deployment: 'inventory-v8',
      role: 'Real-time stock reservation and SKU lock',
    },
    {
      id: 'auth-service',
      name: 'AUTH SERVICE',
      tier: 'Tier-1 Shared',
      status: 'HEALTHY',
      healthColor: 'green',
      errorRate: '0.01%',
      deployment: 'auth-v3',
      role: 'Session validation and customer JWT authentication',
    },
  ]

  return (
    <div className="space-y-3 font-mono">
      {/* Workspace Header */}
      <div className="bg-rally-surface border border-rally-border rounded p-3.5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-rally-text uppercase tracking-wider">
              SERVICE TOPOLOGY & INFRASTRUCTURE REGISTRY
            </h1>
            <span
              className={`px-2 py-0.2 rounded-sm text-xs font-bold uppercase ${
                isRecovered
                  ? 'bg-rally-green/20 text-rally-green border border-rally-green/40'
                  : 'bg-rally-red/20 text-rally-red border border-rally-red/40'
              }`}
            >
              {isRecovered ? 'ALL SERVICES OPERATIONAL' : '1 SERVICE DEGRADED'}
            </span>
          </div>
          <p className="text-xs text-rally-secondary font-sans mt-0.5">
            Operational topology and telemetry health metrics for all services registered in the RALLY simulator environment.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/overview')}
          className="px-2.5 py-1 rounded bg-rally-bg border border-rally-border hover:border-rally-blue text-xs text-rally-secondary hover:text-rally-text"
        >
          Command Overview →
        </button>
      </div>

      {/* Visual Dependency Topology Component */}
      <ServiceTopology
        activeDeployment={activeDeployment}
        isRecovered={isRecovered}
        mcpActive={false}
      />

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {services.map((svc) => {
          const isDegraded = svc.status === 'DEGRADED'
          return (
            <div
              key={svc.id}
              className={`p-3.5 rounded border transition-all ${
                isDegraded
                  ? 'bg-rally-surface border-rally-red/50 shadow-sm'
                  : 'bg-rally-surface border-rally-border'
              }`}
            >
              <div className="flex items-center justify-between border-b border-rally-border pb-2">
                <div>
                  <h3 className="text-xs font-bold text-rally-text">{svc.name}</h3>
                  <span className="text-[10px] text-rally-muted">{svc.tier}</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-sm font-bold flex items-center gap-1 ${
                    isDegraded
                      ? 'bg-rally-red/15 text-rally-red border border-rally-red/40 animate-pulse'
                      : 'bg-rally-green/15 text-rally-green border border-rally-green/40'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isDegraded ? 'bg-rally-red' : 'bg-rally-green'}`} />
                  {svc.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-2.5">
                <div>
                  <span className="text-[10px] text-rally-muted uppercase block">ERROR RATE</span>
                  <span className={`font-bold ${isDegraded ? 'text-rally-red' : 'text-rally-text'}`}>
                    {svc.errorRate}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-rally-muted uppercase block">ACTIVE DEPLOYMENT</span>
                  <span className="font-bold text-rally-text">{svc.deployment}</span>
                </div>
              </div>

              <p className="text-[11px] text-rally-secondary font-sans border-t border-rally-border/60 pt-2">
                {svc.role}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
