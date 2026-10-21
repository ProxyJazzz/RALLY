import React from 'react'
import { TimelineStep } from '../api/client'

interface InvestigationTimelineProps {
  timeline: TimelineStep[]
  state: string
}

export const InvestigationTimeline: React.FC<InvestigationTimelineProps> = ({ timeline, state }) => {
  return (
    <div className="bg-rally-surface border border-rally-border rounded-lg p-4 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-rally-border mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rally-info" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-rally-text">
            Investigation & Execution Timeline
          </span>
        </div>
        <span className="text-xs font-mono text-rally-info bg-rally-info/10 px-2 py-0.5 rounded border border-rally-info/20">
          STATE: {state}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[360px]">
        {timeline.length === 0 ? (
          <div className="text-xs font-mono text-rally-muted py-6 text-center">
            No active investigation. Trigger an investigation to observe real-time operational telemetry.
          </div>
        ) : (
          timeline.map((step) => (
            <div key={step.step_id} className="flex items-start gap-3 text-xs font-mono">
              <div className="mt-0.5">
                {step.status === 'completed' && (
                  <span className="w-4 h-4 rounded-full bg-rally-healthy/15 text-rally-healthy border border-rally-healthy/30 flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                )}
                {step.status === 'in_progress' && (
                  <span className="w-4 h-4 rounded-full bg-rally-info/15 text-rally-info border border-rally-info/30 flex items-center justify-center text-[10px] animate-pulse">
                    ●
                  </span>
                )}
                {step.status === 'failed' && (
                  <span className="w-4 h-4 rounded-full bg-rally-critical/15 text-rally-critical border border-rally-critical/30 flex items-center justify-center text-[10px]">
                    ✕
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-rally-text font-medium truncate">{step.title}</span>
                  <span className="text-[10px] text-rally-muted">{step.timestamp}</span>
                </div>
                {step.tool_called && (
                  <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded bg-rally-graphite text-rally-info border border-rally-border">
                    tool: {step.tool_called}
                  </span>
                )}
                {step.detail && (
                  <p className="mt-1 text-[11px] text-rally-secondary leading-relaxed font-sans">
                    {step.detail}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
