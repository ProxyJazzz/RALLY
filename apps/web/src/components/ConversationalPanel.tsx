import React, { useState } from 'react'

interface ConversationalPanelProps {
  messages: Array<{ id: string; sender: 'user' | 'assistant'; text: string; timestamp: string }>
  onSendMessage: (msg: string) => void
  isProcessing: boolean
  state: string
  confidence?: number
}

export const ConversationalPanel: React.FC<ConversationalPanelProps> = ({
  messages,
  onSendMessage,
  isProcessing,
  state,
  confidence = 0,
}) => {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return
    onSendMessage(input.trim())
    setInput('')
  }

  const quickCommands = [
    { label: 'Investigate incident', prompt: 'Investigate the checkout incident.' },
    { label: 'Explain root cause', prompt: 'Explain the root cause and why checkout-v42 is failing.' },
    { label: 'Show evidence', prompt: 'Show the evidence collected from telemetry and deployments.' },
    { label: 'Prepare rollback', prompt: 'Prepare a rollback to checkout-v41.' },
    { label: 'Check service health', prompt: 'Check current checkout-service health and error rate.' },
  ]

  const isInvestigated = state !== 'IDLE'
  const isAwaitingApproval = state === 'AWAITING_APPROVAL'

  return (
    <div className="w-full lg:w-[350px] shrink-0 bg-rally-surface border-l border-rally-border flex flex-col h-full min-h-[500px] select-none">
      {/* 1. Header */}
      <div className="px-3.5 py-2.5 border-b border-rally-border bg-rally-bg-alt flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-wider text-rally-text uppercase">
              RALLY COPILOT
            </span>
            <span className="flex items-center gap-1 text-[10px] font-mono text-rally-green font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-rally-green animate-pulse" />
              AGENT ACTIVE
            </span>
          </div>
          <div className="text-[10px] font-mono text-rally-cyan mt-0.5">
            MCP / STREAMABLE HTTP
          </div>
        </div>
      </div>

      {/* 2. Structured Operational Summary Cards */}
      <div className="p-2.5 border-b border-rally-border bg-rally-bg space-y-2 font-mono text-[11px]">
        {/* Current Objective */}
        <div className="flex items-start justify-between">
          <span className="text-[10px] text-rally-muted uppercase">OBJECTIVE</span>
          <span className="text-rally-text font-medium text-right text-[10px]">
            {state === 'RESOLVED' ? 'Incident Resolved' : 'Investigate checkout regression'}
          </span>
        </div>

        {/* Current Activity */}
        <div className="flex items-start justify-between border-t border-rally-border/60 pt-1.5">
          <span className="text-[10px] text-rally-muted uppercase">ACTIVITY</span>
          <div className="text-right text-[10px] space-y-0.5">
            <div className="flex items-center justify-end gap-1 text-rally-green">
              <span>● Telemetry collected</span>
            </div>
            <div className={`flex items-center justify-end gap-1 ${isInvestigated ? 'text-rally-green' : 'text-rally-muted'}`}>
              <span>{isInvestigated ? '● Deployment correlated' : '○ Deployment correlating'}</span>
            </div>
            <div className={`flex items-center justify-end gap-1 ${isAwaitingApproval || state === 'RESOLVED' ? 'text-rally-green' : 'text-rally-muted'}`}>
              <span>{isAwaitingApproval || state === 'RESOLVED' ? '● Remediation prepared' : '○ Preparing remediation'}</span>
            </div>
          </div>
        </div>

        {/* Finding & Confidence */}
        {isInvestigated && (
          <div className="bg-rally-surface border border-rally-border rounded p-2 text-[10px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-rally-muted uppercase">FINDING</span>
              <span className="text-rally-cyan font-bold">{confidence > 0 ? Math.round(confidence * 100) : 91}% CONF</span>
            </div>
            <div className="text-rally-text font-medium text-[11px]">
              Checkout deployment regression (v42)
            </div>
            <div className="text-rally-secondary text-[10px] pt-1 border-t border-rally-border/60">
              RECOM: Rollback to checkout-v41 • RISK: <span className="text-rally-red font-bold">HIGH</span>
            </div>
            {isAwaitingApproval && (
              <div className="text-rally-amber font-bold text-[10px] pt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rally-amber animate-ping" />
                HUMAN APPROVAL REQUIRED
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Messages Log */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[220px]">
        {messages.map((m) => {
          const isUser = m.sender === 'user'
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1 mb-1 text-[10px] font-mono text-rally-muted">
                <span className={isUser ? 'text-rally-cyan' : 'text-rally-secondary'}>
                  {isUser ? 'OPERATOR' : 'RALLY'}
                </span>
                <span>•</span>
                <span>{m.timestamp}</span>
              </div>
              <div
                className={`max-w-[92%] rounded-sm p-2.5 text-xs ${
                  isUser
                    ? 'bg-rally-cyan/10 text-rally-text border border-rally-cyan/30'
                    : 'bg-rally-bg border border-rally-border text-rally-text font-sans leading-relaxed'
                }`}
              >
                {m.text}
              </div>
            </div>
          )
        })}

        {isProcessing && (
          <div className="flex items-start flex-col">
            <div className="text-[10px] font-mono text-rally-cyan mb-1">
              RALLY • PROCESSING MCP TOOLS
            </div>
            <div className="bg-rally-bg border border-rally-border rounded-sm p-2 text-xs text-rally-cyan flex items-center gap-2 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-rally-cyan animate-ping" />
              <span>Querying telemetry and deployment diffs via MCP...</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Quick Commands */}
      <div className="p-2 border-t border-rally-border bg-rally-bg-alt flex flex-col gap-1">
        <div className="text-[9px] font-mono uppercase text-rally-muted tracking-wider">
          QUICK COMMANDS:
        </div>
        <div className="flex flex-wrap gap-1">
          {quickCommands.map((cmd, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isProcessing}
              onClick={() => onSendMessage(cmd.prompt)}
              className="px-2 py-0.5 rounded-sm bg-rally-surface border border-rally-border hover:border-rally-cyan/40 text-rally-secondary hover:text-rally-text text-[10px] font-mono transition-colors disabled:opacity-40"
            >
              {cmd.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Command Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-2.5 border-t border-rally-border bg-rally-surface flex gap-1.5"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isProcessing}
          placeholder="Ask RALLY..."
          className="flex-1 bg-rally-bg border border-rally-border rounded-sm px-2.5 py-1.5 text-xs text-rally-text placeholder:text-rally-muted focus:outline-none focus:border-rally-cyan font-mono"
        />
        <button
          type="submit"
          disabled={isProcessing || !input.trim()}
          className="px-3 py-1.5 rounded-sm bg-rally-bg-alt border border-rally-border hover:border-rally-cyan/50 text-rally-secondary hover:text-rally-text text-xs font-mono font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isProcessing ? '…' : '↵'}
        </button>
      </form>
    </div>
  )
}
