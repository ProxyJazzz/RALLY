import React from 'react'

interface SystemStatusBarProps {
  apiStatus?: string
  dbStatus?: string
}

export const SystemStatusBar: React.FC<SystemStatusBarProps> = ({
  apiStatus = 'healthy',
  dbStatus = 'healthy',
}) => {
  return (
    <footer className="h-7 bg-rally-bg border-t border-rally-border px-3.5 flex items-center justify-between text-[11px] font-mono text-rally-muted select-none shrink-0 z-30">
      <div className="flex items-center gap-3">
        <span className="font-bold text-rally-text">RALLY v0.1.0</span>
        <span className="text-rally-border">|</span>
        <span className="hidden sm:inline">
          ENVIRONMENT: <span className="text-rally-secondary">SIMULATOR</span>
        </span>
        <span className="hidden md:inline text-rally-border">|</span>
        <span className="hidden md:inline">
          MCP: <span className="text-rally-blue">STREAMABLE HTTP</span>
        </span>
        <span className="hidden lg:inline text-rally-border">|</span>
        <span className="hidden lg:inline">
          GOVERNANCE: <span className="text-rally-amber">ENABLED</span>
        </span>
        <span className="hidden xl:inline text-rally-border">|</span>
        <span className="hidden xl:inline">
          VERIFICATION: <span className="text-rally-green">INDEPENDENT</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-rally-surface border border-rally-border text-[10px] text-rally-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-rally-blue" />
          ALEXA+ COMPATIBLE
          <span className="text-rally-muted">SIMULATION MODE</span>
        </span>
        <span className="hidden sm:flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              apiStatus === 'healthy' && dbStatus === 'healthy'
                ? 'bg-rally-green'
                : 'bg-rally-red'
            }`}
          />
          <span className="text-rally-secondary uppercase text-[10px]">
            {apiStatus === 'healthy' ? 'SYSTEM OPERATIONAL' : 'DEGRADED'}
          </span>
        </span>
      </div>
    </footer>
  )
}
