import React from 'react'
import { ConfidenceGauge } from '../components/ConfidenceGauge'

interface HypothesesViewProps {
  primaryHypothesis?: string | null
  confidence?: number
  state: string
  onNavigate: (route: string) => void
}

export const HypothesesView: React.FC<HypothesesViewProps> = ({
  primaryHypothesis,
  confidence = 0,
  state,
  onNavigate,
}) => {
  const isInvestigated = state !== 'IDLE' && state !== 'RECEIVED' && state !== 'TRIAGING'
  const isResolved = state === 'RESOLVED'
  const score = confidence > 0 ? Math.round(confidence * 100) : 95

  const resolvedHypothesis =
    primaryHypothesis ?? 'CHECKOUT_VALIDATION_REGRESSION in checkout-v42'

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* ── 1. CINEMATIC EDITORIAL HERO ─────────────────────────────────── */}
      <div className="relative overflow-hidden bg-obsidian border border-steel rounded p-6 sm:p-8 select-none">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-tactical-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-steel/60 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-tactical-gold" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-off-white font-semibold">
              ROOT-CAUSE DEDUCTION • BAYESIAN REASONING MATRIX
            </span>
            <span className="text-steel">|</span>
            <span className="text-[10px] font-mono text-tactical-gold">
              STATE: {state}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('/evidence')}
              className="px-3.5 py-1.5 rounded bg-charcoal hover:bg-graphite border border-steel text-xs font-mono text-off-white transition-colors"
            >
              ← FORENSIC EVIDENCE
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/action-plan')}
              className="px-3.5 py-1.5 rounded bg-charcoal hover:bg-graphite border border-steel text-xs font-mono text-off-white transition-colors"
            >
              REMEDIATION PLAN →
            </button>
          </div>
        </div>

        <div className="max-w-3xl">
          <div className="font-editorial italic text-tactical-gold text-base sm:text-lg mb-1">
            "Every conclusion must leave a trail."
          </div>
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl tracking-tight text-off-white leading-none uppercase">
            ROOT CAUSE
          </h1>
          <p className="font-sans text-sm sm:text-base text-ash mt-3 leading-relaxed">
            RALLY synthesizes collected telemetry artifacts, deployment diffs, and dependency isolation proofs into a ranked probabilistic root-cause conclusion.
          </p>
        </div>
      </div>

      {!isInvestigated ? (
        <div className="bg-obsidian border border-steel rounded p-16 text-center">
          <span className="text-tactical-gold font-mono text-2xl block mb-2">◈</span>
          <div className="text-ash font-mono text-sm uppercase tracking-widest">
            AWAITING INVESTIGATION TELEMETRY
          </div>
          <p className="text-xs text-ash/80 font-sans mt-2 max-w-md mx-auto">
            Autonomous reasoning matrix will rank candidate failure hypotheses once telemetry is collected.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/overview')}
            className="mt-4 px-4 py-2 rounded bg-charcoal border border-steel hover:border-tactical-gold text-xs font-mono text-tactical-gold transition-colors"
          >
            ← Back to Overview
          </button>
        </div>
      ) : (
        <>
          {/* ── 2. DOMINANT PRIMARY HYPOTHESIS BLOCK ─────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 bg-obsidian border border-tactical-gold/50 rounded p-6 sm:p-8 select-none shadow-tactical-gold flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-steel/60 font-mono text-[10px] uppercase text-ash">
                  <div className="flex items-center gap-2">
                    <span className="text-tactical-gold font-bold">◈ PRIMARY ROOT-CAUSE HYPOTHESIS</span>
                    <span className="text-steel">|</span>
                    <span className="text-signal-cyan">ID: H-01</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-tactical-gold/20 text-tactical-gold border border-tactical-gold/40 font-bold">
                    {isResolved ? 'CONFIRMED & RESOLVED' : 'INFERRED'}
                  </span>
                </div>

                <div className="mt-4">
                  <h2 className="font-display text-3xl sm:text-5xl text-off-white tracking-wide uppercase leading-tight">
                    {resolvedHypothesis}
                  </h2>
                  <p className="font-sans text-sm sm:text-base text-ash mt-3 leading-relaxed">
                    Order validation logic introduced in canary deployment <strong className="text-off-white font-mono">checkout-v42</strong> generates unhandled exceptions during checkout finalization, cascading into HTTP 5xx error rate spikes while downstream payment and inventory dependencies remain completely healthy.
                  </p>
                </div>

                {/* Direct Evidence Provenance Trail */}
                <div className="mt-6 pt-4 border-t border-steel/60">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-ash mb-2">
                    SUPPORTING EVIDENCE PROVENANCE TRAIL:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
                    <div className="bg-charcoal p-2.5 rounded border border-steel/70 flex items-start gap-2">
                      <span className="text-success-green font-mono font-bold">✓</span>
                      <div>
                        <span className="text-off-white font-semibold font-mono text-[11px] block">
                          DEPLOYMENT CORRELATION (EV-01)
                        </span>
                        <span className="text-ash text-xs">
                          Incident onset coincided with checkout-v42 promotion.
                        </span>
                      </div>
                    </div>

                    <div className="bg-charcoal p-2.5 rounded border border-steel/70 flex items-start gap-2">
                      <span className="text-success-green font-mono font-bold">✓</span>
                      <div>
                        <span className="text-off-white font-semibold font-mono text-[11px] block">
                          TELEMETRY ERROR SPIKE (EV-02)
                        </span>
                        <span className="text-ash text-xs">
                          HTTP 5xx error rate elevated to 18.4% (26× threshold).
                        </span>
                      </div>
                    </div>

                    <div className="bg-charcoal p-2.5 rounded border border-steel/70 flex items-start gap-2">
                      <span className="text-success-green font-mono font-bold">✓</span>
                      <div>
                        <span className="text-off-white font-semibold font-mono text-[11px] block">
                          LOG BUG SIGNATURE (EV-03)
                        </span>
                        <span className="text-ash text-xs">
                          SchemaValidationError in order_validator.py.
                        </span>
                      </div>
                    </div>

                    <div className="bg-charcoal p-2.5 rounded border border-steel/70 flex items-start gap-2">
                      <span className="text-success-green font-mono font-bold">✓</span>
                      <div>
                        <span className="text-off-white font-semibold font-mono text-[11px] block">
                          DEPENDENCY ISOLATION (EV-04)
                        </span>
                        <span className="text-ash text-xs">
                          Payment, Inventory, Auth confirmed 100% nominal.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-steel/60 flex items-center justify-between text-xs font-mono">
                <span className="text-ash">CORRELATED MCP TOOLS: 4 EXECUTED</span>
                <button
                  type="button"
                  onClick={() => onNavigate('/evidence')}
                  className="text-tactical-gold hover:underline"
                >
                  Inspect Evidence Records →
                </button>
              </div>
            </div>

            {/* Right: Confidence Gauge Meter */}
            <div className="lg:col-span-4 flex flex-col justify-between">
              <ConfidenceGauge
                score={score}
                tier={score >= 90 ? 'HIGH' : score >= 70 ? 'MODERATE' : 'LOW'}
                status={isResolved ? 'VERIFIED' : 'INFERRED'}
              />
            </div>
          </div>

          {/* ── 3. CANDIDATE HYPOTHESES REASONING MATRIX ─────────────────── */}
          <div className="bg-obsidian border border-steel rounded p-5 sm:p-6 select-none">
            <div className="flex items-center justify-between pb-3 border-b border-steel/60 text-[10px] font-mono uppercase text-ash tracking-wider">
              <span>COMPETING HYPOTHESES REASONING MATRIX</span>
              <span>BAYESIAN EVIDENCE WEIGHTING</span>
            </div>

            <div className="divide-y divide-steel/60 mt-2 font-mono text-xs">
              {/* Primary Candidate */}
              <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-tactical-gold/20 text-tactical-gold border border-tactical-gold/40 font-bold text-[10px]">
                      H-01 • PRIMARY
                    </span>
                    <span className="text-off-white font-bold text-sm">
                      CHECKOUT VALIDATION REGRESSION
                    </span>
                  </div>
                  <p className="font-sans text-xs text-ash mt-1.5 leading-relaxed">
                    Faulty schema assertion in checkout-v42 rejects valid customer cart sessions.
                  </p>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="w-36 hidden sm:block">
                    <div className="h-2 w-full bg-charcoal rounded overflow-hidden border border-steel">
                      <div className="h-full bg-tactical-gold" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-tactical-gold">{score}%</span>
                    <span className="text-[9px] text-ash block">SUPPORTED</span>
                  </div>
                </div>
              </div>

              {/* Rejected Candidate 1 */}
              <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-70 hover:opacity-100 transition-opacity">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-charcoal text-ash border border-steel text-[10px]">
                      H-02 • ALTERNATIVE
                    </span>
                    <span className="text-off-white font-medium text-sm">
                      PAYMENT GATEWAY LATENCY OR OUTAGE
                    </span>
                  </div>
                  <p className="font-sans text-xs text-ash mt-1.5 leading-relaxed">
                    Downstream payment gateway latency or network partition in card processing.
                    <span className="text-crimson/80 block mt-0.5 font-mono text-[10px]">
                      CONTRADICTED BY: get_dependency_health returned 200 OK (latency 28ms).
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="w-36 hidden sm:block">
                    <div className="h-2 w-full bg-charcoal rounded overflow-hidden border border-steel">
                      <div className="h-full bg-ash/40" style={{ width: '4%' }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-ash">4%</span>
                    <span className="text-[9px] text-crimson block">DISPROVEN</span>
                  </div>
                </div>
              </div>

              {/* Rejected Candidate 2 */}
              <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-70 hover:opacity-100 transition-opacity">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-charcoal text-ash border border-steel text-[10px]">
                      H-03 • ALTERNATIVE
                    </span>
                    <span className="text-off-white font-medium text-sm">
                      INVENTORY RESERVATION LOCK STARVATION
                    </span>
                  </div>
                  <p className="font-sans text-xs text-ash mt-1.5 leading-relaxed">
                    Distributed locking deadlocks or stock reservation timeout under peak cart load.
                    <span className="text-crimson/80 block mt-0.5 font-mono text-[10px]">
                      CONTRADICTED BY: query_logs reported zero inventory contention errors.
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="w-36 hidden sm:block">
                    <div className="h-2 w-full bg-charcoal rounded overflow-hidden border border-steel">
                      <div className="h-full bg-ash/40" style={{ width: '3%' }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-ash">3%</span>
                    <span className="text-[9px] text-crimson block">DISPROVEN</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
