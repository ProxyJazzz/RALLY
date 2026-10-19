/**
 * RALLY — System Status Interface
 *
 * Phase 1 Foundation: displays real backend health data.
 * This is NOT the final command center (Phase 9).
 * All data is fetched from the real API — no fake state.
 */
import { useHealth } from './hooks/useHealth'
import { StatusCard } from './components/StatusCard'

function App() {
  const { apiStatus, dbStatus, api, database, apiError, dbError, lastChecked, refresh } = useHealth(15000)

  const lastCheckedStr = lastChecked
    ? lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  return (
    <div className="min-h-screen bg-rally-charcoal text-rally-text flex flex-col">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="border-b border-rally-border bg-rally-black px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-rally-info/10 border border-rally-info/30">
            <span className="text-rally-info font-mono font-bold text-sm">R</span>
          </div>
          <div>
            <span className="font-semibold text-rally-text tracking-wide">RALLY</span>
            <span className="ml-2 text-rally-muted text-xs font-mono">Agentic Reliability & Response Orchestration</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastCheckedStr && (
            <span className="text-rally-muted text-xs font-mono">
              Last checked: {lastCheckedStr}
            </span>
          )}
          <button
            id="refresh-btn"
            onClick={() => void refresh()}
            disabled={apiStatus === 'loading'}
            className="text-xs text-rally-info border border-rally-info/30 rounded px-3 py-1.5 hover:bg-rally-info/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-mono"
          >
            {apiStatus === 'loading' ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-rally-text mb-1">System Status</h1>
          <p className="text-rally-secondary text-sm">
            Real-time connectivity status — Phase 1 Foundation
          </p>
        </div>

        {/* Status grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

          <StatusCard
            label="API Server"
            status={apiStatus}
            serviceStatus={api?.status}
            value={api ? `${api.service} v${api.version}` : undefined}
            detail={api ? `Environment: ${api.environment}` : undefined}
            error={apiError}
          />

          <StatusCard
            label="Database"
            status={dbStatus}
            serviceStatus={database?.status}
            value={database ? database.database : undefined}
            detail={database ? `Environment: ${database.environment}` : undefined}
            latencyMs={database?.latency_ms}
            error={dbError ?? database?.error}
          />

        </div>

        {/* Phase context */}
        <div className="card mt-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-1 h-full bg-rally-info rounded" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-rally-info text-xs font-mono font-medium uppercase tracking-wide">Current Phase</span>
                <span className="status-badge bg-rally-info/10 text-rally-info border-rally-info/20 text-xs">Phase 1 — Foundation</span>
              </div>
              <p className="text-rally-secondary text-sm leading-relaxed">
                This interface displays real API and database connectivity data.
                The full command center (live incident timeline, evidence panel, agent activity, approval gate) will be built in Phase 9.
              </p>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  ['Backend', 'FastAPI + Python 3.12'],
                  ['Database', 'PostgreSQL + Alembic'],
                  ['Frontend', 'React + Vite + Tailwind'],
                ].map(([name, tech]) => (
                  <div key={name} className="bg-rally-graphite rounded px-3 py-2">
                    <div className="text-rally-muted text-xs mb-0.5">{name}</div>
                    <div className="text-rally-secondary text-xs font-mono">{tech}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-rally-border px-6 py-3 flex items-center justify-between text-rally-muted text-xs font-mono">
        <span>RALLY v0.1.0</span>
        <span>Amazon AI Hackathon 2026</span>
      </footer>

    </div>
  )
}

export default App
