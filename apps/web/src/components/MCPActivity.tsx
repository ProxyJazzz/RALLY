import React from 'react'

interface MCPActivityProps {
  state: string
  isProcessing: boolean
}

export const MCPActivity: React.FC<MCPActivityProps> = ({ state, isProcessing }) => {
  const isInvestigated = state !== 'IDLE' || isProcessing

  const calls = [
    { tool: 'get_error_rate', latency: '43ms', status: '200 OK', transport: 'HTTP POST /mcp' },
    { tool: 'get_recent_deployments', latency: '31ms', status: '200 OK', transport: 'HTTP POST /mcp' },
    { tool: 'get_deployment_diff', latency: '52ms', status: '200 OK', transport: 'HTTP POST /mcp' },
    { tool: 'get_dependency_health', latency: '28ms', status: '200 OK', transport: 'HTTP POST /mcp' },
    { tool: 'get_runbook', latency: '19ms', status: '200 OK', transport: 'HTTP POST /mcp' },
  ]

  return (
    <div className="bg-rally-surface border border-rally-border rounded p-3 select-none flex flex-col justify-between font-mono">
      <div className="flex items-center justify-between pb-1.5 border-b border-rally-border text-[10px] uppercase text-rally-muted tracking-wider">
        <span className="flex items-center gap-1.5">
          <span>MCP PROTOCOL LOG • STREAMABLE HTTP</span>
          <span className="w-1.5 h-1.5 rounded-full bg-rally-cyan" />
        </span>
        <span className="text-rally-cyan text-[10px]">
          PORT 8001 / SESSION ACTIVE
        </span>
      </div>

      <div className="space-y-1 py-1.5 text-xs">
        {calls.map((c, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-1.5 rounded-sm bg-rally-bg border border-rally-border hover:border-rally-border-subtle text-[11px]"
          >
            <div className="flex items-center gap-2">
              <span className={isInvestigated ? 'text-rally-green font-bold' : 'text-rally-muted'}>
                ✓
              </span>
              <span className="text-rally-text font-medium">{c.tool}</span>
              <span className="text-[10px] text-rally-muted hidden sm:inline">{c.transport}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-rally-secondary">{isInvestigated ? c.latency : '--'}</span>
              <span className="text-[10px] px-1 py-0.2 rounded-sm bg-rally-surface border border-rally-border text-rally-cyan">
                {isInvestigated ? c.status : 'READY'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
