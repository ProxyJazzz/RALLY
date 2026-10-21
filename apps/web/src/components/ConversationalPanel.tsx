import React, { useState } from 'react'

interface ConversationalPanelProps {
  messages: Array<{ id: string; sender: 'user' | 'assistant'; text: string; timestamp: string }>
  onSendMessage: (msg: string) => void
  isProcessing: boolean
}

export const ConversationalPanel: React.FC<ConversationalPanelProps> = ({
  messages,
  onSendMessage,
  isProcessing,
}) => {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return
    onSendMessage(input.trim())
    setInput('')
  }

  const promptSuggestions = [
    'Investigate the checkout incident.',
    'What did you find?',
    'Why do you think the deployment caused it?',
    'Should we roll it back?',
    'Is the service healthy now?',
  ]

  return (
    <div className="flex flex-col h-full bg-rally-surface border border-rally-border rounded-lg overflow-hidden">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-rally-border bg-rally-graphite flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rally-info pulse-dot" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-rally-text">
            Alexa+ Conversational Interface (Simulated)
          </span>
        </div>
        <span className="text-[10px] font-mono text-rally-muted border border-rally-border px-2 py-0.5 rounded">
          MCP Streamable HTTP
        </span>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[320px] max-h-[460px]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono text-rally-muted">
              <span>{m.sender === 'user' ? 'You (Operator)' : 'RALLY Assistant'}</span>
              <span>•</span>
              <span>{m.timestamp}</span>
            </div>
            <div
              className={`max-w-[88%] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-rally-info/15 text-rally-text border border-rally-info/30'
                  : 'bg-rally-graphite text-rally-secondary border border-rally-border'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex items-start flex-col">
            <span className="text-[11px] font-mono text-rally-muted mb-1">RALLY Assistant • Thinking</span>
            <div className="bg-rally-graphite border border-rally-border rounded-lg px-3.5 py-2.5 text-xs text-rally-info flex items-center gap-2 font-mono">
              <span className="inline-block w-2 h-2 rounded-full bg-rally-info animate-ping" />
              Investigating via Model Context Protocol...
            </div>
          </div>
        )}
      </div>

      {/* Suggested prompts */}
      <div className="px-4 py-2 border-t border-rally-border/60 bg-rally-graphite/40 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <span className="text-rally-muted font-mono whitespace-nowrap mr-1">Suggestions:</span>
        {promptSuggestions.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isProcessing}
            onClick={() => onSendMessage(prompt)}
            className="whitespace-nowrap px-2.5 py-1 rounded bg-rally-graphite border border-rally-border hover:border-rally-info/40 text-rally-secondary hover:text-rally-text transition-colors disabled:opacity-40"
          >
            "{prompt}"
          </button>
        ))}
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-rally-border bg-rally-graphite flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isProcessing}
          placeholder="Speak or type a command (e.g. 'Investigate the checkout incident')..."
          className="flex-1 bg-rally-charcoal border border-rally-border rounded px-3 py-2 text-xs text-rally-text placeholder:text-rally-muted focus:outline-none focus:border-rally-info font-sans"
        />
        <button
          type="submit"
          disabled={isProcessing || !input.trim()}
          className="px-4 py-2 rounded bg-rally-info/20 text-rally-info border border-rally-info/30 hover:bg-rally-info/30 text-xs font-mono font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Thinking…' : 'Send'}
        </button>
      </form>
    </div>
  )
}
