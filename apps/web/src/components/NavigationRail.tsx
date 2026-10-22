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
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  currentPath,
  onNavigate,
  badges,
}) => {
  const navSections = [
    {
      title: 'COMMAND',
      items: [
        { path: '/overview', label: 'Overview' },
        {
          path: '/incident',
          label: 'Active Incident',
          badge: badges.incident,
          badgeColor: badges.incidentColor ?? 'red',
        },
      ],
    },
    {
      title: 'INVESTIGATION',
      items: [
        {
          path: '/evidence',
          label: 'Evidence',
          badge: badges.evidenceCount !== undefined && badges.evidenceCount > 0 ? String(badges.evidenceCount) : undefined,
          badgeColor: 'blue' as const,
        },
        {
          path: '/timeline',
          label: 'Timeline',
          badge: badges.timelineCount !== undefined && badges.timelineCount > 0 ? String(badges.timelineCount) : undefined,
          badgeColor: 'blue' as const,
        },
        { path: '/hypotheses', label: 'Hypotheses' },
      ],
    },
    {
      title: 'RESPONSE',
      items: [
        { path: '/action-plan', label: 'Action Plan' },
        {
          path: '/approval',
          label: 'Approval',
          badge: badges.approval,
          badgeColor: (badges.approvalColor ?? 'amber') as 'amber' | 'green' | 'gray',
        },
        {
          path: '/execution',
          label: 'Execution',
          badge: badges.execution,
          badgeColor: (badges.executionColor ?? 'green') as 'green' | 'blue' | 'gray',
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          path: '/services',
          label: 'Services',
          badge: badges.services,
          badgeColor: (badges.servicesColor ?? 'green') as 'red' | 'green',
        },
        {
          path: '/mcp',
          label: 'MCP',
          badge: badges.mcp ?? 'CONNECTED',
          badgeColor: 'cyan' as const,
        },
        { path: '/database', label: 'Database' },
      ],
    },
  ]

  const getBadgeClasses = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-rally-red/15 text-rally-red border border-rally-red/30'
      case 'amber':
        return 'bg-rally-amber/15 text-rally-amber border border-rally-amber/30 animate-pulse'
      case 'green':
        return 'bg-rally-green/15 text-rally-green border border-rally-green/30'
      case 'cyan':
      case 'blue':
        return 'bg-rally-cyan/15 text-rally-cyan border border-rally-cyan/30'
      case 'gray':
      default:
        return 'bg-rally-bg text-rally-muted border border-rally-border'
    }
  }

  return (
    <aside className="w-[210px] shrink-0 bg-rally-bg border-r border-rally-border flex flex-col justify-between select-none">
      <div className="py-2.5">
        {navSections.map((sec) => (
          <div key={sec.title} className="mb-3">
            <div className="px-3.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-rally-muted">
              {sec.title}
            </div>
            <div className="mt-0.5 space-y-0.5 px-2">
              {sec.items.map((item) => {
                const isActive = currentPath === item.path
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => onNavigate(item.path)}
                    className={`w-full text-left px-2 py-1.5 rounded-sm text-xs font-mono transition-colors flex items-center justify-between ${
                      isActive
                        ? 'bg-rally-surface text-rally-text font-bold border-l-2 border-rally-cyan pl-2'
                        : 'text-rally-secondary hover:text-rally-text hover:bg-rally-surface/60'
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-sm font-semibold uppercase font-mono shrink-0 ml-1.5 ${getBadgeClasses(
                          item.badgeColor
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

      {/* Navigation Footer */}
      <div className="p-3 border-t border-rally-border bg-rally-bg-alt font-mono text-[10px]">
        <div className="text-rally-muted uppercase">ENVIRONMENT</div>
        <div className="text-rally-text font-semibold flex items-center justify-between mt-0.5">
          <span>SIMULATOR</span>
          <span className="flex items-center gap-1 text-rally-green font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-rally-green" />
            ONLINE
          </span>
        </div>
      </div>
    </aside>
  )
}
