import React, { useEffect, useState } from 'react'
import {
  apiClient,
  AlexaSimulationState,
  ChatMessageResponse,
} from '../api/client'
import { ConversationalPanel } from './ConversationalPanel'
import { InvestigationTimeline } from './InvestigationTimeline'
import { EvidenceLedgerPanel } from './EvidenceLedgerPanel'
import { GovernanceApprovalPanel } from './GovernanceApprovalPanel'

interface Message {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
}

export const AlexaSimulationWorkspace: React.FC = () => {
  const [state, setState] = useState<AlexaSimulationState | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: "RALLY Alexa+ conversational simulation initialized. Speak or type 'Investigate the checkout incident' to begin.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    },
  ])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchState = async () => {
    const res = await apiClient.getAlexaState()
    if (res.ok) {
      setState(res.data)
    }
  }

  useEffect(() => {
    void fetchState()
  }, [])

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsProcessing(true)
    setError(null)

    const res = await apiClient.sendAlexaChat(text)
    setIsProcessing(false)

    if (res.ok) {
      const data: ChatMessageResponse = res.data
      const asstMsg: Message = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      }
      setMessages((prev) => [...prev, asstMsg])
      setState(data.snapshot)
    } else {
      setError(res.error)
      const errReply: Message = {
        id: `asst-err-${Date.now()}`,
        sender: 'assistant',
        text: `Error processing request via MCP: ${res.error}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      }
      setMessages((prev) => [...prev, errReply])
    }
  }

  const handleApprove = async () => {
    setIsProcessing(true)
    setError(null)
    const res = await apiClient.submitAlexaApproval('APPROVE')
    setIsProcessing(false)

    if (res.ok) {
      setState(res.data)
      const asstMsg: Message = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: res.data.last_assistant_speech ?? 'Rollback authorized and executed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      }
      setMessages((prev) => [...prev, asstMsg])
    } else {
      setError(res.error)
    }
  }

  const handleReject = async () => {
    setIsProcessing(true)
    setError(null)
    const res = await apiClient.submitAlexaApproval('REJECT')
    setIsProcessing(false)

    if (res.ok) {
      setState(res.data)
      const asstMsg: Message = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: res.data.last_assistant_speech ?? 'Rollback plan rejected.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      }
      setMessages((prev) => [...prev, asstMsg])
    } else {
      setError(res.error)
    }
  }

  const handleReset = async () => {
    setIsProcessing(true)
    const res = await apiClient.resetAlexaSimulation()
    setIsProcessing(false)
    if (res.ok) {
      setState(res.data)
      setMessages([
        {
          id: `reset-${Date.now()}`,
          sender: 'assistant',
          text: 'Simulation reset. Fault CHECKOUT_REGRESSION injected into operational world (checkout-v42 active, ~18.4% error rate).',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      ])
    }
  }

  const activeState = state?.state ?? 'IDLE'

  return (
    <div className="flex flex-col gap-6">
      {/* ── Status Banner ────────────────────────────────────────────── */}
      <div className="bg-rally-surface border border-rally-border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded bg-rally-info/10 border border-rally-info/30">
            <span className="text-rally-info font-mono font-bold text-base">A+</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-rally-text text-sm sm:text-base tracking-wide">
                Alexa+ Simulation Workspace
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rally-info/10 text-rally-info border border-rally-info/30 uppercase">
                Simulated Voice Surface
              </span>
            </div>
            <p className="text-xs text-rally-secondary font-sans mt-0.5">
              Backed by real RALLY backend, Agentic Investigation, Streamable HTTP MCP, and Governance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-rally-muted">Active Service:</span>
            <span className="text-xs font-mono font-semibold text-rally-text bg-rally-graphite px-2 py-1 rounded border border-rally-border">
              {state?.service_id ?? 'checkout-service'} ({state?.active_deployment ?? 'checkout-v42'})
            </span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            disabled={isProcessing}
            className="text-xs font-mono text-rally-secondary hover:text-rally-text bg-rally-graphite border border-rally-border px-3 py-1.5 rounded transition-colors"
          >
            Reset Fault
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded bg-rally-critical/10 border border-rally-critical/30 text-xs font-mono text-rally-critical">
          {error}
        </div>
      )}

      {/* ── Workspace 2-Column Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Conversational Voice Panel */}
        <div className="lg:col-span-5 flex flex-col">
          <ConversationalPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
          />
        </div>

        {/* Right Column: Timelines, Governance & Evidence */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Top: Timeline & Governance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InvestigationTimeline
              timeline={state?.timeline ?? []}
              state={activeState}
            />
            <GovernanceApprovalPanel
              plan={state?.action_plan}
              execVerif={state?.execution_verification ?? { execution_status: 'NOT_EXECUTED', verification_status: 'PENDING' }}
              state={activeState}
              onApprove={handleApprove}
              onReject={handleReject}
              isProcessing={isProcessing}
            />
          </div>

          {/* Bottom: Evidence Ledger */}
          <EvidenceLedgerPanel evidence={state?.evidence ?? []} />
        </div>
      </div>
    </div>
  )
}
