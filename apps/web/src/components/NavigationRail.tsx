import React from 'react'

export type NavSection =
  | 'overview'
  | 'incident'
  | 'evidence'
  | 'timeline'
  | 'hypotheses'
  | 'action_plan'
  | 'approval'
  | 'execution'
  | 'services'
  | 'mcp'
  | 'database'

export interface SidebarBadges {
  incident?: string
  incidentColor?: 'red' | 'green' | 'gray'
  evidenceCount?: number
  timelineCount?: number
  approval?: string
  approvalColor?: 'amber' | 'green' | 'gray'
  execution?: string
  executionColor?: 'green' | 'blue' | 'gray'
  services?: string
  servicesColor?: 'red' | 'green'
  mcp?: string
}

interface NavigationRailProps {
  currentPath: string
  onNavigate: (path: string) => void
  badges: SidebarBadges
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

interface NavItem {
  path: string
  label: string
  icon: string
  badge?: string
  badgeColor?: 'red' | 'amber' | 'green' | 'blue' | 'cyan' | 'gray'
  tooltip: string
}

interface NavGroup {
  title: string
  items: NavItem[]
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  currentPath,
  onNavigate,
  badges,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onMobileClose,
}) => {
  const navSections: NavGroup[] = [
    {
      title: 'COMMAND',
      items: [
        {
          path: '/overview',
          label: 'Overview',
          icon: '⌂',
          tooltip: 'Cockpit Overview',
        },
        {
          path: '/incident',
          label: 'Live Incidents',
          icon: '!',
          badge: badges.incident,
          badgeColor: badges.incidentColor ?? 'red',
          tooltip: 'Active Incident Telemetry',
        },
      ],
    },
    {
      title: 'INVESTIGATE',
      items: [
        {
          path: '/evidence',
          label: 'Evidence',
          icon: '◈',
          badge:
            badges.evidenceCount !== undefined && badges.evidenceCount > 0
              ? String(badges.evidenceCount)
              : undefined,
          badgeColor: 'blue',
          tooltip: 'Forensic Evidence Ledger',
        },
        {
          path: '/timeline',
          label: 'Timeline',
          icon: '◌',
          badge:
            badges.timelineCount !== undefined && badges.timelineCount > 0
              ? String(badges.timelineCount)
              : undefined,
          badgeColor: 'blue',
          tooltip: 'Incident Event Timeline',
        },
        {
          path: '/hypotheses',
          label: 'Hypotheses',
          icon: '∿',
          tooltip: 'Ranked Root-Cause Hypotheses',
        },
      ],
    },
    {
      title: 'OPERATE',
      items: [
        {
          path: '/action-plan',
          label: 'Action Plan',
          icon: '📋',
          tooltip: 'Synthesized Remediation Plan',
        },
        {
          path: '/approval',
          label: 'Approval',
          icon: '🛡',
          badge: badges.approval,
          badgeColor: (badges.approvalColor ?? 'amber') as 'amber' | 'green' | 'gray',
          tooltip: 'Governance Approval Barrier',
        },
        {
          path: '/execution',
          label: 'Execution',
          icon: '⚡',
          badge: badges.execution,
          badgeColor: (badges.executionColor ?? 'green') as 'green' | 'blue' | 'gray',
          tooltip: 'Remediation Execution & Verification',
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          path: '/services',
          label: 'Services',
          icon: '⛁',
          badge: badges.services,
          badgeColor: (badges.servicesColor ?? 'green') as 'red' | 'green',
          tooltip: 'Microservice Topology & Canary Health',
        },
        {
          path: '/mcp',
          label: 'MCP Tools',
          icon: '⚙',
          badge: badges.mcp ?? 'CONNECTED',
          badgeColor: 'cyan',
          tooltip: 'Model Context Protocol Server Tools',
        },
        {
          path: '/database',
          label: 'Database',
          icon: '⌗',
          tooltip: 'PostgreSQL RDS & Secrets Health',
        },
      ],
    },
  ]

  const getBadgeClasses = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-crimson/20 text-crimson border border-crimson/40'
      case 'amber':
        return 'bg-warning-amber/20 text-warning-amber border border-warning-amber/40 animate-pulse'
      case 'green':
        return 'bg-success-green/20 text-success-green border border-success-green/40'
      case 'cyan':
      case 'blue':
        return 'bg-signal-cyan/20 text-signal-cyan border border-signal-cyan/40'
      case 'gray':
      default:
        return 'bg-charcoal text-ash border border-steel'
    }
  }

  const handleItemClick = (path: string) => {
    onNavigate(path)
    if (isMobileOpen && onMobileClose) {
      onMobileClose()
    }
  }

  const content = (
    <aside
      className={`h-full flex flex-col justify-between bg-obsidian border-r border-steel select-none transition-all duration-200 ${
        isCollapsed ? 'w-[60px]' : 'w-[230px]'
      }`}
    >
      {/* ── TOP: Brand & Collapse Toggle ───────────────────────────────── */}
      <div className="shrink-0 border-b border-steel/80 bg-charcoal/50">
        <div className="h-12 px-3.5 flex items-center justify-between">
          {!isCollapsed ? (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display text-lg tracking-wider text-off-white">
                  RALLY
                </span>
                <span className="text-[9px] font-mono text-tactical-gold tracking-widest px-1 py-0.2 rounded bg-charcoal border border-steel/60">
                  v0.1.0
                </span>
              </div>
              <span className="text-[9px] font-mono tracking-widest text-ash uppercase truncate -mt-0.5">
                AGENTIC RELIABILITY
              </span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <span className="font-display text-xl text-tactical-gold tracking-wider">
                R
              </span>
            </div>
          )}

          {/* Desktop Collapse Trigger */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar ([)' : 'Collapse sidebar ([)'}
              className={`text-ash hover:text-off-white hover:bg-graphite p-1 rounded transition-colors hidden md:block ${
                isCollapsed ? 'mx-auto' : ''
              }`}
            >
              <span className="text-xs font-mono">{isCollapsed ? '›' : '‹'}</span>
            </button>
          )}

          {/* Mobile Close Button */}
          {isMobileOpen && onMobileClose && (
            <button
              type="button"
              onClick={onMobileClose}
              aria-label="Close navigation"
              className="text-ash hover:text-off-white p-1 rounded md:hidden"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── MIDDLE: Categorized Navigation ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-2.5 space-y-4">
        {navSections.map((sec) => (
          <div key={sec.title} className="space-y-1">
            {!isCollapsed ? (
              <div className="px-3.5 text-[10px] font-mono font-semibold tracking-widest uppercase text-ash/80">
                {sec.title}
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <div className="w-5 h-[1px] bg-steel/60 my-1" />
              </div>
            )}

            <div className="space-y-0.5 px-2">
              {sec.items.map((item) => {
                const isActive = currentPath === item.path
                return (
                  <button
                    key={item.path}
                    type="button"
                    title={item.tooltip}
                    onClick={() => handleItemClick(item.path)}
                    className={`w-full group text-left rounded transition-colors flex items-center ${
                      isCollapsed
                        ? 'h-9 justify-center'
                        : 'px-2.5 py-1.5 justify-between'
                    } ${
                      isActive
                        ? 'bg-graphite text-off-white font-medium border-l-2 border-tactical-gold pl-2'
                        : 'text-off-white/75 hover:text-off-white hover:bg-charcoal'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`text-xs font-mono shrink-0 transition-colors ${
                          isActive
                            ? 'text-tactical-gold font-bold'
                            : 'text-ash group-hover:text-off-white'
                        }`}
                      >
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <span className="text-xs font-sans tracking-tight truncate">
                          {item.label}
                        </span>
                      )}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold uppercase shrink-0 ml-1.5 ${getBadgeClasses(
                          item.badgeColor ?? 'gray'
                        )}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── BOTTOM: Environment & Simulator Telemetry ──────────────────── */}
      <div className="shrink-0 p-3 border-t border-steel bg-charcoal/40 font-mono text-[10px]">
        {!isCollapsed ? (
          <div>
            <div className="text-ash uppercase text-[9px] tracking-wider">ENVIRONMENT</div>
            <div className="text-off-white font-medium flex items-center justify-between mt-0.5">
              <span>SIMULATOR</span>
              <span className="flex items-center gap-1.5 text-success-green font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-success-green animate-pulse" />
                ONLINE
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Simulator Online">
            <span className="w-2 h-2 rounded-full bg-success-green animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block shrink-0 h-full">{content}</div>

      {/* Mobile Off-Canvas Drawer */}
      {isMobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 md:hidden flex"
        >
          {/* Backdrop */}
          <div
            onClick={onMobileClose}
            className="fixed inset-0 bg-void-black/80 backdrop-blur-sm transition-opacity"
          />
          {/* Drawer */}
          <div className="relative z-50 w-[240px] max-w-[85vw] h-full shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  )
}
