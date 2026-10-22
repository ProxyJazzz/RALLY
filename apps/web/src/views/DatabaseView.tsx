import React from 'react'
import { StatusCard } from '../components/StatusCard'

interface DatabaseViewProps {
  apiStatus: 'idle' | 'loading' | 'success' | 'error'
  dbStatus: 'idle' | 'loading' | 'success' | 'error'
  api: any
  database: any
  apiError: string | null
  dbError: string | null
  lastChecked: Date | null
  refresh: () => void
  onNavigate?: (route: string) => void
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  apiStatus,
  dbStatus,
  api,
  database,
  apiError,
  dbError,
  lastChecked,
  refresh,
}) => {
  return (
    <div className="space-y-3 font-mono">
      {/* Workspace Header */}
      <div className="bg-rally-surface border border-rally-border rounded p-3.5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-rally-text uppercase tracking-wider">
              INFRASTRUCTURE & DATABASE HEALTH WORKSPACE
            </h1>
            <span
              className={`px-2 py-0.2 rounded-sm text-xs font-bold uppercase ${
                dbStatus === 'success'
                  ? 'bg-rally-green/20 text-rally-green border border-rally-green/40'
                  : 'bg-rally-red/20 text-rally-red border border-rally-red/40'
              }`}
            >
              POSTGRESQL {dbStatus === 'success' ? 'CONNECTED' : 'UNAVAILABLE'}
            </span>
          </div>
          <p className="text-xs text-rally-secondary font-sans mt-0.5">
            Real-time infrastructure health verified via authoritative FastAPI and PostgreSQL health endpoints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lastChecked && (
            <span className="text-[10px] text-rally-muted hidden sm:inline">
              Last checked: {lastChecked.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => void refresh()}
            disabled={apiStatus === 'loading'}
            className="px-3 py-1.5 rounded bg-rally-bg border border-rally-border hover:border-rally-cyan text-xs text-rally-cyan font-bold transition-all disabled:opacity-40"
          >
            {apiStatus === 'loading' ? 'CHECKING…' : 'REFRESH HEALTH'}
          </button>
        </div>
      </div>

      {/* Real Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <StatusCard
          label="FastAPI Gateway Process"
          status={apiStatus}
          serviceStatus={api?.status}
          value={api ? `${api.service} v${api.version}` : undefined}
          detail={api ? `Environment: ${api.environment}` : 'GET /health endpoint'}
          error={apiError}
        />

        <StatusCard
          label="PostgreSQL Core Database"
          status={dbStatus}
          serviceStatus={database?.status}
          value={database ? `Database: ${database.database}` : undefined}
          detail={database ? `Environment: ${database.environment}` : 'GET /health/database (SELECT 1)'}
          latencyMs={database?.latency_ms}
          error={dbError ?? database?.error}
        />
      </div>

      {/* Raw Health Endpoints Inspection */}
      <div className="bg-rally-surface border border-rally-border rounded p-3.5 space-y-2">
        <div className="text-[10px] text-rally-muted uppercase pb-1.5 border-b border-rally-border flex justify-between">
          <span>HEALTH ENDPOINT RESPONSES</span>
          <span className="text-rally-cyan">HTTP 200 / 503 CONTRACTS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div>
            <span className="text-[10px] text-rally-muted uppercase block mb-1">
              GET /health (API Liveness)
            </span>
            <pre className="text-[11px] text-rally-secondary bg-rally-bg p-2.5 rounded border border-rally-border overflow-x-auto">
              {JSON.stringify(api ?? { status: apiStatus }, null, 2)}
            </pre>
          </div>

          <div>
            <span className="text-[10px] text-rally-muted uppercase block mb-1">
              GET /health/database (SELECT 1 DB Verification)
            </span>
            <pre className="text-[11px] text-rally-secondary bg-rally-bg p-2.5 rounded border border-rally-border overflow-x-auto">
              {JSON.stringify(database ?? { status: dbStatus, error: dbError }, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Honest Data Availability Disclosure */}
      <div className="bg-rally-surface border border-rally-border rounded p-3.5 space-y-1.5 text-xs font-sans">
        <span className="font-mono text-[10px] text-rally-muted uppercase font-bold block">
          DATA AVAILABILITY & ARCHITECTURAL DISCLOSURE
        </span>
        <p className="text-rally-secondary leading-relaxed">
          PostgreSQL connectivity is verified by executing a real <span className="font-mono text-rally-text">SELECT 1</span> probe over SQLAlchemy async sessions. Fine-grained database operational metrics (CPU utilization, connection pool counts, disk IOPS, and active query locks) are not exposed by the current API contract. RALLY intentionally displays only real telemetry to maintain operational integrity.
        </p>
      </div>
    </div>
  )
}
