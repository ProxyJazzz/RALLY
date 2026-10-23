import React, { useState, useMemo } from 'react'

interface MCPViewProps {
  state: string
  isProcessing: boolean
  onNavigate: (route: string) => void
}

export const MCPView: React.FC<MCPViewProps> = ({ state, isProcessing, onNavigate }) => {
  const isInvestigated = state !== 'IDLE' || isProcessing
  const [selectedToolName, setSelectedToolName] = useState<string>('rollback_deployment')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

  const tools = [
    {
      name: 'get_service_health',
      category: 'READ',
      risk: 'LOW',
      governed: false,
      description: 'Returns health status, active deployment tag, error rates, and resource utilization for a service.',
      schema: '{ service_id: string }',
      exampleResponse: '{\n  "service_id": "checkout-service",\n  "status": "degraded",\n  "active_deployment": "checkout-v42",\n  "error_rate": 18.4\n}',
    },
    {
      name: 'get_error_rate',
      category: 'READ',
      risk: 'LOW',
      governed: false,
      description: 'Queries telemetry aggregation to calculate 5xx error rate against certified health threshold.',
      schema: '{ service_id: string, window_seconds?: number }',
      exampleResponse: '{\n  "service_id": "checkout-service",\n  "error_rate": 0.184,\n  "threshold": 0.01\n}',
    },
    {
      name: 'query_logs',
      category: 'READ',
      risk: 'LOW',
      governed: false,
      description: 'Searches operational log streams for stack traces, unhandled exceptions, and regression signatures.',
      schema: '{ service_id: string, limit?: number, level?: string }',
      exampleResponse: '{\n  "entries": [\n    "ERROR order_validator.py:142 SchemaValidationError: Missing required payment_method"\n  ]\n}',
    },
    {
      name: 'get_recent_deployments',
      category: 'READ',
      risk: 'LOW',
      governed: false,
      description: 'Retrieves chronological deployment releases, git commit SHAs, and canary timestamps.',
      schema: '{ service_id: string, limit?: number }',
      exampleResponse: '{\n  "deployments": ["checkout-v42", "checkout-v41"]\n}',
    },
    {
      name: 'get_deployment_diff',
      category: 'READ',
      risk: 'LOW',
      governed: false,
      description: 'Returns syntactic code and configuration diff between two deployment tags.',
      schema: '{ service_id: string, from_deployment_id: string, to_deployment_id: string }',
      exampleResponse: '{\n  "diff": "+ if not payload.get(\\"payment_method\\"):\\n+   raise SchemaValidationError()"\n}',
    },
    {
      name: 'get_dependency_health',
      category: 'READ',
      risk: 'LOW',
      governed: false,
      description: 'Inspects upstream and downstream service dependencies and circuit-breaker states.',
      schema: '{ service_id: string }',
      exampleResponse: '{\n  "dependencies": {\n    "payment": "healthy",\n    "inventory": "healthy",\n    "auth": "healthy"\n  }\n}',
    },
    {
      name: 'get_runbook',
      category: 'READ',
      risk: 'LOW',
      governed: false,
      description: 'Fetches certified SRE incident remediation procedures and recovery steps.',
      schema: '{ incident_type: string }',
      exampleResponse: '{\n  "runbook": "RB-4821",\n  "recommended_action": "rollback_deployment",\n  "target": "checkout-v41"\n}',
    },
    {
      name: 'rollback_deployment',
      category: 'WRITE',
      risk: 'HIGH',
      governed: true,
      description: 'Executes a controlled rollback to a designated target deployment. Requires human SRE approval signature.',
      schema: '{ service_id: string, target_deployment_id: string, approval_token: string }',
      exampleResponse: '{\n  "action": "rollback_deployment",\n  "target": "checkout-v41",\n  "status": "executed",\n  "verification_required": true\n}',
    },
    {
      name: 'get_incident_context',
      category: 'CONTEXT',
      risk: 'LOW',
      governed: false,
      description: 'Retrieves authoritative multi-turn incident context including state, active deployment, and plan identifiers.',
      schema: '{ incident_id: string }',
      exampleResponse: '{\n  "incident_id": "INC-ALEXA-GOLDEN",\n  "affected_service": "checkout-service",\n  "status": "AWAITING_APPROVAL"\n}',
    },
    {
      name: 'get_investigation_summary',
      category: 'CONTEXT',
      risk: 'LOW',
      governed: false,
      description: 'Returns conversational summary of root cause findings, evidence citations, and recommended remediation.',
      schema: '{ incident_id: string }',
      exampleResponse: '{\n  "incident_id": "INC-ALEXA-GOLDEN",\n  "primary_root_cause": "CHECKOUT_VALIDATION_REGRESSION",\n  "confidence": 0.95\n}',
    },
    {
      name: 'get_action_plan',
      category: 'CONTEXT',
      risk: 'LOW',
      governed: false,
      description: 'Returns the remediation action plan, deterministic risk level, and human approval requirement status.',
      schema: '{ incident_id: string }',
      exampleResponse: '{\n  "plan_id": "plan-INC-ALEXA-GOLDEN",\n  "action": "rollback_deployment",\n  "risk_level": "HIGH",\n  "policy_decision": "REQUIRES_APPROVAL"\n}',
    },
    {
      name: 'get_execution_status',
      category: 'CONTEXT',
      risk: 'LOW',
      governed: false,
      description: 'Returns the current execution state of an action plan, enforcing that unapproved actions remain NOT_EXECUTED.',
      schema: '{ incident_id: string }',
      exampleResponse: '{\n  "incident_id": "INC-ALEXA-GOLDEN",\n  "execution_status": "NOT_EXECUTED",\n  "action_type": "rollback_deployment"\n}',
    },
    {
      name: 'get_verification_status',
      category: 'CONTEXT',
      risk: 'LOW',
      governed: false,
      description: 'Returns the post-remediation independent recovery verification outcome and measured error rate.',
      schema: '{ incident_id: string }',
      exampleResponse: '{\n  "incident_id": "INC-ALEXA-GOLDEN",\n  "verification_status": "PASSED",\n  "recovery_decision": "RESOLVED",\n  "measured_error_rate_pct": 0.70\n}',
    },
  ]

  const invocations = [
    { time: '14:45:51', tool: 'get_error_rate', category: 'READ', status: '200 OK', transport: 'Streamable HTTP' },
    { time: '14:45:52', tool: 'get_recent_deployments', category: 'READ', status: '200 OK', transport: 'Streamable HTTP' },
    { time: '14:45:53', tool: 'get_deployment_diff', category: 'READ', status: '200 OK', transport: 'Streamable HTTP' },
    { time: '14:45:54', tool: 'get_dependency_health', category: 'READ', status: '200 OK', transport: 'Streamable HTTP' },
    { time: '14:45:55', tool: 'query_logs', category: 'READ', status: '200 OK', transport: 'Streamable HTTP' },
    { time: '14:45:56', tool: 'get_runbook', category: 'READ', status: '200 OK', transport: 'Streamable HTTP' },
    { time: '14:46:00', tool: 'rollback_deployment', category: 'WRITE (GOVERNED)', status: '200 OK', transport: 'Streamable HTTP' },
  ]

  const filteredTools = useMemo(() => {
    if (categoryFilter === 'ALL') return tools
    return tools.filter((t) => t.category.includes(categoryFilter))
  }, [categoryFilter])

  const selectedTool = tools.find((t) => t.name === selectedToolName) ?? tools[7]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* ── 1. CINEMATIC EDITORIAL HERO ─────────────────────────────────── */}
      <div className="relative overflow-hidden bg-obsidian border border-steel rounded p-6 sm:p-8 select-none">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-tactical-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-steel/60 pb-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-signal-cyan" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-off-white font-semibold">
              MODEL CONTEXT PROTOCOL (MCP) RUNTIME & REGISTRY
            </span>
            <span className="text-steel">|</span>
            <span className="text-[10px] font-mono text-tactical-gold">
              STREAMABLE HTTP (:8001/mcp)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('/overview')}
              className="px-3.5 py-1.5 rounded bg-charcoal hover:bg-graphite border border-steel text-xs font-mono text-off-white transition-colors"
            >
              ← OVERVIEW COCKPIT
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/evidence')}
              className="px-3.5 py-1.5 rounded bg-charcoal hover:bg-graphite border border-steel text-xs font-mono text-off-white transition-colors"
            >
              FORENSIC EVIDENCE →
            </button>
          </div>
        </div>

        <div className="max-w-3xl">
          <div className="font-editorial italic text-tactical-gold text-base sm:text-lg mb-1">
            "The agent is only as capable as the tools it can safely call."
          </div>
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl tracking-tight text-off-white leading-none uppercase">
            MCP REGISTRY
          </h1>
          <p className="font-sans text-sm sm:text-base text-ash mt-3 leading-relaxed">
            RALLY implements the official Model Context Protocol (MCP) Python SDK over Streamable HTTP transport. Tools are strictly partitioned between read-only observability and governed write mutations.
          </p>
        </div>
      </div>

      {/* ── 2. MCP ARCHITECTURE FLOW DIAGRAM ────────────────────────────── */}
      <div className="bg-obsidian border border-steel rounded p-5 sm:p-6 select-none font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-steel/60 text-[10px] uppercase text-ash tracking-wider">
          <span>MCP THREE-TIER PROTOCOL ARCHITECTURE</span>
          <span className="text-success-green font-bold">● PROTOCOL HANDSHAKE VERIFIED</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Read Tools Branch */}
          <div className="p-4 rounded bg-charcoal border border-steel/70">
            <div className="flex items-center justify-between pb-2 border-b border-steel/60">
              <span className="font-display text-base text-signal-cyan uppercase tracking-wider">
                01 • OBSERVABILITY READ TOOLS
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-signal-cyan/20 text-signal-cyan font-bold">
                UNRESTRICTED
              </span>
            </div>
            <p className="font-sans text-xs text-ash mt-2 leading-relaxed">
              Telemetry polling, sliding error-rate queries, log stream filtering, and deployment diff comparisons.
            </p>
            <div className="mt-3 text-[10px] text-ash">
              7 REGISTERED TOOLS • READ-ONLY
            </div>
          </div>

          {/* Write Tools Branch */}
          <div className="p-4 rounded bg-charcoal border border-tactical-gold/50 shadow-tactical-gold">
            <div className="flex items-center justify-between pb-2 border-b border-steel/60">
              <span className="font-display text-base text-tactical-gold uppercase tracking-wider">
                02 • GOVERNED WRITE TOOLS
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-warning-amber/20 text-warning-amber font-bold animate-pulse">
                BARRIER GATED
              </span>
            </div>
            <p className="font-sans text-xs text-ash mt-2 leading-relaxed">
              Targeted ECS task rollback mutations. Dispatches require validated human SRE governance authorization.
            </p>
            <div className="mt-3 text-[10px] text-tactical-gold">
              MANDATORY HUMAN APPROVAL BARRIER
            </div>
          </div>

          {/* Context Tools Branch */}
          <div className="p-4 rounded bg-charcoal border border-steel/70">
            <div className="flex items-center justify-between pb-2 border-b border-steel/60">
              <span className="font-display text-base text-off-white uppercase tracking-wider">
                03 • CONVERSATIONAL CONTEXT
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-charcoal text-off-white border border-steel font-bold">
                SPEECH / CHAT
              </span>
            </div>
            <p className="font-sans text-xs text-ash mt-2 leading-relaxed">
              Structured narrative summaries, epistemic evidence exports, and verification decisions for Alexa+ chat.
            </p>
            <div className="mt-3 text-[10px] text-ash">
              STATE & RUNBOOK CONTEXT
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. ASYMMETRIC SPLIT: Tool Registry & Interactive Inspector ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Tool Specification Registry */}
        <div className="lg:col-span-7 bg-obsidian border border-steel rounded p-5 sm:p-6 select-none font-sans">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-steel/60 text-[10px] font-mono uppercase text-ash tracking-wider">
            <span>OFFICIAL REGISTERED TOOLS ({tools.length})</span>
            {/* Filter buttons */}
            <div className="flex items-center gap-1">
              {['ALL', 'READ', 'WRITE', 'CONTEXT'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors ${
                    categoryFilter === cat
                      ? 'bg-tactical-gold text-void-black font-bold'
                      : 'bg-charcoal text-ash hover:text-off-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-steel/60 mt-2 font-mono text-xs">
            {filteredTools.map((t) => {
              const isSelected = selectedToolName === t.name
              const isWrite = t.category.includes('WRITE')
              return (
                <div
                  key={t.name}
                  onClick={() => setSelectedToolName(t.name)}
                  className={`py-3.5 px-3 rounded cursor-pointer transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-graphite text-off-white border-l-2 border-tactical-gold pl-3'
                      : 'hover:bg-charcoal/50 text-off-white/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-off-white">{t.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          isWrite
                            ? 'bg-warning-amber/20 text-warning-amber border border-warning-amber/40'
                            : 'bg-signal-cyan/20 text-signal-cyan border border-signal-cyan/40'
                        }`}
                      >
                        {t.category}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-ash mt-1 line-clamp-1">
                      {t.description}
                    </p>
                  </div>

                  <span className="text-[10px] text-ash shrink-0 ml-3">
                    {t.governed ? 'GOVERNED' : 'STANDARD'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Technical Schema & Payload Inspector */}
        <div className="lg:col-span-5 bg-obsidian border border-steel rounded p-5 sm:p-6 select-none flex flex-col justify-between font-mono text-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-steel/60 text-[10px] uppercase text-ash tracking-wider">
              <span>TOOL SCHEMA & CONTRACT INSPECTOR</span>
              <span className="text-tactical-gold font-bold">{selectedTool.name}</span>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-ash block">
                  TOOL IDENTIFIER
                </span>
                <span className="font-display text-2xl text-off-white tracking-wide block mt-0.5">
                  {selectedTool.name}
                </span>
                <span className="text-xs text-ash font-sans block mt-1 leading-snug">
                  {selectedTool.description}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-steel/60">
                <div className="bg-charcoal p-2.5 rounded border border-steel/70">
                  <span className="text-[9px] text-ash uppercase block">CATEGORY</span>
                  <span className="font-bold text-off-white block mt-0.5">{selectedTool.category}</span>
                </div>
                <div className="bg-charcoal p-2.5 rounded border border-steel/70">
                  <span className="text-[9px] text-ash uppercase block">RISK TIER</span>
                  <span
                    className={`font-bold block mt-0.5 ${
                      selectedTool.risk === 'HIGH' ? 'text-warning-amber' : 'text-success-green'
                    }`}
                  >
                    {selectedTool.risk}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[9px] uppercase tracking-widest text-ash block mb-1">
                  INPUT INVOCATION SCHEMA:
                </span>
                <pre className="text-[11px] text-off-white bg-charcoal p-3 rounded border border-steel/80 overflow-x-auto">
                  {selectedTool.schema}
                </pre>
              </div>

              <div>
                <span className="text-[9px] uppercase tracking-widest text-ash block mb-1">
                  SAMPLE MCP RESPONSE PAYLOAD:
                </span>
                <pre className="text-[10px] text-signal-cyan bg-charcoal p-3 rounded border border-steel/80 overflow-x-auto max-h-[140px]">
                  {selectedTool.exampleResponse}
                </pre>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-steel/60 text-[10px] text-ash flex items-center justify-between">
            <span>TRANSPORT: Streamable HTTP POST /mcp</span>
            <span className="text-success-green font-bold">200 OK</span>
          </div>
        </div>
      </div>

      {/* ── 4. REAL-TIME MCP INVOCATION AUDIT STREAM ─────────────────────── */}
      <div className="bg-obsidian border border-steel rounded p-5 sm:p-6 select-none font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-steel/60 text-[10px] uppercase text-ash tracking-wider">
          <span>REAL-TIME MCP INVOCATION TRACE LOG</span>
          <span>{isInvestigated ? '7 INVOCATIONS AUDITED' : 'STANDBY'}</span>
        </div>

        <div className="mt-3 divide-y divide-steel/60">
          {invocations.map((inv, idx) => (
            <div
              key={idx}
              className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-center gap-3">
                <span className="text-ash text-[10px]">{inv.time}</span>
                <span className="text-off-white font-bold">{inv.tool}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-charcoal border border-steel text-ash">
                  {inv.category}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[10px]">
                <span className="text-ash">{inv.transport}</span>
                <span className="text-success-green font-bold">{inv.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
