import { useState, useEffect, useCallback } from 'react'
import { useHealth } from './hooks/useHealth'
import { GlobalHeader } from './components/GlobalHeader'
import { NavigationRail, SidebarBadges } from './components/NavigationRail'
import { SystemStatusBar } from './components/SystemStatusBar'
import { ConversationalPanel } from './components/ConversationalPanel'
import { OverviewView } from './views/OverviewView'
import { IncidentView } from './views/IncidentView'
import { EvidenceView } from './views/EvidenceView'
import { TimelineView } from './views/TimelineView'
import { HypothesesView } from './views/HypothesesView'
import { ActionPlanView } from './views/ActionPlanView'
import { ApprovalView } from './views/ApprovalView'
import { ExecutionView } from './views/ExecutionView'
import { ServicesView } from './views/ServicesView'
import { MCPView } from './views/MCPView'
import { DatabaseView } from './views/DatabaseView'
import {
  apiClient,
  AlexaSimulationState,
  ChatMessageResponse,
} from './api/client'

interface Message {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
}

function App() {
  // ── 1. ROUTING & BROWSER HISTORY ──────────────────────────────────────
  const getInitialPath = (): string => {
    const path = window.location.pathname
    const validPaths = [
      '/overview',
      '/incident',
      '/evidence',
      '/timeline',
      '/hypotheses',
      '/action-plan',
      '/approval',
      '/execution',
      '/services',
      '/mcp',
      '/database',
    ]
    return validPaths.includes(path) ? path : '/overview'
  }

  const [currentPath, setCurrentPath] = useState<string>(getInitialPath)

  const handleNavigate = useCallback((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path)
    }
    setCurrentPath(path)
  }, [])

  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname
      setCurrentPath(path === '/' ? '/overview' : path)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // ── 2. AUTHORITATIVE RALLY STATE ──────────────────────────────────────
  const [state, setState] = useState<AlexaSimulationState | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: "RALLY Operations Cockpit initialized. Incident 4821 telemetry active on checkout-service. Enter 'Investigate incident' to begin autonomous root-cause deduction.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    },
  ])
  const [isProcessing, setIsProcessing] = useState(false)
  const [apiError, setApiErrorState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const {
    apiStatus,
    dbStatus,
    api,
    database,
    apiError: healthApiError,
    dbError,
    lastChecked,
    refresh,
  } = useHealth(15000)

  // Fetch initial simulator snapshot
  const fetchState = useCallback(async () => {
    setIsLoading(true)
    const res = await apiClient.getAlexaState()
    setIsLoading(false)
    if (res.ok) {
      setState(res.data)
      setApiErrorState(null)
    } else {
      setApiErrorState(res.error)
    }
  }, [])

  useEffect(() => {
    void fetchState()
  }, [fetchState])

  // Chat message sender
  const handleSendMessage = async (text: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsProcessing(true)
    setApiErrorState(null)

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
      setApiErrorState(res.error)
      const errReply: Message = {
        id: `asst-err-${Date.now()}`,
        sender: 'assistant',
        text: `Error executing via MCP: ${res.error}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      }
      setMessages((prev) => [...prev, errReply])
    }
  }

  // Governance Approval handler
  const handleApprove = async () => {
    setIsProcessing(true)
    setApiErrorState(null)
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
      setApiErrorState(res.error)
    }
  }

  // Governance Rejection handler
  const handleReject = async () => {
    setIsProcessing(true)
    setApiErrorState(null)
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
      setApiErrorState(res.error)
    }
  }

  // Simulation reset handler
  const handleReset = async () => {
    setIsProcessing(true)
    setApiErrorState(null)
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
    } else {
      setApiErrorState(res.error)
    }
  }

  const activeState = state?.state ?? 'IDLE'
  const isIdle = activeState === 'IDLE'
  const isResolved =
    activeState === 'RESOLVED' ||
    state?.execution_verification?.verification_status === 'PASSED'
  const hasActiveIncident = !isIdle && !isResolved
  const hasApprovalRequired = activeState === 'AWAITING_APPROVAL'

  const numericErrorRate = isResolved ? 0.7 : 18.4

  // Dynamic sidebar badges calculated from actual state
  const badges: SidebarBadges = {
    incident: isResolved ? 'RESOLVED' : isIdle ? '—' : 'SEV-2',
    incidentColor: isResolved ? 'green' : isIdle ? 'gray' : 'red',
    evidenceCount: state?.evidence?.length ?? 0,
    timelineCount: state?.timeline?.length ?? 0,
    approval: hasApprovalRequired ? 'REQUIRED' : isResolved ? 'APPROVED' : undefined,
    approvalColor: hasApprovalRequired ? 'amber' : 'green',
    execution: isResolved ? 'VERIFIED' : state?.execution_verification?.execution_status === 'EXECUTED' ? 'EXECUTED' : undefined,
    executionColor: isResolved ? 'green' : 'blue',
    services: isResolved ? 'HEALTHY' : '1 DEGRADED',
    servicesColor: isResolved ? 'green' : 'red',
    mcp: 'CONNECTED',
  }

  // Render active workspace view
  const renderWorkspaceView = () => {
    if (isLoading && !state) {
      return (
        <div className="bg-rally-surface border border-rally-border rounded p-12 text-center font-mono">
          <div className="text-rally-cyan text-sm uppercase animate-pulse">
            LOADING INCIDENT STATE FROM RALLY BACKEND...
          </div>
          <p className="text-xs text-rally-secondary mt-1">
            Connecting to Streamable HTTP MCP server and PostgreSQL state storage.
          </p>
        </div>
      )
    }

    if (apiError && !state) {
      return (
        <div className="bg-rally-surface border border-rally-red/40 rounded p-12 text-center font-mono space-y-3">
          <div className="text-rally-red text-sm font-bold uppercase">
            RALLY BACKEND UNAVAILABLE ({apiError})
          </div>
          <p className="text-xs text-rally-secondary font-sans">
            Unable to connect to FastAPI endpoint at http://localhost:8000. Please verify the API server process is running.
          </p>
          <button
            onClick={() => void fetchState()}
            className="px-4 py-2 rounded bg-rally-bg border border-rally-border hover:border-rally-cyan text-xs text-rally-cyan font-bold"
          >
            RETRY CONNECTION
          </button>
        </div>
      )
    }

    switch (currentPath) {
      case '/incident':
        return (
          <IncidentView
            state={state}
            activeState={activeState}
            isProcessing={isProcessing}
            numericErrorRate={numericErrorRate}
            isResolved={isResolved}
            onInvestigate={() => void handleSendMessage('Investigate the checkout incident.')}
            onReset={handleReset}
            onNavigate={handleNavigate}
          />
        )

      case '/evidence':
        return (
          <EvidenceView
            evidence={state?.evidence ?? []}
            onNavigate={handleNavigate}
          />
        )

      case '/timeline':
        return (
          <TimelineView
            timeline={state?.timeline ?? []}
            activeState={activeState}
            onNavigate={handleNavigate}
          />
        )

      case '/hypotheses':
        return (
          <HypothesesView
            primaryHypothesis={state?.primary_hypothesis}
            confidence={state?.confidence}
            state={activeState}
            onNavigate={handleNavigate}
          />
        )

      case '/action-plan':
        return (
          <ActionPlanView
            plan={state?.action_plan}
            state={activeState}
            onNavigate={handleNavigate}
          />
        )

      case '/approval':
        return (
          <ApprovalView
            plan={state?.action_plan}
            state={activeState}
            isProcessing={isProcessing}
            onApprove={handleApprove}
            onReject={handleReject}
            onNavigate={handleNavigate}
          />
        )

      case '/execution':
        return (
          <ExecutionView
            plan={state?.action_plan}
            execVerif={
              state?.execution_verification ?? {
                execution_status: 'NOT_EXECUTED',
                verification_status: 'PENDING',
              }
            }
            state={activeState}
            onNavigate={handleNavigate}
          />
        )

      case '/services':
        return (
          <ServicesView
            activeDeployment={state?.active_deployment ?? 'checkout-v42'}
            isRecovered={isResolved}
            errorRate={numericErrorRate}
            onNavigate={handleNavigate}
          />
        )

      case '/mcp':
        return (
          <MCPView
            state={activeState}
            isProcessing={isProcessing}
            onNavigate={handleNavigate}
          />
        )

      case '/database':
        return (
          <DatabaseView
            apiStatus={apiStatus}
            dbStatus={dbStatus}
            api={api}
            database={database}
            apiError={healthApiError}
            dbError={dbError}
            lastChecked={lastChecked}
            refresh={refresh}
            onNavigate={handleNavigate}
          />
        )

      case '/overview':
      default:
        return (
          <OverviewView
            state={state}
            activeState={activeState}
            isProcessing={isProcessing}
            numericErrorRate={numericErrorRate}
            isResolved={isResolved}
            onInvestigate={() => void handleSendMessage('Investigate the checkout incident.')}
            onReset={handleReset}
            onApprove={handleApprove}
            onReject={handleReject}
            onNavigate={handleNavigate}
          />
        )
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-rally-bg text-rally-text flex flex-col font-sans bg-command-grid">
      {/* ── 1. GLOBAL HEADER ────────────────────────────────────────── */}
      <GlobalHeader
        hasActiveIncident={hasActiveIncident || isIdle}
        activeIncidentLabel="CHECKOUT REGRESSION"
        incidentId="4821"
        apiHealthy={apiStatus === 'success'}
      />

      {/* ── 2. THREE-ZONE COCKPIT SHELL ─────────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* ZONE 1: LEFT NAVIGATION RAIL (210px) */}
        <NavigationRail
          currentPath={currentPath}
          onNavigate={handleNavigate}
          badges={badges}
        />

        {/* ZONE 2: PRIMARY WORKSPACE (CENTER DOMINANT) */}
        <main className="flex-1 p-3 overflow-y-auto min-w-0">
          {apiError && state && (
            <div className="mb-3 p-2.5 rounded bg-rally-red/10 border border-rally-red/30 text-xs font-mono text-rally-red flex items-center justify-between">
              <span>{apiError}</span>
              <button
                onClick={() => setApiErrorState(null)}
                className="text-xs text-rally-muted hover:text-rally-text px-1"
              >
                ✕
              </button>
            </div>
          )}
          {renderWorkspaceView()}
        </main>

        {/* ZONE 3: RALLY COPILOT (RIGHT ZONE, 350px) */}
        <ConversationalPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
          state={activeState}
          confidence={state?.confidence}
        />
      </div>

      {/* ── 3. SYSTEM STATUS BAR ─────────────────────────────────────── */}
      <SystemStatusBar
        apiStatus={apiStatus === 'success' ? 'healthy' : 'degraded'}
        dbStatus={dbStatus === 'success' ? 'healthy' : 'degraded'}
      />
    </div>
  )
}

export default App
