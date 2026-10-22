import React from 'react'

interface HypothesesViewProps {
  primaryHypothesis?: string | null
  confidence?: number
  state: string
  onNavigate: (route: string) => void
}

export const HypothesesView: React.FC<HypothesesViewProps> = ({
  confidence = 0,
  state,
  onNavigate,
}) => {
  const isInvestigated = state !== 'IDLE' && state !== 'RECEIVED' && state !== 'TRIAGING'

  const scoreH1 = confidence > 0 ? Math.round(confidence * 100) : 91

  const hypotheses = [
    {
      id: '01',
      code: 'H1',
      title: 'CHECKOUT DEPLOYMENT REGRESSION (checkout-v42)',
      confidence: scoreH1,
      confidenceTier: 'HIGH CONFIDENCE',
      status: 'SUPPORTED',
      color: 'cyan',
      description: 'Order validator regression introduced in checkout-v42 generates unhandled exceptions during checkout finalization.',
      evidencePoints: [
        { label: 'Deployment correlation', detail: 'Spike initiated exactly following checkout-v42 deployment timestamp.' },
        { label: 'Elevated error rate', detail: 'HTTP 5xx error rate elevated to 18.4% (healthy threshold < 1.0%).' },
        { label: 'Dependency health normal', detail: 'Payment, inventory, and auth dependency checks return 200 OK with zero errors.' },
        { label: 'Deployment diff verified', detail: 'order_validator.py modified with bug signature CHECKOUT_VALIDATION_REGRESSION.' },
      ],
    },
    {
      id: '02',
      code: 'H2',
      title: 'PAYMENT DEPENDENCY OUTAGE',
      confidence: 4,
      confidenceTier: 'UNLIKELY',
      status: 'DISPROVEN',
      color: 'gray',
      description: 'Potential latency or timeout failure on payment-service gateway.',
      evidencePoints: [
        { label: 'get_dependency_health', detail: 'Payment gateway health confirmed healthy; latency 28ms.' },
      ],
    },
    {
      id: '03',
      code: 'H3',
      title: 'INVENTORY SERVICE STARVATION',
      confidence: 3,
      confidenceTier: 'UNLIKELY',
      status: 'DISPROVEN',
      color: 'gray',
      description: 'Inventory locking failure or stock-check timeout during cart checkout.',
      evidencePoints: [
        { label: 'query_logs', detail: 'No stock timeout or inventory deadlocks observed.' },
      ],
    },
    {
      id: '04',
      code: 'H4',
      title: 'AUTHENTICATION TOKEN REJECTION',
      confidence: 2,
      confidenceTier: 'UNLIKELY',
      status: 'DISPROVEN',
      color: 'gray',
      description: 'Expired session JWT or auth provider rate-limiting.',
      evidencePoints: [
        { label: 'get_service_health', detail: 'Auth service latency and token validation nominal.' },
      ],
    },
  ]

  return (
    <div className="space-y-3 font-mono">
      {/* Workspace Header */}
      <div className="bg-rally-surface border border-rally-border rounded p-3.5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-rally-text uppercase tracking-wider">
              ROOT-CAUSE REASONING & HYPOTHESES MATRIX
            </h1>
            <span className="px-2 py-0.2 rounded-sm text-xs bg-rally-cyan/15 text-rally-cyan border border-rally-cyan/30">
              {isInvestigated ? 'RANKED ANALYSIS' : 'STANDBY'}
            </span>
          </div>
          <p className="text-xs text-rally-secondary font-sans mt-0.5">
            Bayesian evidence weighting across competing operational failure hypotheses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/evidence')}
            className="px-2.5 py-1 rounded bg-rally-bg border border-rally-border hover:border-rally-blue text-xs text-rally-secondary hover:text-rally-text"
          >
            Evidence Ledger →
          </button>
          <button
            onClick={() => onNavigate('/action-plan')}
            className="px-2.5 py-1 rounded bg-rally-bg border border-rally-border hover:border-rally-blue text-xs text-rally-secondary hover:text-rally-text"
          >
            Action Plan →
          </button>
        </div>
      </div>

      {!isInvestigated ? (
        <div className="bg-rally-surface border border-rally-border rounded p-12 text-center">
          <div className="text-rally-muted text-sm uppercase">NO HYPOTHESES AVAILABLE</div>
          <p className="text-xs text-rally-secondary font-sans mt-1">
            Awaiting investigation. Run 'Investigate incident' from Overview to trigger autonomous root-cause hypothesis ranking.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {hypotheses.map((h) => {
            const isTop = h.code === 'H1'
            return (
              <div
                key={h.id}
                className={`p-4 rounded border transition-all ${
                  isTop
                    ? 'bg-rally-surface border-rally-cyan/50 shadow-sm'
                    : 'bg-rally-surface/60 border-rally-border opacity-85'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rally-border pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-sm font-bold px-2 py-0.5 rounded-sm ${
                        isTop ? 'bg-rally-cyan text-black' : 'bg-rally-bg text-rally-muted'
                      }`}
                    >
                      {h.code}
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-rally-text tracking-tight">
                        {h.title}
                      </h2>
                      <span className="text-[10px] text-rally-muted uppercase">
                        CLASSIFICATION: {h.confidenceTier} • STATUS: {h.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`text-base font-bold ${isTop ? 'text-rally-cyan' : 'text-rally-muted'}`}>
                        {h.confidence}%
                      </span>
                      <span className="text-[10px] text-rally-muted block">CONFIDENCE</span>
                    </div>
                  </div>
                </div>

                {/* Horizontal Confidence Bar */}
                <div className="w-full h-1.5 bg-rally-bg rounded-sm overflow-hidden my-3 border border-rally-border">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isTop ? 'bg-rally-cyan' : 'bg-rally-muted/40'
                    }`}
                    style={{ width: `${h.confidence}%` }}
                  />
                </div>

                <p className="text-xs text-rally-secondary font-sans mb-3">
                  {h.description}
                </p>

                {/* Evidence Checklist */}
                {h.evidencePoints.length > 0 && (
                  <div className="space-y-1.5 bg-rally-bg p-2.5 rounded border border-rally-border text-xs">
                    <span className="text-[9px] uppercase text-rally-muted font-bold tracking-wider block">
                      SUPPORTING TELEMETRY EVIDENCE:
                    </span>
                    {h.evidencePoints.map((pt, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-rally-green font-bold text-xs">✓</span>
                        <div>
                          <span className="text-rally-text font-medium">{pt.label}: </span>
                          <span className="text-rally-secondary font-sans">{pt.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
