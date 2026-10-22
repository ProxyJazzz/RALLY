import React from 'react'
import { TimelineStep } from '../api/client'

interface InvestigationTimelineProps {
  timeline: TimelineStep[]
  state: string
}

export const InvestigationTimeline: React.FC<InvestigationTimelineProps> = ({
  timeline,
  state,
}) => {
  return (
    <div className="bg-rally-surface border border-rally-border rounded p-3 flex flex-col h-full min-h-[260px]">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-rally-border text-[10px] font-mono uppercase text-rally-muted tracking-wider">
        <span>INVESTIGATION TIMELINE</span>
        <span className="text-rally-secondary">{timeline.length} EVENTS</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[300px] pr-1">
        {timeline.length === 0 ? (
          <div className="text-rally-muted text-xs font-mono py-8 text-center">
            {state === 'IDLE' ? 'No active investigation. Telemetry monitoring idle.' : 'Awaiting timeline events…'}
          </div>
        ) : (
          timeline.map((step, idx) => {
            const isCompleted = step.status === 'completed'
            const isInProgress = step.status === 'in_progress'

            return (
              <div key={step.step_id || idx} className="flex items-start gap-2 text-xs font-mono">
                <span className="text-rally-muted text-[10px] shrink-0 pt-0.5 min-w-[56px]">
                  {step.timestamp}
                </span>

                <div className="flex items-center gap-1.5 shrink-0 pt-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isCompleted
                        ? 'bg-rally-green'
                        : isInProgress
                        ? 'bg-rally-blue animate-pulse'
                        : 'bg-rally-muted'
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-rally-text font-medium text-xs">
                      {step.title}
                    </span>
                    {step.tool_called && (
                      <span className="px-1.5 py-0.2 rounded-sm text-[9px] bg-rally-bg border border-rally-border text-rally-blue">
                        mcp::{step.tool_called}
                      </span>
                    )}
                  </div>
                  {step.detail && (
                    <p className="text-[11px] text-rally-secondary font-mono mt-0.5 leading-snug">
                      {step.detail}
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
