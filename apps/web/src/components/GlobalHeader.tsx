import React, { useEffect, useState } from 'react'

interface GlobalHeaderProps {
  hasActiveIncident: boolean
  activeIncidentLabel?: string
  incidentId?: string
  apiHealthy?: boolean
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  hasActiveIncident,
  activeIncidentLabel = 'CHECKOUT REGRESSION',
  incidentId = '4821',
  apiHealthy = true,
}) => {
  const [time, setTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="h-12 bg-rally-bg border-b border-rally-border px-4 flex items-center justify-between select-none shrink-0 z-30">
      {/* Left: Product Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-sm bg-rally-surface border border-rally-border flex items-center justify-center font-mono font-bold text-xs text-rally-cyan">
            R
          </div>
          <span className="font-mono font-bold tracking-wider text-rally-text text-sm">
            RALLY
          </span>
        </div>
        <span className="text-rally-border text-xs">|</span>
        <span className="text-[11px] font-mono text-rally-secondary hidden md:inline">
          Reliability & Response Orchestration
        </span>
      </div>

      {/* Center: Incident Badge */}
      <div className="flex items-center">
        {hasActiveIncident ? (
          <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-sm bg-rally-red/15 border border-rally-red/40 text-rally-red text-xs font-mono font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rally-red animate-pulse" />
            <span className="text-rally-text">INCIDENT {incidentId}</span>
            <span className="text-rally-border">/</span>
            <span>{activeIncidentLabel}</span>
            <span className="text-rally-border">/</span>
            <span className="bg-rally-red text-white text-[10px] px-1 rounded-sm">SEV-2</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-sm bg-rally-surface border border-rally-border text-rally-green text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-rally-green" />
            <span>ALL SYSTEMS OPERATIONAL</span>
          </div>
        )}
      </div>

      {/* Right: Operational Status & Local Clock */}
      <div className="flex items-center gap-3 text-xs font-mono">
        <div className="hidden sm:flex items-center gap-1.5 text-rally-secondary">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              apiHealthy ? 'bg-rally-green' : 'bg-rally-red'
            }`}
          />
          <span className="text-[11px]">SYSTEM OPERATIONAL</span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-rally-muted text-[11px]">
          <span>MCP</span>
          <span className="w-1.5 h-1.5 rounded-full bg-rally-cyan" />
          <span className="text-rally-cyan">CONNECTED</span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-rally-muted text-[11px]">
          <span>AGENT</span>
          <span className="w-1.5 h-1.5 rounded-full bg-rally-green" />
          <span className="text-rally-secondary">READY</span>
        </div>

        <div className="px-2 py-0.5 rounded-sm bg-rally-surface border border-rally-border text-rally-text font-mono text-[11px]">
          {time}
        </div>
      </div>
    </header>
  )
}
