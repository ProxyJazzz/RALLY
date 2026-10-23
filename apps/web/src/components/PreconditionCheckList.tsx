import React from 'react'

interface PreconditionCheckListProps {
  isExecuted: boolean
  isVerified: boolean
  targetDeployment?: string
}

export const PreconditionCheckList: React.FC<PreconditionCheckListProps> = ({
  isExecuted,
  isVerified,
  targetDeployment = 'checkout-v41',
}) => {
  const checks = [
    {
      id: 'PC-01',
      title: 'INCIDENT TELEMETRY STILL ACTIVE',
      detail: 'Revalidated that error rate was elevated (> 1.0%) at time of execution trigger.',
      passed: isExecuted,
    },
    {
      id: 'PC-02',
      title: 'TARGET DEPLOYMENT IDENTITY CONFIRMED',
      detail: `Target reversion deployment assertively validated as ${targetDeployment}.`,
      passed: isExecuted,
    },
    {
      id: 'PC-03',
      title: 'GOVERNANCE AUTHORIZATION ACTIVE',
      detail: 'Operator SRE governance authorization verified within validity window.',
      passed: isExecuted,
    },
    {
      id: 'PC-04',
      title: 'DOWNSTREAM ISOLATION PRE-CHECK',
      detail: 'Payment and Inventory APIs re-confirmed 100% nominal to ensure zero cascade.',
      passed: isExecuted,
    },
    {
      id: 'PC-05',
      title: 'INDEPENDENT TELEMETRY RESTORATION',
      detail: 'Post-action telemetry confirms error rate dropped to baseline healthy.',
      passed: isVerified,
    },
  ]

  return (
    <div className="bg-obsidian border border-steel rounded p-5 sm:p-6 select-none font-sans">
      <div className="flex items-center justify-between pb-3 border-b border-steel/60 text-[10px] font-mono uppercase text-ash tracking-wider">
        <span className="flex items-center gap-2">
          <span className="text-signal-cyan">🛡</span>
          <span className="text-off-white font-medium">PRECONDITION REVALIDATION & TOCTOU AUDIT</span>
        </span>
        <span className="text-success-green font-bold">
          {isVerified ? '5/5 CHECKS SATISFIED' : isExecuted ? '4/5 CHECKS SATISFIED' : 'PENDING DISPATCH'}
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {checks.map((c) => (
          <div
            key={c.id}
            className="p-3 rounded bg-charcoal/70 border border-steel/70 flex items-start justify-between gap-3 font-mono text-xs hover:border-tactical-gold/30 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span
                className={`font-bold mt-0.5 ${
                  c.passed ? 'text-success-green' : 'text-ash'
                }`}
              >
                {c.passed ? '✓' : '○'}
              </span>
              <div>
                <span className="text-off-white font-semibold text-xs block">
                  {c.id} • {c.title}
                </span>
                <span className="text-ash font-sans text-xs mt-0.5 block leading-snug">
                  {c.detail}
                </span>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold shrink-0 border ${
                c.passed
                  ? 'bg-success-green/15 text-success-green border-success-green/40'
                  : 'bg-charcoal text-ash border-steel'
              }`}
            >
              {c.passed ? 'PASSED' : 'PENDING'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
