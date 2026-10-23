import React, { useEffect, useState } from 'react'

interface GlobalHeaderProps {
  hasActiveIncident: boolean
  activeIncidentLabel?: string
  incidentId?: string
  apiHealthy?: boolean
  environment?: string
  currentPath?: string
  onOpenCommandPalette?: () => void
  onToggleMobileNav?: () => void
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  hasActiveIncident,
  activeIncidentLabel = 'CHECKOUT REGRESSION',
  incidentId = '4821',
  apiHealthy = true,
  environment = 'SIMULATOR',
  currentPath = '/overview',
  onOpenCommandPalette,
  onToggleMobileNav,
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

  // Map route path to human readable context title
  const getPageTitle = (path: string): string => {
    switch (path) {
      case '/overview':
        return 'INCIDENT COMMAND COCKPIT'
      case '/incident':
        return 'INCIDENT FORENSIC OVERVIEW'
      case '/evidence':
        return 'FORENSIC EVIDENCE LEDGER'
      case '/timeline':
        return 'CHRONOLOGICAL TIMELINE'
      case '/hypotheses':
        return 'RANKED ROOT-CAUSE HYPOTHESES'
      case '/action-plan':
        return 'REMEDIATION ACTION PLAN'
      case '/approval':
        return 'GOVERNANCE APPROVAL BARRIER'
      case '/execution':
        return 'EXECUTION & VERIFICATION'
      case '/services':
        return 'SERVICE TOPOLOGY & TELEMETRY'
      case '/mcp':
        return 'MCP TOOL REGISTRY'
      case '/database':
        return 'POSTGRESQL & SECRETS TELEMETRY'
      default:
        return 'OPERATIONS COCKPIT'
    }
  }

  return (
    <header className="h-12 bg-obsidian border-b border-steel px-3 sm:px-4 flex items-center justify-between select-none shrink-0 z-30 font-sans">
      {/* ── Left: Mobile Menu Trigger + Contextual View Title ─────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileNav && (
          <button
            type="button"
            onClick={onToggleMobileNav}
            aria-label="Open navigation menu"
            className="md:hidden text-ash hover:text-off-white p-1 rounded hover:bg-graphite transition-colors"
          >
            <span className="text-sm font-mono">☰</span>
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <span className="font-display text-base text-off-white tracking-wide truncate">
            {getPageTitle(currentPath)}
          </span>
          <span className="hidden sm:inline-block text-steel">/</span>
          <span className="hidden sm:inline-block text-[10px] font-mono text-ash tracking-widest uppercase">
            RALLY SECURE COCKPIT
          </span>
        </div>
      </div>

      {/* ── Center: Incident Status Banner ─────────────────────────────────── */}
      <div className="hidden md:flex items-center">
        {hasActiveIncident ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-crimson/15 border border-crimson/40 text-crimson text-xs font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse" />
            <span className="text-off-white font-semibold">INCIDENT #{incidentId}</span>
            <span className="text-steel">|</span>
            <span className="text-crimson truncate max-w-[140px] lg:max-w-none">
              {activeIncidentLabel}
            </span>
            <span className="text-steel">|</span>
            <span className="bg-crimson text-off-white text-[9px] font-bold px-1.5 py-0.2 rounded">
              SEV-2
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-charcoal border border-steel text-success-green text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-success-green" />
            <span className="text-off-white">ALL SYSTEMS OPERATIONAL</span>
          </div>
        )}
      </div>

      {/* ── Right: Command Trigger + Environment + Connection & Clock ──────── */}
      <div className="flex items-center gap-2.5 sm:gap-3 text-xs font-mono shrink-0">
        {/* Command Palette Trigger */}
        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            title="Open Command Palette (Cmd+K / Ctrl+K)"
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-graphite border border-steel text-ash hover:text-off-white hover:border-tactical-gold/50 transition-colors"
          >
            <span className="text-tactical-gold text-[10px]">⌘</span>
            <span className="hidden lg:inline text-[11px] font-sans">Find command</span>
            <kbd className="hidden sm:inline-block text-[9px] font-mono text-ash bg-charcoal border border-steel px-1 rounded">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Environment Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded bg-charcoal border border-steel text-[10px]">
          <span className="text-ash uppercase">ENV:</span>
          <span className="text-tactical-gold font-medium uppercase">{environment}</span>
        </div>

        {/* API Connection Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-ash text-[11px]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              apiHealthy ? 'bg-success-green' : 'bg-crimson'
            }`}
          />
          <span className="text-off-white/80 font-mono text-[10px] uppercase">
            {apiHealthy ? 'API ONLINE' : 'API OFFLINE'}
          </span>
        </div>

        {/* Local Clock */}
        <div className="px-2 py-1 rounded bg-charcoal border border-steel text-off-white font-mono text-[11px]">
          {time}
        </div>
      </div>
    </header>
  )
}
