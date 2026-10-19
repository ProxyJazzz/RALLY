/**
 * RALLY — StatusCard component.
 *
 * Displays real backend status with loading/success/failure states.
 * Never shows fake data.
 */
import { ServiceStatus } from '../api/client'

interface StatusCardProps {
  label: string
  status: 'idle' | 'loading' | 'success' | 'error'
  serviceStatus?: ServiceStatus
  value?: string
  detail?: string
  error?: string | null
  latencyMs?: number
}

function StatusIndicator({ status, serviceStatus }: { status: StatusCardProps['status'], serviceStatus?: ServiceStatus }) {
  if (status === 'idle' || status === 'loading') {
    return (
      <span className="status-badge status-checking">
        <span className="pulse-dot bg-rally-info" />
        {status === 'idle' ? 'Initializing' : 'Checking…'}
      </span>
    )
  }

  if (status === 'error' || serviceStatus === 'unavailable') {
    return (
      <span className="status-badge status-unavailable">
        <span className="pulse-dot bg-rally-critical" />
        Unavailable
      </span>
    )
  }

  return (
    <span className="status-badge status-ok">
      <span className="w-2 h-2 rounded-full bg-rally-healthy inline-block" />
      Operational
    </span>
  )
}

export function StatusCard({ label, status, serviceStatus, value, detail, error, latencyMs }: StatusCardProps) {
  return (
    <div className="card flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between gap-4">
        <span className="text-rally-secondary text-sm font-medium uppercase tracking-wider">{label}</span>
        <StatusIndicator status={status} serviceStatus={serviceStatus} />
      </div>

      {value && (
        <div className="font-mono text-rally-text text-sm">{value}</div>
      )}

      {detail && (
        <div className="text-rally-muted text-xs font-mono">{detail}</div>
      )}

      {latencyMs !== undefined && (
        <div className="text-rally-muted text-xs font-mono">
          Latency: <span className="text-rally-secondary">{latencyMs}ms</span>
        </div>
      )}

      {error && (
        <div className="text-rally-critical text-xs font-mono bg-rally-critical/5 border border-rally-critical/20 rounded px-3 py-2">
          {error}
        </div>
      )}
    </div>
  )
}
