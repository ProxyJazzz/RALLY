import React from 'react'

interface SystemStatusBarProps {
  apiStatus?: 'healthy' | 'degraded' | 'error' | 'loading'
  dbStatus?: 'healthy' | 'degraded' | 'error' | 'loading'
  latencyMs?: number
  environment?: string
}

export const SystemStatusBar: React.FC<SystemStatusBarProps> = ({
  apiStatus = 'healthy',
  dbStatus = 'healthy',
  latencyMs,
  environment = 'SIMULATOR',
}) => {
  const isAllHealthy = apiStatus === 'healthy' && dbStatus === 'healthy'

  return (
    <footer className="h-7 bg-obsidian border-t border-steel px-3 sm:px-4 flex items-center justify-between text-[10px] font-mono text-ash select-none shrink-0 z-30">
      {/* ── Left: Platform & Telemetry Signals ─────────────────────────── */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <span className="font-bold text-off-white tracking-wider">RALLY</span>
        <span className="text-steel">|</span>

        {/* API Telemetry */}
        <div className="flex items-center gap-1.5">
          <span className="text-ash uppercase">API:</span>
          <span
            className={`flex items-center gap-1 font-semibold uppercase ${
              apiStatus === 'healthy' ? 'text-success-green' : 'text-crimson'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                apiStatus === 'healthy' ? 'bg-success-green' : 'bg-crimson animate-pulse'
              }`}
            />
            {apiStatus.toUpperCase()}
          </span>
        </div>

        <span className="hidden sm:inline text-steel">|</span>

        {/* Database Telemetry */}
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-ash uppercase">DB:</span>
          <span
            className={`flex items-center gap-1 font-semibold uppercase ${
              dbStatus === 'healthy' ? 'text-success-green' : 'text-crimson'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                dbStatus === 'healthy' ? 'bg-success-green' : 'bg-crimson animate-pulse'
              }`}
            />
            {dbStatus.toUpperCase()}
          </span>
        </div>

        {/* Optional Latency if provided by live health check */}
        {latencyMs !== undefined && (
          <>
            <span className="hidden md:inline text-steel">|</span>
            <div className="hidden md:flex items-center gap-1">
              <span className="text-ash uppercase">LATENCY:</span>
              <span className="text-off-white font-mono">{latencyMs.toFixed(2)}ms</span>
            </div>
          </>
        )}

        <span className="hidden lg:inline text-steel">|</span>
        <span className="hidden lg:inline text-ash">
          ENV: <span className="text-off-white uppercase">{environment}</span>
        </span>
      </div>

      {/* ── Right: Operations Capabilities Badges ──────────────────────── */}
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden md:flex items-center gap-1 text-ash">
          <span className="text-tactical-gold">MCP</span>
          <span>STREAMABLE HTTP</span>
        </span>

        <span className="hidden xl:flex items-center gap-1 text-ash">
          <span className="text-steel">|</span>
          <span className="text-signal-cyan">GOVERNANCE</span>
          <span>ENFORCED</span>
        </span>

        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-charcoal border border-steel">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isAllHealthy ? 'bg-success-green' : 'bg-crimson'
            }`}
          />
          <span className="text-off-white font-semibold uppercase tracking-wider text-[9px]">
            {isAllHealthy ? 'SYSTEM OPERATIONAL' : 'DEGRADED STATE'}
          </span>
        </span>
      </div>
    </footer>
  )
}
