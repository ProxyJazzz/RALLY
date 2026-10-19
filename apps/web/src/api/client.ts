/**
 * RALLY — Centralized API client.
 *
 * All backend communication goes through this module.
 * Components must never scatter raw fetch() calls.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000'

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

export const apiClient = {
  getHealth: (): Promise<ApiResult<HealthResponse>> => get<HealthResponse>('/health'),
  getDatabaseHealth: (): Promise<ApiResult<DatabaseHealthResponse>> =>
    get<DatabaseHealthResponse>('/health/database'),
}
