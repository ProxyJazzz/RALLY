import React, { useState } from 'react'

interface ServiceTopologyProps {
  activeDeployment?: string
  isRecovered?: boolean
  mcpActive?: boolean
  selectedServiceId?: string
  onSelectService?: (serviceId: string) => void
}

export const ServiceTopology: React.FC<ServiceTopologyProps> = ({
  activeDeployment = 'checkout-v42',
  isRecovered = false,
  mcpActive = false,
  selectedServiceId,
  onSelectService,
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const handleNodeClick = (serviceId: string) => {
    if (onSelectService) {
      onSelectService(serviceId)
    }
  }

  const isCheckoutSelected = selectedServiceId === 'checkout-service'
  const isPaymentSelected = selectedServiceId === 'payment-service'
  const isInventorySelected = selectedServiceId === 'inventory-service'
  const isAuthSelected = selectedServiceId === 'auth-service'

  return (
    <div className="bg-obsidian border border-steel rounded p-5 sm:p-6 select-none flex flex-col justify-between font-sans">
      <div className="flex items-center justify-between pb-3 border-b border-steel/60 text-[10px] font-mono uppercase text-ash tracking-wider">
        <span className="flex items-center gap-2">
          <span className="text-tactical-gold font-mono">⛁</span>
          <span className="text-off-white font-medium">LIVE SYSTEM TOPOLOGY MAP</span>
        </span>
        <span
          className={`font-bold ${
            isRecovered ? 'text-success-green' : 'text-crimson'
          }`}
        >
          {isRecovered ? 'TOPOLOGY 100% HEALTHY' : '1 NODE DEGRADED (CHECKOUT)'}
        </span>
      </div>

      <div className="py-6 flex flex-col items-center justify-center font-mono text-xs">
        {/* Tier 0: USERS INGRESS TRAFFIC */}
        <div className="flex flex-col items-center">
          <div className="px-3.5 py-1.5 rounded bg-charcoal border border-steel text-off-white text-[10px] tracking-widest uppercase flex items-center gap-2 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-cyan animate-pulse" />
            <span>PUBLIC INGRESS TRAFFIC (INTERNET)</span>
          </div>

          <div className="h-5 w-px bg-steel/80 flex items-center justify-center relative">
            <span className="text-[8px] text-ash absolute -right-2 top-1">▼</span>
          </div>

          {/* Tier 0.5: APPLICATION LOAD BALANCER / API GATEWAY */}
          <div className="px-3 py-1 rounded bg-charcoal/80 border border-steel/80 text-ash text-[10px] tracking-wider uppercase">
            <span>PUBLIC ALB / FASTAPI GATEWAY (:8000)</span>
          </div>

          <div className="h-5 w-px bg-steel/80 flex items-center justify-center relative">
            <span className="text-[8px] text-ash absolute -right-2 top-1">▼</span>
          </div>
        </div>

        {/* Tier 1: CHECKOUT CORE SERVICE (DOMINANT FOCAL POINT) */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Checkout Service Node"
          onClick={() => handleNodeClick('checkout-service')}
          onMouseEnter={() => setHoveredNode('checkout-service')}
          onMouseLeave={() => setHoveredNode(null)}
          onKeyDown={(e) => e.key === 'Enter' && handleNodeClick('checkout-service')}
          className={`w-full max-w-[340px] p-4 rounded border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-tactical-gold ${
            isRecovered
              ? 'bg-charcoal border-success-green/50 text-success-green shadow-tactical-green'
              : 'bg-charcoal border-crimson/60 text-crimson shadow-tactical-crimson'
          } ${
            isCheckoutSelected
              ? 'ring-2 ring-tactical-gold'
              : hoveredNode === 'checkout-service'
              ? 'border-tactical-gold/70'
              : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="font-display text-xl text-off-white tracking-wider block">
                CHECKOUT-SERVICE
              </span>
              <span className="text-[9px] text-ash font-mono uppercase block -mt-0.5">
                TIER-1 CORE INGRESS
              </span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                isRecovered
                  ? 'bg-success-green/20 text-success-green border border-success-green/40'
                  : 'bg-crimson/20 text-crimson border border-crimson/40 animate-pulse'
              }`}
            >
              {isRecovered ? 'HEALTHY' : 'CRITICAL'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono mt-2 pt-2 border-t border-steel/60 text-off-white">
            <span className="text-ash">{isRecovered ? 'checkout-v41' : activeDeployment}</span>
            <span className={isRecovered ? 'text-success-green font-bold' : 'text-crimson font-bold text-sm'}>
              {isRecovered ? '0.70% ERR' : '18.4% ERR'}
            </span>
          </div>

          {mcpActive && (
            <div className="text-[10px] text-signal-cyan mt-1.5 flex items-center gap-1.5 font-mono pt-1 border-t border-steel/40">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-cyan animate-ping" />
              <span>MCP Active Probe In Progress...</span>
            </div>
          )}
        </div>

        {/* Downstream Connector Edges (SVG) */}
        <div className="w-full max-w-[480px] h-8 relative my-1">
          <svg className="w-full h-full overflow-visible">
            <line x1="50%" y1="0" x2="50%" y2="14" stroke="#383838" strokeWidth="1.5" />
            <line x1="16.6%" y1="14" x2="83.3%" y2="14" stroke="#383838" strokeWidth="1.5" />
            <line x1="16.6%" y1="14" x2="16.6%" y2="32" stroke="#383838" strokeWidth="1.5" />
            <line x1="50%" y1="14" x2="50%" y2="32" stroke="#383838" strokeWidth="1.5" />
            <line x1="83.3%" y1="14" x2="83.3%" y2="32" stroke="#383838" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Tier 2: DOWNSTREAM DEPENDENCY NODES (3 NODES) */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[540px]">
          {/* Payment */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Payment Service Node"
            onClick={() => handleNodeClick('payment-service')}
            onMouseEnter={() => setHoveredNode('payment-service')}
            onMouseLeave={() => setHoveredNode(null)}
            onKeyDown={(e) => e.key === 'Enter' && handleNodeClick('payment-service')}
            className={`bg-charcoal border rounded p-3 text-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-tactical-gold ${
              isPaymentSelected
                ? 'border-tactical-gold ring-1 ring-tactical-gold'
                : 'border-steel hover:border-tactical-gold/40'
            }`}
          >
            <div className="text-xs font-bold text-off-white truncate font-sans">PAYMENT</div>
            <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-success-green mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success-green" />
              HEALTHY
            </div>
            <div className="text-[9px] font-mono text-ash mt-1">28ms • 0.02% Err</div>
          </div>

          {/* Inventory */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Inventory Service Node"
            onClick={() => handleNodeClick('inventory-service')}
            onMouseEnter={() => setHoveredNode('inventory-service')}
            onMouseLeave={() => setHoveredNode(null)}
            onKeyDown={(e) => e.key === 'Enter' && handleNodeClick('inventory-service')}
            className={`bg-charcoal border rounded p-3 text-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-tactical-gold ${
              isInventorySelected
                ? 'border-tactical-gold ring-1 ring-tactical-gold'
                : 'border-steel hover:border-tactical-gold/40'
            }`}
          >
            <div className="text-xs font-bold text-off-white truncate font-sans">INVENTORY</div>
            <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-success-green mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success-green" />
              HEALTHY
            </div>
            <div className="text-[9px] font-mono text-ash mt-1">16ms • 0.05% Err</div>
          </div>

          {/* Auth */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Auth Service Node"
            onClick={() => handleNodeClick('auth-service')}
            onMouseEnter={() => setHoveredNode('auth-service')}
            onMouseLeave={() => setHoveredNode(null)}
            onKeyDown={(e) => e.key === 'Enter' && handleNodeClick('auth-service')}
            className={`bg-charcoal border rounded p-3 text-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-tactical-gold ${
              isAuthSelected
                ? 'border-tactical-gold ring-1 ring-tactical-gold'
                : 'border-steel hover:border-tactical-gold/40'
            }`}
          >
            <div className="text-xs font-bold text-off-white truncate font-sans">AUTH</div>
            <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-success-green mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success-green" />
              HEALTHY
            </div>
            <div className="text-[9px] font-mono text-ash mt-1">12ms • 0.01% Err</div>
          </div>
        </div>

        {/* Tier 3: DATABASE CONNECTOR */}
        <div className="flex flex-col items-center mt-3">
          <div className="h-4 w-px bg-steel/80" />
          <div className="px-4 py-1.5 rounded bg-charcoal border border-steel text-off-white text-[10px] tracking-wider uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success-green" />
            <span>POSTGRESQL DATA LAYER (RDS PRIVATE)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
