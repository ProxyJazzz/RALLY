import React, { useState } from 'react'

interface ConversationalPanelProps {
  messages: Array<{ id: string; sender: 'user' | 'assistant'; text: string; timestamp: string }>
  onSendMessage: (msg: string) => void
  isProcessing: boolean
  state: string
  confidence?: number
  isOpen?: boolean
  onClose?: () => void
}

export const ConversationalPanel: React.FC<ConversationalPanelProps> = ({
  messages,
  onSendMessage,
  isProcessing,
  state,
  confidence = 0,
  isOpen = false,
  onClose,
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

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-label="RALLY Autonomous Copilot"
      className="fixed bottom-10 right-4 sm:right-6 w-full max-w-[400px] h-[560px] max-h-[85vh] bg-obsidian border border-steel rounded shadow-2xl z-40 flex flex-col overflow-hidden font-sans animate-in fade-in slide-in-from-bottom-4 duration-200"
      style={{
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(200, 155, 60, 0.2)',
      }}
    >
      {/* 1. Header */}
      <div className="px-4 py-3 border-b border-steel bg-charcoal flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-tactical-gold font-mono text-xs">✦</span>
          <span className="font-display text-base tracking-wider text-off-white uppercase">
            RALLY COPILOT
          </span>
          <span className="flex items-center gap-1 text-[9px] font-mono text-success-green font-semibold bg-obsidian px-1.5 py-0.5 rounded border border-steel">
            <span className="w-1.5 h-1.5 rounded-full bg-success-green animate-pulse" />
            READY
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Copilot"
            className="text-ash hover:text-off-white p-1 rounded hover:bg-graphite text-xs font-mono transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* 2. Structured Operational Status Mini-Card */}
      <div className="p-3 border-b border-steel/80 bg-graphite/40 space-y-1.5 font-mono text-[10px] shrink-0">
        <div className="flex items-start justify-between">
          <span className="text-ash uppercase">OBJECTIVE:</span>
          <span className="text-off-white font-medium text-right">
            {state === 'RESOLVED' ? 'Incident Resolved' : 'Investigate checkout regression'}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-steel/40">
          <span className="text-ash uppercase">RUNTIME:</span>
          <span className="text-signal-cyan font-bold">MCP / STREAMABLE HTTP</span>
        </div>

        {isInvestigated && (
          <div className="flex items-center justify-between pt-1 border-t border-steel/40">
            <span className="text-ash uppercase">CONFIDENCE:</span>
            <span className="text-tactical-gold font-bold">
              {confidence > 0 ? Math.round(confidence * 100) : 95}% DEDUCTION
            </span>
          </div>
        )}
      </div>

      {/* 3. Messages Log */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 min-h-0 bg-obsidian">
        {messages.map((m) => {
          const isUser = m.sender === 'user'
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1 mb-1 text-[9px] font-mono text-ash">
                <span className={isUser ? 'text-signal-cyan font-semibold' : 'text-tactical-gold font-semibold'}>
                  {isUser ? 'OPERATOR' : 'RALLY'}
                </span>
                <span>•</span>
                <span>{m.timestamp}</span>
              </div>
              <div
                className={`max-w-[90%] rounded p-2.5 text-xs ${
                  isUser
                    ? 'bg-graphite text-off-white border border-steel'
                    : 'bg-charcoal border border-steel/80 text-off-white/90 font-sans leading-relaxed'
                }`}
              >
                {m.text}
              </div>
            </div>
          )
        })}

        {isProcessing && (
          <div className="flex items-start flex-col">
            <div className="text-[9px] font-mono text-tactical-gold mb-1">
              RALLY • PROCESSING MCP TOOLS
            </div>
            <div className="bg-charcoal border border-steel rounded p-2 text-xs text-tactical-gold flex items-center gap-2 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-tactical-gold animate-ping" />
              <span>Querying telemetry and deployment diffs via MCP...</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Quick Commands */}
      <div className="p-2 border-t border-steel/80 bg-charcoal/80 flex flex-col gap-1 shrink-0">
        <div className="text-[9px] font-mono uppercase text-ash tracking-wider">
          QUICK COMMANDS:
        </div>
        <div className="flex flex-wrap gap-1">
          {quickCommands.slice(0, 3).map((cmd, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isProcessing}
              onClick={() => onSendMessage(cmd.prompt)}
              className="px-2 py-0.5 rounded bg-graphite border border-steel/80 hover:border-tactical-gold/60 text-off-white/80 hover:text-off-white text-[9px] font-mono transition-colors disabled:opacity-40"
            >
              {cmd.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Command Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-2.5 border-t border-steel bg-charcoal flex gap-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isProcessing}
          placeholder="Ask RALLY or execute tool..."
          className="flex-1 bg-obsidian border border-steel rounded px-3 py-1.5 text-xs text-off-white placeholder:text-ash focus:outline-none focus:border-tactical-gold font-sans"
        />
        <button
          type="submit"
          disabled={isProcessing || !input.trim()}
          className="px-3.5 py-1.5 rounded bg-graphite border border-steel hover:border-tactical-gold text-tactical-gold text-xs font-mono font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isProcessing ? '…' : '↵'}
        </button>
      </form>
    </div>
  )
}
