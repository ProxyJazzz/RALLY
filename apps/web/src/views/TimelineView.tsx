import React from 'react'
import { TimelineStep } from '../api/client'

interface TimelineViewProps {
  timeline: TimelineStep[]
  activeState: string
  onNavigate: (route: string) => void
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  timeline,
  activeState,
  onNavigate,
}) => {
  return (
    <div className="space-y-3 font-mono">
      {/* Workspace Header */}
      <div className="bg-rally-surface border border-rally-border rounded p-3.5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-rally-text uppercase tracking-wider">
              INVESTIGATION CHRONOLOGY & TIMELINE
            </h1>
            <span className="px-2 py-0.2 rounded-sm text-xs bg-rally-cyan/15 text-rally-cyan border border-rally-cyan/30">
              {timeline.length} EVENTS
            </span>
            <span className="px-2 py-0.2 rounded-sm text-xs bg-rally-surface border border-rally-border text-rally-muted">
              STATE: {activeState}
            </span>
          </div>
          <p className="text-xs text-rally-secondary font-sans mt-0.5">
            Real-time chronological trace of fault injection, MCP tool executions, evidence correlation, and governance state.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/evidence')}
            className="px-2.5 py-1 rounded bg-rally-bg border border-rally-border hover:border-rally-blue text-xs text-rally-secondary hover:text-rally-text"
          >
            Evidence Ledger →
          </button>
          <button
            onClick={() => onNavigate('/incident')}
            className="px-2.5 py-1 rounded bg-rally-bg border border-rally-border hover:border-rally-blue text-xs text-rally-secondary hover:text-rally-text"
          >
            Active Incident →
          </button>
        </div>
      </div>

      {timeline.length === 0 ? (
        <div className="bg-rally-surface border border-rally-border rounded p-12 text-center">
          <div className="text-rally-muted text-sm uppercase">NO INVESTIGATION EVENTS</div>
          <p className="text-xs text-rally-secondary font-sans mt-1">
            Investigation has not started. Say or enter 'Investigate the checkout incident' to begin.
          </p>
        </div>
      ) : (
        <div className="bg-rally-surface border border-rally-border rounded p-4">
          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-rally-border">
            {timeline.map((step, idx) => {
              const isCompleted = step.status === 'completed'
              const isInProgress = step.status === 'in_progress'

              return (
                <div key={step.step_id || idx} className="relative group">
                  {/* Node icon on vertical line */}
                  <div
                    className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-rally-surface ${
                      isCompleted
                        ? 'bg-rally-green'
                        : isInProgress
                        ? 'bg-rally-blue animate-pulse'
                        : 'bg-rally-muted'
                    }`}
                  >
                    {isCompleted && <span className="text-[7px] text-black font-bold">✓</span>}
                  </div>

                  {/* Event Content Box */}
                  <div className="bg-rally-bg border border-rally-border rounded p-3 hover:border-rally-border-subtle transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-rally-muted text-[11px]">{step.timestamp}</span>
                        <span className="text-rally-text font-bold text-sm tracking-tight">
                          {step.title}
                        </span>
                      </div>
                      {step.tool_called && (
                        <span className="px-2 py-0.5 rounded-sm text-[10px] bg-rally-surface border border-rally-border text-rally-cyan self-start sm:self-auto font-mono">
                          mcp::{step.tool_called}
                        </span>
                      )}
                    </div>

                    {step.detail && (
                      <p className="text-xs text-rally-secondary font-sans mt-1.5 leading-relaxed pl-1 border-l-2 border-rally-border">
                        {step.detail}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
