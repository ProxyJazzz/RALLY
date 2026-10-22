import React from 'react'
import { TimelineStep } from '../api/client'

interface AgentActivityProps {
  timeline: TimelineStep[]
  state: string
  isProcessing: boolean
}

export const AgentActivity: React.FC<AgentActivityProps> = ({
  timeline,
  state,
  isProcessing,
}) => {
  // Activity steps derived from actual state or active timeline
  const activities = [
    { id: 'act-1', name: 'Understanding incident scope', done: state !== 'IDLE' },
    { id: 'act-2', name: 'Connecting to MCP runtime (Streamable HTTP)', done: state !== 'IDLE' },
    { id: 'act-3', name: 'Querying telemetry: mcp::get_error_rate', done: timeline.some(t => t.tool_called?.includes('error_rate')) || state !== 'IDLE' },
    { id: 'act-4', name: 'Querying deployments: mcp::get_recent_deployments', done: timeline.some(t => t.tool_called?.includes('deployments')) || state !== 'IDLE' && state !== 'RECEIVED' },
    { id: 'act-5', name: 'Correlating diff: mcp::get_deployment_diff', done: timeline.some(t => t.tool_called?.includes('diff')) || state === 'REASONING' || state === 'PLANNING' || state === 'AWAITING_APPROVAL' || state === 'RESOLVED' },
    { id: 'act-6', name: 'Verifying dependencies: mcp::get_dependency_health', done: timeline.some(t => t.tool_called?.includes('dependency')) || state === 'AWAITING_APPROVAL' || state === 'RESOLVED' },
    { id: 'act-7', name: 'Synthesizing evidence & ranking hypotheses', done: state === 'PLANNING' || state === 'AWAITING_APPROVAL' || state === 'RESOLVED' },
    { id: 'act-8', name: 'Formulating governed remediation plan', done: state === 'AWAITING_APPROVAL' || state === 'RESOLVED' },
  ]

  return (
    <div className="bg-rally-surface border border-rally-border rounded p-3 select-none flex flex-col justify-between">
      <div className="flex items-center justify-between pb-1.5 border-b border-rally-border text-[10px] font-mono uppercase text-rally-muted tracking-wider">
        <span className="flex items-center gap-1.5">
          <span>RALLY AGENT ACTIVITY STREAM</span>
          {isProcessing && (
            <span className="w-1.5 h-1.5 rounded-full bg-rally-blue animate-ping" />
          )}
        </span>
        <span className="text-rally-blue font-semibold">
          {isProcessing ? 'AGENT EXECUTING MCP' : state === 'IDLE' ? 'STANDBY' : 'INVESTIGATION COMPLETED'}
        </span>
      </div>

      <div className="space-y-1.5 py-1.5 font-mono text-[11px]">
        {activities.map((act) => {
          let dotColor = 'bg-rally-muted'
          let textColor = 'text-rally-muted'

          if (act.done) {
            dotColor = 'bg-rally-green'
            textColor = 'text-rally-text'
          } else if (isProcessing) {
            dotColor = 'bg-rally-blue animate-pulse'
            textColor = 'text-rally-blue'
          }

          return (
            <div key={act.id} className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
              <span className={`truncate ${textColor}`}>
                {act.name}
              </span>
              {act.done && <span className="text-[10px] text-rally-green ml-auto font-bold">✓</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
