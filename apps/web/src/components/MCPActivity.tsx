import React from 'react'

interface MCPActivityProps {
  state: string
  isProcessing: boolean
}

export const MCPActivity: React.FC<MCPActivityProps> = ({ state, isProcessing }) => {
  const isInvestigated = state !== 'IDLE' || isProcessing

  const calls = [
    { tool: 'get_error_rate', latency: '43ms', status: '200 OK', transport: 'Streamable HTTP' },
    { tool: 'get_recent_deployments', latency: '31ms', status: '200 OK', transport: 'Streamable HTTP' },
    { tool: 'get_deployment_diff', latency: '52ms', status: '200 OK', transport: 'Streamable HTTP' },
    { tool: 'get_dependency_health', latency: '28ms', status: '200 OK', transport: 'Streamable HTTP' },
    { tool: 'get_runbook', latency: '19ms', status: '200 OK', transport: 'Streamable HTTP' },
  ]

  return (
    <div className="bg-obsidian border border-steel rounded p-4 sm:p-5 select-none flex flex-col justify-between font-mono">
      <div className="flex items-center justify-between pb-3 border-b border-steel/60 text-[10px] uppercase text-ash tracking-wider">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-signal-cyan animate-pulse" />
          <span className="text-off-white font-medium">MCP PROTOCOL LOG • STREAMABLE HTTP</span>
        </span>
        <span className="text-signal-cyan text-[10px]">
          PORT 8001 / SESSION ACTIVE
        </span>
      </div>

      <div className="space-y-1.5 py-3 text-xs">
        {calls.map((c, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2 rounded bg-charcoal border border-steel/70 hover:border-tactical-gold/30 transition-colors text-[11px]"
          >
            <div className="flex items-center gap-2.5">
              <span className={isInvestigated ? 'text-success-green font-bold' : 'text-ash'}>
                {isInvestigated ? '✓' : '○'}
              </span>
              <span className="text-off-white font-medium">{c.tool}</span>
              <span className="text-[10px] text-ash hidden sm:inline">{c.transport}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-ash">{isInvestigated ? c.latency : '--'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-graphite border border-steel text-signal-cyan font-bold">
                {isInvestigated ? c.status : 'STANDBY'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-steel/60 text-[9px] text-ash uppercase flex items-center justify-between">
        <span>PROTOCOL: Python MCP SDK 1.2.0</span>
        <span className="text-success-green font-bold">SSE STREAM ACTIVE</span>
      </div>
    </div>
  )
}
