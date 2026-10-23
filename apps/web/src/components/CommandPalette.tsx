import React, { useEffect, useState, useRef } from 'react'

export interface CommandItem {
  id: string
  title: string
  subtitle: string
  section: 'COMMAND' | 'INVESTIGATE' | 'OPERATE' | 'SYSTEM'
  path: string
  shortcut?: string
}

const COMMANDS: CommandItem[] = [
  // COMMAND
  {
    id: 'cmd-overview',
    title: 'Go to Overview',
    subtitle: 'Cockpit overview and high-level incident telemetry',
    section: 'COMMAND',
    path: '/overview',
  },
  {
    id: 'cmd-incident',
    title: 'Open Incident',
    subtitle: 'Active incident status, blast radius, and root cause summary',
    section: 'COMMAND',
    path: '/incident',
  },

  // INVESTIGATE
  {
    id: 'cmd-evidence',
    title: 'View Forensic Evidence',
    subtitle: 'Structured telemetry logs, trace comparisons, and deployment diffs',
    section: 'INVESTIGATE',
    path: '/evidence',
  },
  {
    id: 'cmd-timeline',
    title: 'View Incident Timeline',
    subtitle: 'Forensic sequence from anomalous canary deployment to detection',
    section: 'INVESTIGATE',
    path: '/timeline',
  },
  {
    id: 'cmd-hypotheses',
    title: 'View Hypotheses',
    subtitle: 'Ranked root-cause deductions and model confidence ratings',
    section: 'INVESTIGATE',
    path: '/hypotheses',
  },

  // OPERATE
  {
    id: 'cmd-action-plan',
    title: 'Open Action Plan',
    subtitle: 'Synthesized remediation steps, rollback safety checks, and blasts',
    section: 'OPERATE',
    path: '/action-plan',
  },
  {
    id: 'cmd-approval',
    title: 'Open Governance Approval',
    subtitle: 'Operator authorization barrier for destructive recovery actions',
    section: 'OPERATE',
    path: '/approval',
  },
  {
    id: 'cmd-execution',
    title: 'View Execution & Verification',
    subtitle: 'Autonomous MCP tool actions and independent telemetry verification',
    section: 'OPERATE',
    path: '/execution',
  },

  // SYSTEM
  {
    id: 'cmd-services',
    title: 'View Service Topology',
    subtitle: 'Checkout microservices, traffic allocation, and canary health',
    section: 'SYSTEM',
    path: '/services',
  },
  {
    id: 'cmd-mcp',
    title: 'Open MCP Tools',
    subtitle: 'Inspect live Model Context Protocol server tools and schemas',
    section: 'SYSTEM',
    path: '/mcp',
  },
  {
    id: 'cmd-database',
    title: 'Check Database & Connectivity',
    subtitle: 'Live PostgreSQL connection pooling, latency, and Secrets Manager status',
    section: 'SYSTEM',
    path: '/database',
  },
]

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (path: string) => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Filter commands by search query
  const filteredCommands = COMMANDS.filter((cmd) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle.toLowerCase().includes(q) ||
      cmd.section.toLowerCase().includes(q)
    )
  })

  // Reset selected item on query change or open
  useEffect(() => {
    setSelectedIndex(0)
  }, [query, isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 25)
    } else {
      setQuery('')
    }
  }, [isOpen])

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const activeElement = listRef.current.querySelector('[data-selected="true"]')
    if (activeElement) {
      activeElement.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) =>
        filteredCommands.length === 0 ? 0 : (prev + 1) % filteredCommands.length
      )
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) =>
        filteredCommands.length === 0
          ? 0
          : (prev - 1 + filteredCommands.length) % filteredCommands.length
      )
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      const target = filteredCommands[selectedIndex]
      if (target) {
        onNavigate(target.path)
        onClose()
      }
    }
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="RALLY Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:px-6 animate-in fade-in duration-150"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-void-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Palette Container */}
      <div
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-xl bg-obsidian border border-steel rounded shadow-2xl overflow-hidden z-10 flex flex-col font-sans"
        style={{
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(200, 155, 60, 0.15)',
        }}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-steel bg-charcoal/80">
          <span className="text-tactical-gold text-base mr-3 select-none font-mono">⌘</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, forensic views, operational tools..."
            className="w-full bg-transparent text-sm text-off-white placeholder-ash focus:outline-none font-sans"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-ash hover:text-off-white font-mono px-1.5 py-0.5 rounded"
            >
              CLEAR
            </button>
          ) : (
            <kbd className="hidden sm:inline-block text-[10px] font-mono text-ash bg-graphite border border-steel px-1.5 py-0.5 rounded">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[360px] overflow-y-auto py-2 px-1.5 divide-y divide-steel/30"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-ash font-mono">NO MATCHING COMMANDS FOUND</p>
              <p className="text-xs text-ash/60 mt-1">Try searching for "evidence", "incident", or "mcp"</p>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <div
                  key={cmd.id}
                  data-selected={isSelected}
                  onClick={() => {
                    onNavigate(cmd.path)
                    onClose()
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`group px-3 py-2.5 rounded cursor-pointer transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-graphite text-off-white border-l-2 border-tactical-gold pl-2.5'
                      : 'text-off-white/80 hover:bg-charcoal/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`text-xs font-mono select-none ${
                        isSelected ? 'text-tactical-gold' : 'text-ash'
                      }`}
                    >
                      ◈
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-off-white truncate font-sans">
                          {cmd.title}
                        </span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-charcoal border border-steel/60 text-ash shrink-0">
                          {cmd.section}
                        </span>
                      </div>
                      <p className="text-[11px] text-ash truncate mt-0.5">
                        {cmd.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {isSelected && (
                      <span className="text-[10px] font-mono text-tactical-gold flex items-center gap-1">
                        <span>SELECT</span>
                        <kbd className="bg-charcoal border border-tactical-gold/40 px-1 py-0.2 rounded text-[9px]">
                          ↵
                        </kbd>
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2 border-t border-steel/80 bg-charcoal/90 flex items-center justify-between text-[10px] font-mono text-ash select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="bg-graphite border border-steel px-1 rounded text-[9px]">↑</kbd>
              <kbd className="bg-graphite border border-steel px-1 rounded text-[9px]">↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-graphite border border-steel px-1 rounded text-[9px]">↵</kbd>
              <span>Execute</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="bg-graphite border border-steel px-1.5 rounded text-[9px]">ESC</kbd>
            <span>Dismiss</span>
          </span>
        </div>
      </div>
    </div>
  )
}
