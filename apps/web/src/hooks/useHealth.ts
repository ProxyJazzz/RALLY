/**
 * RALLY — Health polling hook.
 *
 * Polls the backend health endpoints and returns typed state.
 * Handles loading, success, and failure states.
 */
import { useCallback, useEffect, useState } from 'react'
import { apiClient, DatabaseHealthResponse, HealthResponse } from '../api/client'

type Status = 'idle' | 'loading' | 'success' | 'error'

interface HealthState {
  apiStatus: Status
  dbStatus: Status
  api: HealthResponse | null
  database: DatabaseHealthResponse | null
  apiError: string | null
  dbError: string | null
  lastChecked: Date | null
  refresh: () => void
}

export function useHealth(pollIntervalMs = 15000): HealthState {
  const [apiStatus, setApiStatus] = useState<Status>('idle')
  const [dbStatus, setDbStatus] = useState<Status>('idle')
  const [api, setApi] = useState<HealthResponse | null>(null)
  const [database, setDatabase] = useState<DatabaseHealthResponse | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [dbError, setDbError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    setApiStatus('loading')
    setDbStatus('loading')

    const [apiResult, dbResult] = await Promise.all([
      apiClient.getHealth(),
      apiClient.getDatabaseHealth(),
    ])

    if (apiResult.ok) {
      setApi(apiResult.data)
      setApiError(null)
      setApiStatus('success')
    } else {
      setApi(null)
      setApiError(apiResult.error)
      setApiStatus('error')
    }

    if (dbResult.ok) {
      setDatabase(dbResult.data)
      setDbError(null)
      setDbStatus(dbResult.data.status === 'ok' ? 'success' : 'error')
    } else {
      setDatabase(null)
      setDbError(dbResult.error)
      setDbStatus('error')
    }

    setLastChecked(new Date())
  }, [])

  useEffect(() => {
    void refresh()
    const interval = setInterval(() => void refresh(), pollIntervalMs)
    return () => clearInterval(interval)
  }, [refresh, pollIntervalMs])

  return { apiStatus, dbStatus, api, database, apiError, dbError, lastChecked, refresh }
}
