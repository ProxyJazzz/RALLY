import React, { useState } from 'react'
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
  const [selectedServiceId, setSelectedServiceId] = useState<string>('checkout-service')

  const services = [
    {
      id: 'checkout-service',
      name: 'CHECKOUT SERVICE',
      tier: 'Tier-1 Core Ingress',
      status: isRecovered ? 'HEALTHY' : 'DEGRADED',
      healthColor: isRecovered ? 'green' : 'red',
      errorRate: isRecovered ? '0.70%' : `${errorRate.toFixed(1)}%`,
      deployment: isRecovered ? 'checkout-v41' : activeDeployment,
      role: 'Order placement and cart validation pipeline.',
      protocol: 'HTTP/2 REST',
      dependencies: ['payment-service', 'inventory-service', 'auth-service'],
    },
    {
      id: 'payment-service',
      name: 'PAYMENT SERVICE',
      tier: 'Tier-1 PSP Dependency',
      status: 'HEALTHY',
      healthColor: 'green',
      errorRate: '0.02%',
      deployment: 'payment-v12',
      role: 'Credit card processing, gateway authorization, and PSP tokenization.',
      protocol: 'gRPC / TLS',
      dependencies: ['external-payment-gw'],
    },
    {
      id: 'inventory-service',
      name: 'INVENTORY SERVICE',
      tier: 'Tier-2 Dependency',
      status: 'HEALTHY',
      healthColor: 'green',
      errorRate: '0.05%',
      deployment: 'inventory-v8',
      role: 'Real-time stock reservation, catalog availability, and SKU locking.',
      protocol: 'gRPC / TLS',
      dependencies: ['rds-postgresql'],
    },
    {
      id: 'auth-service',
      name: 'AUTH SERVICE',
      tier: 'Tier-1 Shared Security',
      status: 'HEALTHY',
      healthColor: 'green',
      errorRate: '0.01%',
      deployment: 'auth-v3',
      role: 'Customer JWT session validation, OAuth2 tokens, and security claims.',
      protocol: 'HTTP/2 REST',
      dependencies: ['redis-cache'],
    },
  ]

  const selectedService = services.find((s) => s.id === selectedServiceId) ?? services[0]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* ── 1. CINEMATIC EDITORIAL HERO ─────────────────────────────────── */}
      <div className="relative overflow-hidden bg-obsidian border border-steel rounded p-6 sm:p-8 select-none">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-signal-cyan/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-steel/60 pb-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-signal-cyan" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-off-white font-semibold">
              INFRASTRUCTURE TOPOLOGY & DEPENDENCY GRAPH
            </span>
            <span className="text-steel">|</span>
            <span
              className={`text-[10px] font-mono font-bold uppercase ${
                isRecovered ? 'text-success-green' : 'text-crimson'
              }`}
            >
              {isRecovered ? 'ALL SERVICES OPERATIONAL' : '1 SERVICE ISOLATED (CHECKOUT)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('/overview')}
              className="px-3.5 py-1.5 rounded bg-charcoal hover:bg-graphite border border-steel text-xs font-mono text-off-white transition-colors"
            >
              ← OVERVIEW COCKPIT
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/evidence')}
              className="px-3.5 py-1.5 rounded bg-charcoal hover:bg-graphite border border-steel text-xs font-mono text-off-white transition-colors"
            >
              FORENSIC EVIDENCE →
            </button>
          </div>
        </div>

        <div className="max-w-3xl">
          <div className="font-editorial italic text-tactical-gold text-base sm:text-lg mb-1">
            "Every failure has a boundary."
          </div>
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl tracking-tight text-off-white leading-none uppercase">
            SYSTEM TOPOLOGY
          </h1>
          <p className="font-sans text-sm sm:text-base text-ash mt-3 leading-relaxed">
            Continuous dependency tracing and circuit-breaker monitoring across the RALLY microservice mesh. When anomalies occur, RALLY isolates the blast radius to protect downstream nodes.
          </p>
        </div>
      </div>

      {/* ── 2. VISUAL TOPOLOGY GRAPH (INTERACTIVE SVG MAP) ───────────────── */}
      <ServiceTopology
        activeDeployment={activeDeployment}
        isRecovered={isRecovered}
        mcpActive={false}
        selectedServiceId={selectedServiceId}
        onSelectService={(id) => setSelectedServiceId(id)}
      />

      {/* ── 3. ASYMMETRIC SPLIT: Node Inspector & Service Registry ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Interactive Service Detail Inspector */}
        <div className="lg:col-span-5 bg-obsidian border border-steel rounded p-5 sm:p-6 select-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-steel/60 text-[10px] font-mono uppercase text-ash tracking-wider">
              <span>SERVICE TELEMETRY INSPECTOR</span>
              <span className="text-tactical-gold font-bold">{selectedService.id}</span>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-ash block">
                  SERVICE IDENTITY
                </span>
                <h3 className="font-display text-3xl text-off-white tracking-wide uppercase mt-0.5">
                  {selectedService.name}
                </h3>
                <span className="text-xs font-mono text-ash block mt-0.5">
                  {selectedService.tier} • {selectedService.protocol}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-steel/60 font-mono text-xs">
                <div className="bg-charcoal p-3 rounded border border-steel/70">
                  <span className="text-[9px] text-ash uppercase block">HEALTH STATUS</span>
                  <span
                    className={`font-bold text-sm block mt-1 ${
                      selectedService.status === 'HEALTHY' ? 'text-success-green' : 'text-crimson'
                    }`}
                  >
                    {selectedService.status}
                  </span>
                </div>

                <div className="bg-charcoal p-3 rounded border border-steel/70">
                  <span className="text-[9px] text-ash uppercase block">ACTIVE DEPLOYMENT</span>
                  <span className="text-off-white font-bold text-sm block mt-1">
                    {selectedService.deployment}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded bg-charcoal/70 border border-steel/70 font-sans text-xs">
                <span className="font-mono text-[9px] uppercase tracking-widest text-ash block mb-1">
                  FUNCTIONAL RESPONSIBILITY
                </span>
                <p className="text-off-white/90 leading-relaxed">
                  {selectedService.role}
                </p>
              </div>

              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-ash block mb-1.5">
                  DOWNSTREAM DEPENDENCY CIRCUIT
                </span>
                <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                  {selectedService.dependencies.map((dep) => (
                    <span
                      key={dep}
                      className="px-2 py-0.5 rounded bg-charcoal border border-steel/80 text-off-white/80 text-[10px]"
                    >
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-steel/60 font-mono text-[10px] text-ash flex items-center justify-between">
            <span>PROBED VIA MCP: get_service_health</span>
            <span className="text-success-green font-bold">LIVE TELEMETRY</span>
          </div>
        </div>

        {/* Right: Microservice Registry Table */}
        <div className="lg:col-span-7 bg-obsidian border border-steel rounded p-5 sm:p-6 select-none">
          <div className="flex items-center justify-between pb-3 border-b border-steel/60 text-[10px] font-mono uppercase text-ash tracking-wider">
            <span>REGISTERED MICROSERVICE NODES ({services.length})</span>
            <span>CLICK TO FOCUS INSPECTOR</span>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-steel/80 text-[10px] text-ash uppercase">
                  <th className="pb-2">SERVICE</th>
                  <th className="pb-2">TIER</th>
                  <th className="pb-2">DEPLOYMENT</th>
                  <th className="pb-2">ERROR RATE</th>
                  <th className="pb-2 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel/40 text-xs">
                {services.map((svc) => {
                  const isSelected = selectedServiceId === svc.id
                  const isDegraded = svc.status === 'DEGRADED'
                  return (
                    <tr
                      key={svc.id}
                      onClick={() => setSelectedServiceId(svc.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-graphite text-off-white border-l-2 border-tactical-gold pl-2'
                          : 'hover:bg-charcoal/50 text-off-white/80'
                      }`}
                    >
                      <td className="py-3 font-bold text-off-white">{svc.name}</td>
                      <td className="py-3 text-[10px] text-ash">{svc.tier}</td>
                      <td className="py-3 text-[11px] text-off-white">{svc.deployment}</td>
                      <td className={`py-3 font-bold ${isDegraded ? 'text-crimson' : 'text-off-white'}`}>
                        {svc.errorRate}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                            isDegraded
                              ? 'bg-crimson/15 text-crimson border-crimson/40 animate-pulse'
                              : 'bg-success-green/15 text-success-green border-success-green/40'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isDegraded ? 'bg-crimson' : 'bg-success-green'}`} />
                          {svc.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
