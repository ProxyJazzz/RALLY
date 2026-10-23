import React from 'react'

interface EvidenceCorrelationFlowProps {
  deployment?: string
  hypothesis?: string
  errorRate?: number
}

export const EvidenceCorrelationFlow: React.FC<EvidenceCorrelationFlowProps> = ({
  deployment = 'checkout-v42',
  hypothesis = 'CHECKOUT_VALIDATION_REGRESSION',
  errorRate = 18.4,
}) => {
  return (
    <div className="bg-obsidian border border-steel rounded p-5 sm:p-6 select-none">
      <div className="flex items-center justify-between pb-3 border-b border-steel/60">
        <div className="flex items-center gap-2">
          <span className="text-tactical-gold font-mono text-xs">◈</span>
          <span className="font-mono text-xs font-semibold text-off-white uppercase tracking-wider">
            FORENSIC CORRELATION GRAPH
          </span>
        </div>
        <span className="text-[10px] font-mono text-ash uppercase">
          PROVENANCE CHAIN (4 NODES)
        </span>
      </div>

      {/* Correlation Steps Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 items-center">
        {/* Node 1: Deployment Trigger */}
        <div className="bg-charcoal border border-steel/80 p-3.5 rounded relative group hover:border-tactical-gold/40 transition-colors">
          <span className="text-[9px] font-mono uppercase tracking-widest text-ash block">
            01 • CANARY RELEASE
          </span>
          <span className="font-display text-xl text-off-white tracking-wider block mt-1 uppercase">
            {deployment}
          </span>
          <span className="text-[10px] font-mono text-crimson block mt-1">
            Anomalous diff deployed
          </span>
        </div>

        {/* Node 2: Log Signal */}
        <div className="bg-charcoal border border-steel/80 p-3.5 rounded relative group hover:border-tactical-gold/40 transition-colors">
          <span className="text-[9px] font-mono uppercase tracking-widest text-ash block">
            02 • TELEMETRY LOG
          </span>
          <span className="font-display text-xl text-crimson tracking-wider block mt-1 uppercase">
            SCHEMA ERRORS
          </span>
          <span className="text-[10px] font-mono text-ash block mt-1 truncate">
            Missing payment_method
          </span>
        </div>

        {/* Node 3: Metric Spike */}
        <div className="bg-charcoal border border-steel/80 p-3.5 rounded relative group hover:border-tactical-gold/40 transition-colors">
          <span className="text-[9px] font-mono uppercase tracking-widest text-ash block">
            03 • METRIC SPIKE
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-display text-2xl text-crimson leading-none">
              {errorRate.toFixed(1)}%
            </span>
            <span className="font-mono text-[10px] text-crimson/80 uppercase">5XX ERR</span>
          </div>
          <span className="text-[10px] font-mono text-ash block mt-1">
            ↑ 26× baseline elevation
          </span>
        </div>

        {/* Node 4: Autonomous Hypothesis */}
        <div className="bg-charcoal border border-tactical-gold/50 p-3.5 rounded relative group shadow-tactical-gold">
          <span className="text-[9px] font-mono uppercase tracking-widest text-tactical-gold block">
            04 • SYNTHESIZED ROOT CAUSE
          </span>
          <span className="font-display text-lg text-off-white tracking-wide block mt-1 uppercase truncate">
            {hypothesis}
          </span>
          <span className="text-[10px] font-mono text-tactical-gold block mt-1">
            95% model confidence
          </span>
        </div>
      </div>
    </div>
  )
}
