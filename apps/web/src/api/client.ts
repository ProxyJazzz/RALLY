/**
 * RALLY — Centralized API client.
 *
 * All backend communication goes through this module.
 * Components must never scatter raw fetch() calls.
 */

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (import.meta.env.PROD ? '' : 'http://localhost:8000')

export type ServiceStatus = 'ok' | 'degraded' | 'unavailable'

export interface HealthResponse {
  status: ServiceStatus
  service: string
  version: string
  environment: string
}

export interface DatabaseHealthResponse {
  status: ServiceStatus
  service: string
  version: string
  environment: string
  database: string
  latency_ms?: number
  error?: string
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

async function get<T>(path: string): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })

    const data = (await response.json()) as T

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` }
    }

    return { ok: true, data }
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'TimeoutError') return { ok: false, error: 'Request timed out' }
      if (err.name === 'TypeError') return { ok: false, error: 'Cannot reach API server' }
      return { ok: false, error: err.message }
    }
    return { ok: false, error: 'Unknown error' }
  }
}

async function post<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000), // Investigations over MCP can take up to ~15s
    })

    const data = (await response.json()) as T

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` }
    }

    return { ok: true, data }
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'TimeoutError') return { ok: false, error: 'Request timed out' }
      if (err.name === 'TypeError') return { ok: false, error: 'Cannot reach API server' }
      return { ok: false, error: err.message }
    }
    return { ok: false, error: 'Unknown error' }
  }
}

export type EpistemicLabel = 'OBSERVED' | 'INFERRED' | 'PROPOSED' | 'APPROVED' | 'EXECUTED' | 'VERIFIED'

export interface EvidenceItem {
  evidence_id: string
  label: EpistemicLabel
  description: string
  source_tool: string
  timestamp: string
  details?: Record<string, unknown>
}

export interface TimelineStep {
  step_id: string
  title: string
  status: 'completed' | 'in_progress' | 'pending' | 'failed'
  timestamp: string
  tool_called?: string | null
  detail?: string | null
}

export interface ActionPlan {
  plan_id: string
  incident_id: string
  action_type: string
  service_id: string
  target_deployment_id: string
  risk_level: string
  risk_score: number
  reason: string
  impact: string
  approval_required: boolean
  status: string
  execution_status: string
}

export interface ExecutionVerification {
  execution_id?: string | null
  execution_status: string
  executed_at?: string | null
  mutation_details?: Record<string, unknown>
  verification_status: string
  recovery_decision?: string | null
  verified_at?: string | null
  verified_health?: string | null
  verified_error_rate?: number | null
  verified_active_deployment?: string | null
}

export interface AlexaSimulationState {
  incident_id: string
  state: string
  service_id: string
  active_deployment: string
  suspected_deployment?: string | null
  primary_hypothesis?: string | null
  confidence: number
  timeline: TimelineStep[]
  evidence: EvidenceItem[]
  action_plan?: ActionPlan | null
  execution_verification: ExecutionVerification
  last_assistant_speech?: string | null
}

export interface ChatMessageResponse {
  reply: string
  state: string
  is_explicit_approval: boolean
  approval_required: boolean
  action_plan?: ActionPlan | null
  snapshot: AlexaSimulationState
}

export const apiClient = {
  getHealth: (): Promise<ApiResult<HealthResponse>> => get<HealthResponse>('/health'),
  getDatabaseHealth: (): Promise<ApiResult<DatabaseHealthResponse>> =>
    get<DatabaseHealthResponse>('/health/database'),
  getAlexaState: (): Promise<ApiResult<AlexaSimulationState>> =>
    get<AlexaSimulationState>('/api/alexa/state'),
  resetAlexaSimulation: (): Promise<ApiResult<AlexaSimulationState>> =>
    post<AlexaSimulationState>('/api/alexa/reset', {}),
  sendAlexaChat: (message: string, incidentId = 'INC-ALEXA-GOLDEN'): Promise<ApiResult<ChatMessageResponse>> =>
    post<ChatMessageResponse>('/api/alexa/chat', { message, incident_id: incidentId }),
  submitAlexaApproval: (
    decision: 'APPROVE' | 'REJECT',
    incidentId = 'INC-ALEXA-GOLDEN',
    approver = 'sre-lead@rally.internal',
    reason = 'Authorized by Lead SRE after reviewing diff and runbook.'
  ): Promise<ApiResult<AlexaSimulationState>> =>
    post<AlexaSimulationState>('/api/alexa/approve', {
      incident_id: incidentId,
      decision,
      approver,
      reason,
    }),
}
