import { useState } from 'react'
import { useHealth } from './hooks/useHealth'
import { StatusCard } from './components/StatusCard'
import { AlexaSimulationWorkspace } from './components/AlexaSimulationWorkspace'

function App() {
  const [activeTab, setActiveTab] = useState<'alexa' | 'system'>('alexa')
  const { apiStatus, dbStatus, api, database, apiError, dbError, lastChecked, refresh } = useHealth(15000)

  const lastCheckedStr = lastChecked
    ? lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  return (
    <div className="min-h-screen bg-rally-charcoal text-rally-text flex flex-col">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="border-b border-rally-border bg-rally-black px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-rally-info/10 border border-rally-info/30">
              <span className="text-rally-info font-mono font-bold text-sm">R</span>
            </div>
            <div>
              <span className="font-semibold text-rally-text tracking-wide">RALLY</span>
              <span className="ml-2 text-rally-muted text-xs font-mono hidden md:inline">
                Agentic Reliability & Response Orchestration
              </span>
            </div>
          </div>

          {/* Navigation tabs */}
          <nav className="flex items-center gap-2 text-xs font-mono">
            <button
              type="button"
              id="tab-alexa-btn"
              onClick={() => setActiveTab('alexa')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'alexa'
                  ? 'bg-rally-info/20 text-rally-info border border-rally-info/40 font-semibold'
                  : 'text-rally-secondary hover:text-rally-text bg-rally-graphite/40'
              }`}
            >
              Alexa+ Simulation
            </button>
            <button
              type="button"
              id="tab-system-btn"
              onClick={() => setActiveTab('system')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'system'
                  ? 'bg-rally-info/20 text-rally-info border border-rally-info/40 font-semibold'
                  : 'text-rally-secondary hover:text-rally-text bg-rally-graphite/40'
              }`}
            >
              System Health
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-rally-healthy/10 text-rally-healthy border border-rally-healthy/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rally-healthy animate-pulse" />
            SYSTEM ONLINE
          </span>
          {activeTab === 'system' && lastCheckedStr && (
            <span className="text-rally-muted text-xs font-mono hidden md:inline">
              Last checked: {lastCheckedStr}
            </span>
          )}
          {activeTab === 'system' && (
            <button
              id="refresh-btn"
              onClick={() => void refresh()}
              disabled={apiStatus === 'loading'}
              className="text-xs text-rally-info border border-rally-info/30 rounded px-3 py-1.5 hover:bg-rally-info/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-mono"
            >
              {apiStatus === 'loading' ? 'Refreshing…' : 'Refresh'}
            </button>
          )}
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-7xl mx-auto w-full">
        {activeTab === 'alexa' ? (
          <AlexaSimulationWorkspace />
        ) : (
          <div>
            {/* Page title */}
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-rally-text mb-1">System Status</h1>
              <p className="text-rally-secondary text-xs">
                Real-time API and PostgreSQL infrastructure health
              </p>
            </div>

            {/* Status grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
          </div>
        )}
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
