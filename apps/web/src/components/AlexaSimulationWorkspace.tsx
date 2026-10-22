import React, { useEffect, useState } from 'react'
import {
  apiClient,
  AlexaSimulationState,
  ChatMessageResponse,
} from '../api/client'
import { IncidentHeader } from './IncidentHeader'
import { IncidentJourney } from './IncidentJourney'
import { ConversationalPanel } from './ConversationalPanel'
import { InvestigationTimeline } from './InvestigationTimeline'
import { EvidenceLedgerPanel } from './EvidenceLedgerPanel'
import { GovernanceApprovalPanel } from './GovernanceApprovalPanel'
import { HypothesisPanel } from './HypothesisPanel'

interface Message {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
}

interface AlexaSimulationWorkspaceProps {
  onIncidentStateChange?: (hasIncident: boolean) => void
}

export const AlexaSimulationWorkspace: React.FC<AlexaSimulationWorkspaceProps> = ({
  onIncidentStateChange,
}) => {
  const [state, setState] = useState<AlexaSimulationState | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: "RALLY Incident Command System online. Telemetry monitoring checkout-service. Enter 'Investigate the checkout incident' or select a quick command below.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    },
  ])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchState = async () => {
    const res = await apiClient.getAlexaState()
    if (res.ok) {
      setState(res.data)
      const hasActive = res.data.state !== 'IDLE' && res.data.state !== 'RESOLVED'
      onIncidentStateChange?.(hasActive)
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
      const hasActive = data.snapshot.state !== 'IDLE' && data.snapshot.state !== 'RESOLVED'
      onIncidentStateChange?.(hasActive)
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
      const hasActive = res.data.state !== 'IDLE' && res.data.state !== 'RESOLVED'
      onIncidentStateChange?.(hasActive)
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
          text: 'Simulation reset. Operational fault CHECKOUT_REGRESSION primed in simulator (checkout-v42 active, ~18.4% error rate).',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      ])
      onIncidentStateChange?.(false)
    }
  }

  const handleStartInvestigation = () => {
    void handleSendMessage('Investigate the checkout incident.')
  }

  const activeState = state?.state ?? 'IDLE'
  const isIdle = activeState === 'IDLE'

  // Numerical error rate from verification or standard incident value
  const numericErrorRate =
    state?.execution_verification?.verification_status === 'PASSED'
      ? (state.execution_verification.verified_error_rate ?? 0.7)
      : isIdle
      ? null
      : 18.4

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Main Incident Header */}
      <IncidentHeader
        state={activeState}
        serviceId={state?.service_id ?? 'checkout-service'}
        activeDeployment={state?.active_deployment ?? 'checkout-v42'}
        errorRate={numericErrorRate}
        onInvestigate={handleStartInvestigation}
        onReset={handleReset}
        isProcessing={isProcessing}
      />

      {/* 2. Visual Incident Journey: Understand -> Investigate -> Reason -> Plan -> Approve -> Execute -> Verify -> Resolve */}
      <IncidentJourney state={activeState} />

      {error && (
        <div className="p-3 rounded bg-rally-critical/10 border border-rally-critical/30 text-xs font-mono text-rally-critical">
          {error}
        </div>
      )}

      {/* 3. Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Copilot Operations Console */}
        <div className="lg:col-span-5 flex flex-col">
          <ConversationalPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
            state={activeState}
            confidence={state?.confidence}
          />
        </div>

        {/* Right Column: Evidence, Hypotheses, Timeline, Change Control */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Top row: Hypotheses & Change Control */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HypothesisPanel
              primaryHypothesis={state?.primary_hypothesis}
              confidence={state?.confidence}
              state={activeState}
            />

            <GovernanceApprovalPanel
              plan={state?.action_plan}
              execVerif={
                state?.execution_verification ?? {
                  execution_status: 'NOT_EXECUTED',
                  verification_status: 'PENDING',
                }
              }
              state={activeState}
              onApprove={handleApprove}
              onReject={handleReject}
              isProcessing={isProcessing}
            />
          </div>

          {/* Operational Timeline */}
          <InvestigationTimeline
            timeline={state?.timeline ?? []}
            state={activeState}
          />

          {/* Evidence Ledger */}
          <EvidenceLedgerPanel evidence={state?.evidence ?? []} />
        </div>
      </div>
    </div>
  )
}
