import React from 'react'

interface MCPViewProps {
  state: string
  isProcessing: boolean
  onNavigate: (route: string) => void
}

export const MCPView: React.FC<MCPViewProps> = ({ state, isProcessing, onNavigate }) => {
  const isInvestigated = state !== 'IDLE' || isProcessing

  const tools = [
    {
      name: 'get_service_health',
      category: 'READ',
      description: 'Returns health status, active deployment, error rates, and resource utilization for a service.',
      schema: '{ service_id: string }',
    },
    {
      name: 'get_error_rate',
      category: 'READ',
      description: 'Returns current 5xx error rate and threshold comparison for a service.',
      schema: '{ service_id: string, window_seconds?: number }',
    },
    {
      name: 'query_logs',
      category: 'READ',
      description: 'Queries recent operational log streams for stack traces and regression tags.',
      schema: '{ service_id: string, limit?: number, level?: string }',
    },
    {
      name: 'get_recent_deployments',
      category: 'READ',
      description: 'Lists chronological deployments with release timestamps and git commits.',
      schema: '{ service_id: string, limit?: number }',
    },
    {
      name: 'get_deployment_diff',
      category: 'READ',
      description: 'Returns syntactic code and config diff between two deployment tags.',
      schema: '{ service_id: string, from_deployment_id: string, to_deployment_id: string }',
    },
    {
      name: 'get_dependency_health',
      category: 'READ',
      description: 'Inspects upstream and downstream service dependencies and circuit-breaker states.',
      schema: '{ service_id: string }',
    },
    {
      name: 'get_runbook',
      category: 'READ',
      description: 'Fetches certified SRE incident remediation procedures and recovery steps.',
      schema: '{ incident_type: string }',
    },
    {
      name: 'rollback_deployment',
      category: 'WRITE (GOVERNED)',
      description: 'Executes a controlled rollback to a designated target deployment. Requires approval signature.',
      schema: '{ service_id: string, target_deployment_id: string, approval_token: string }',
    },
    {
      name: 'get_incident_context',
      category: 'CONVERSATIONAL',
      description: 'Retrieves active incident identifier, state, timeline, and current reasoning context.',
      schema: '{ incident_id: string }',
    },
    {
      name: 'get_investigation_summary',
      category: 'CONVERSATIONAL',
      description: 'Returns structured narrative of investigation findings for voice/chat synthesis.',
      schema: '{ incident_id: string }',
    },
    {
      name: 'get_evidence_ledger',
      category: 'CONVERSATIONAL',
      description: 'Exports collected evidence ledger items categorized by epistemic classification.',
      schema: '{ incident_id: string }',
    },
    {
      name: 'get_action_plan',
      category: 'CONVERSATIONAL',
      description: 'Returns current remediation plan, risk score, and human approval requirements.',
      schema: '{ incident_id: string }',
    },
    {
      name: 'get_verification_result',
      category: 'CONVERSATIONAL',
      description: 'Returns independent verification outcome and recovery decision.',
      schema: '{ incident_id: string }',
    },
  ]

  const invocations = [
    { tool: 'get_error_rate', status: '200 OK', transport: 'HTTP POST /mcp', args: '{"service_id": "checkout-service"}' },
    { tool: 'get_recent_deployments', status: '200 OK', transport: 'HTTP POST /mcp', args: '{"service_id": "checkout-service", "limit": 5}' },
    { tool: 'get_deployment_diff', status: '200 OK', transport: 'HTTP POST /mcp', args: '{"service_id": "checkout-service", "from_deployment_id": "checkout-v41", "to_deployment_id": "checkout-v42"}' },
    { tool: 'get_dependency_health', status: '200 OK', transport: 'HTTP POST /mcp', args: '{"service_id": "checkout-service"}' },
    { tool: 'query_logs', status: '200 OK', transport: 'HTTP POST /mcp', args: '{"service_id": "checkout-service", "limit": 10}' },
    { tool: 'get_runbook', status: '200 OK', transport: 'HTTP POST /mcp', args: '{"incident_type": "CHECKOUT_REGRESSION"}' },
  ]

  return (
    <div className="space-y-3 font-mono">
      {/* Workspace Header */}
      <div className="bg-rally-surface border border-rally-border rounded p-3.5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-rally-text uppercase tracking-wider">
              MODEL CONTEXT PROTOCOL (MCP) RUNTIME & REGISTRY
            </h1>
            <span className="px-2 py-0.2 rounded-sm text-xs bg-rally-cyan/15 text-rally-cyan border border-rally-cyan/30 font-bold">
              13 TOOLS REGISTERED
            </span>
          </div>
          <p className="text-xs text-rally-secondary font-sans mt-0.5">
            Official Python MCP SDK implementation over Streamable HTTP transport (<span className="font-mono text-rally-text">http://127.0.0.1:8001/mcp</span>).
          </p>
        </div>

        <button
          onClick={() => onNavigate('/overview')}
          className="px-2.5 py-1 rounded bg-rally-bg border border-rally-border hover:border-rally-blue text-xs text-rally-secondary hover:text-rally-text"
        >
          Command Overview →
        </button>
      </div>

      {/* Connection & Protocol Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-rally-surface border border-rally-border rounded p-3">
          <span className="text-[10px] text-rally-muted uppercase block">TRANSPORT</span>
          <span className="text-rally-cyan font-bold text-sm mt-0.5 block">STREAMABLE HTTP</span>
          <span className="text-[10px] text-rally-muted">SSE / Streaming POST</span>
        </div>

        <div className="bg-rally-surface border border-rally-border rounded p-3">
          <span className="text-[10px] text-rally-muted uppercase block">MCP ENDPOINT</span>
          <span className="text-rally-text font-bold text-sm mt-0.5 block truncate">PORT 8001 /mcp</span>
          <span className="text-[10px] text-rally-muted">Local & Tunnel Verified</span>
        </div>

        <div className="bg-rally-surface border border-rally-border rounded p-3">
          <span className="text-[10px] text-rally-muted uppercase block">PROTOCOL STATE</span>
          <span className="text-rally-green font-bold text-sm mt-0.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rally-green" />
            CONNECTED
          </span>
          <span className="text-[10px] text-rally-muted">Session handshake OK</span>
        </div>

        <div className="bg-rally-surface border border-rally-border rounded p-3">
          <span className="text-[10px] text-rally-muted uppercase block">WRITE PROTECTION</span>
          <span className="text-rally-amber font-bold text-sm mt-0.5 block">GOVERNED</span>
          <span className="text-[10px] text-rally-muted">Human gate mandatory</span>
        </div>
      </div>

      {/* Recent Invocations Log */}
      <div className="bg-rally-surface border border-rally-border rounded p-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-rally-border text-[10px] text-rally-muted uppercase">
          <span>REAL-TIME MCP INVOCATION TRACE</span>
          <span>{isInvestigated ? '6 INVOCATIONS LOGGED' : 'AWAITING INVOCATIONS'}</span>
        </div>

        <div className="space-y-1.5 mt-2">
          {invocations.map((inv, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded bg-rally-bg border border-rally-border text-xs"
            >
              <div className="flex items-center gap-2">
                <span className={isInvestigated ? 'text-rally-green font-bold' : 'text-rally-muted'}>
                  {isInvestigated ? '✓' : '○'}
                </span>
                <span className="text-rally-text font-bold">{inv.tool}</span>
                <span className="text-[10px] text-rally-muted hidden md:inline">{inv.args}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-rally-secondary">{inv.transport}</span>
                <span className="px-1.5 py-0.2 rounded bg-rally-surface border border-rally-border text-rally-cyan font-bold">
                  {isInvestigated ? inv.status : 'STANDBY'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Tools Registry (13 Tools) */}
      <div className="bg-rally-surface border border-rally-border rounded p-3.5">
        <div className="text-[10px] text-rally-muted uppercase pb-2 border-b border-rally-border">
          OFFICIAL REGISTERED TOOLS SPECIFICATION (13 TOOLS)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3">
          {tools.map((t) => {
            const isWrite = t.category.includes('WRITE')
            const isConv = t.category.includes('CONVERSATIONAL')
            return (
              <div key={t.name} className="p-2.5 rounded bg-rally-bg border border-rally-border text-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-rally-text font-bold text-xs">{t.name}</span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                        isWrite
                          ? 'bg-rally-amber/20 text-rally-amber border border-rally-amber/40'
                          : isConv
                          ? 'bg-rally-green/15 text-rally-green border border-rally-green/30'
                          : 'bg-rally-cyan/15 text-rally-cyan border border-rally-cyan/30'
                      }`}
                    >
                      {t.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-rally-secondary font-sans mt-1.5 leading-snug">
                    {t.description}
                  </p>
                </div>
                <div className="mt-2 pt-1 border-t border-rally-border/60 text-[9px] text-rally-muted truncate font-mono">
                  Schema: {t.schema}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
