/**
 * RALLY — StatusCard component.
 *
 * Displays real backend status with operational signal colors, 1px borders,
 * and JetBrains Mono metrics.
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

function StatusIndicator({
  status,
  serviceStatus,
}: {
  status: StatusCardProps['status']
  serviceStatus?: ServiceStatus
}) {
  if (status === 'idle' || status === 'loading') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono text-rally-info px-2 py-0.5 rounded bg-rally-info/10 border border-rally-info/20">
        <span className="w-1.5 h-1.5 rounded-full bg-rally-info animate-ping" />
        {status === 'idle' ? 'INIT' : 'CHECKING'}
      </span>
    )
  }

  if (status === 'error' || serviceStatus === 'unavailable') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono text-rally-critical px-2 py-0.5 rounded bg-rally-critical/10 border border-rally-critical/20">
        <span className="w-1.5 h-1.5 rounded-full bg-rally-critical animate-pulse" />
        UNAVAILABLE
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-rally-healthy px-2 py-0.5 rounded bg-rally-healthy/10 border border-rally-healthy/20">
      <span className="w-1.5 h-1.5 rounded-full bg-rally-healthy" />
      HEALTHY
    </span>
  )
}

export function StatusCard({
  label,
  status,
  serviceStatus,
  value,
  detail,
  error,
  latencyMs,
}: StatusCardProps) {
  return (
    <div className="bg-rally-surface border border-rally-border rounded p-3 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-rally-muted text-[11px] font-mono uppercase tracking-wider">
          {label}
        </span>
        <StatusIndicator status={status} serviceStatus={serviceStatus} />
      </div>

      {value && (
        <div className="font-mono text-rally-text text-xs font-semibold">{value}</div>
      )}

      {detail && (
        <div className="text-rally-secondary text-[11px] font-mono truncate">{detail}</div>
      )}

      {latencyMs !== undefined && (
        <div className="text-rally-muted text-[10px] font-mono flex items-center justify-between pt-1 border-t border-rally-border-subtle">
          <span>LATENCY</span>
          <span className="text-rally-text font-medium">{latencyMs}ms</span>
        </div>
      )}

      {error && (
        <div className="text-rally-critical text-[11px] font-mono bg-rally-critical/10 border border-rally-critical/20 rounded px-2.5 py-1.5 mt-1">
          {error}
        </div>
      )}
    </div>
  )
}
