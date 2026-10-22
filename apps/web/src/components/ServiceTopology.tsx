import React from 'react'

interface ServiceTopologyProps {
  activeDeployment?: string
  isRecovered?: boolean
  mcpActive?: boolean
}

export const ServiceTopology: React.FC<ServiceTopologyProps> = ({
  activeDeployment = 'checkout-v42',
  isRecovered = false,
  mcpActive = false,
}) => {
  return (
    <div className="bg-rally-surface border border-rally-border rounded p-3 select-none flex flex-col justify-between">
      <div className="flex items-center justify-between pb-1.5 border-b border-rally-border text-[10px] font-mono uppercase text-rally-muted tracking-wider">
        <span className="flex items-center gap-2">
          <span>SERVICE DEPENDENCY TOPOLOGY</span>
          <span className="text-rally-cyan bg-rally-cyan/10 border border-rally-cyan/25 px-1 py-0.2 rounded-sm">
            mcp::get_dependency_health
          </span>
        </span>
        <span className={isRecovered ? 'text-rally-green' : 'text-rally-red font-semibold'}>
          {isRecovered ? 'TOPOLOGY HEALTHY' : '1 NODE DEGRADED (CHECKOUT)'}
        </span>
      </div>

      <div className="py-2 flex flex-col items-center justify-center font-mono text-xs">
        {/* USERS INGRESS */}
        <div className="flex flex-col items-center">
          <div className="px-2.5 py-0.5 rounded-sm bg-rally-bg border border-rally-border text-rally-secondary text-[10px] flex items-center gap-1">
            <span>USERS INGRESS (HTTP)</span>
          </div>
          {/* Ingress Edge */}
          <div className="h-4 w-px bg-rally-border flex items-center justify-center relative">
            <span className="text-[8px] text-rally-muted absolute -right-2 top-0.5">▼</span>
          </div>
        </div>

        {/* CHECKOUT CORE SERVICE (DOMINANT NODE) */}
        <div
          className={`w-full max-w-[280px] p-2.5 rounded border transition-all ${
            isRecovered
              ? 'bg-rally-green/10 border-rally-green/50 text-rally-green shadow-sm'
              : 'bg-rally-red/10 border-rally-red/50 text-rally-red shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-rally-text tracking-wide">
              CHECKOUT-SERVICE
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                isRecovered
                  ? 'bg-rally-green text-black'
                  : 'bg-rally-red text-white animate-pulse'
              }`}
            >
              {isRecovered ? 'HEALTHY' : '🔴 DEGRADED'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono mt-1 text-rally-text">
            <span>DEPLOYMENT: {isRecovered ? 'checkout-v41' : activeDeployment}</span>
            <span className={isRecovered ? 'text-rally-green' : 'text-rally-red font-bold'}>
              {isRecovered ? '0.70% ERR' : '18.4% ERR'}
            </span>
          </div>
          {mcpActive && (
            <div className="text-[9px] text-rally-cyan mt-1 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-rally-cyan animate-ping" />
              <span>MCP Telemetry Probing...</span>
            </div>
          )}
        </div>

        {/* Downstream Connector Edges (SVG) */}
        <div className="w-full max-w-[420px] h-7 relative">
          <svg className="w-full h-full overflow-visible">
            {/* Center stem down from Checkout */}
            <line x1="50%" y1="0" x2="50%" y2="12" stroke="#202833" strokeWidth="1.5" />
            {/* Horizontal distribution bar */}
            <line x1="16.6%" y1="12" x2="83.3%" y2="12" stroke="#202833" strokeWidth="1.5" />
            {/* Left drop to Payment */}
            <line x1="16.6%" y1="12" x2="16.6%" y2="28" stroke="#202833" strokeWidth="1.5" />
            {/* Center drop to Inventory */}
            <line x1="50%" y1="12" x2="50%" y2="28" stroke="#202833" strokeWidth="1.5" />
            {/* Right drop to Auth */}
            <line x1="83.3%" y1="12" x2="83.3%" y2="28" stroke="#202833" strokeWidth="1.5" />
          </svg>
        </div>

        {/* DOWNSTREAM DEPENDENCY NODES (3 NODES) */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[480px]">
          {/* Payment */}
          <div className="bg-rally-bg border border-rally-border rounded p-2 text-center">
            <div className="text-[10px] font-bold text-rally-text truncate">PAYMENT</div>
            <div className="flex items-center justify-center gap-1 text-[9px] text-rally-green mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rally-green" />
              HEALTHY
            </div>
            <div className="text-[9px] text-rally-muted mt-0.5">0.02% Err</div>
          </div>

          {/* Inventory */}
          <div className="bg-rally-bg border border-rally-border rounded p-2 text-center">
            <div className="text-[10px] font-bold text-rally-text truncate">INVENTORY</div>
            <div className="flex items-center justify-center gap-1 text-[9px] text-rally-green mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rally-green" />
              HEALTHY
            </div>
            <div className="text-[9px] text-rally-muted mt-0.5">0.05% Err</div>
          </div>

          {/* Auth */}
          <div className="bg-rally-bg border border-rally-border rounded p-2 text-center">
            <div className="text-[10px] font-bold text-rally-text truncate">AUTH</div>
            <div className="flex items-center justify-center gap-1 text-[9px] text-rally-green mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rally-green" />
              HEALTHY
            </div>
            <div className="text-[9px] text-rally-muted mt-0.5">0.01% Err</div>
          </div>
        </div>
      </div>
    </div>
  )
}
