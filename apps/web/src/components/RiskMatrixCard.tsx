import React from 'react'

interface RiskMatrixCardProps {
  level: string // e.g. "HIGH"
  score: number // e.g. 65
  serviceId: string
  reversibility?: string
  blastRadiusCluster?: string
  reason?: string
}

export const RiskMatrixCard: React.FC<RiskMatrixCardProps> = ({
  level,
  score,
  serviceId,
  reversibility = 'HIGH',
  blastRadiusCluster = 'MODERATE_CLUSTER',
  reason,
}) => {
  const getRiskColor = (lvl: string) => {
    switch (lvl.toUpperCase()) {
      case 'CRITICAL':
        return 'text-crimson border-crimson/50 bg-crimson/10'
      case 'HIGH':
        return 'text-warning-amber border-warning-amber/50 bg-warning-amber/10'
      case 'MEDIUM':
        return 'text-tactical-gold border-tactical-gold/50 bg-tactical-gold/10'
      case 'LOW':
      default:
        return 'text-success-green border-success-green/50 bg-success-green/10'
    }
  }

  return (
    <div className="bg-obsidian border border-steel rounded p-5 sm:p-6 select-none flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-steel/60 text-[10px] font-mono uppercase text-ash tracking-wider">
          <span>GOVERNANCE RISK ASSESSMENT</span>
          <span className="text-warning-amber font-semibold">MANDATORY GATE</span>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono text-ash uppercase tracking-widest block">
              CLASSIFIED RISK TIER
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`font-display text-5xl sm:text-6xl uppercase leading-none ${level === 'HIGH' ? 'text-warning-amber' : level === 'CRITICAL' ? 'text-crimson' : 'text-off-white'}`}>
                {level}
              </span>
              <span className={`font-mono text-xs px-2 py-0.5 rounded border uppercase font-bold ${getRiskColor(level)}`}>
                TIER-1 CORE
              </span>
            </div>
          </div>

          <div className="bg-charcoal/80 border border-steel/80 p-3 rounded text-right shrink-0">
            <span className="text-[9px] font-mono text-ash uppercase block">RISK SCORE</span>
            <div className="flex items-baseline justify-end gap-1 mt-0.5 font-mono">
              <span className="text-2xl font-bold text-off-white leading-none">{score}</span>
              <span className="text-xs text-ash">/ 100</span>
            </div>
            <span className="text-[9px] font-mono text-warning-amber block mt-1">
              POLICY THRESHOLD &gt; 50
            </span>
          </div>
        </div>

        {/* Risk Dimension Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-steel/60 font-mono text-xs">
          <div className="bg-charcoal p-2.5 rounded border border-steel/60">
            <span className="text-[9px] text-ash uppercase block">REVERSIBILITY</span>
            <span className="text-success-green font-bold text-sm block mt-0.5">
              {reversibility}
            </span>
            <span className="text-[9px] text-ash block mt-0.5">Zero schema loss</span>
          </div>

          <div className="bg-charcoal p-2.5 rounded border border-steel/60">
            <span className="text-[9px] text-ash uppercase block">BLAST RADIUS</span>
            <span className="text-warning-amber font-bold text-sm block mt-0.5 truncate">
              {blastRadiusCluster}
            </span>
            <span className="text-[9px] text-ash block mt-0.5">{serviceId} only</span>
          </div>

          <div className="bg-charcoal p-2.5 rounded border border-steel/60 col-span-2 sm:col-span-1">
            <span className="text-[9px] text-ash uppercase block">GOVERNANCE ENFORCEMENT</span>
            <span className="text-off-white font-bold text-sm block mt-0.5">
              HUMAN BARRIER
            </span>
            <span className="text-[9px] text-tactical-gold block mt-0.5">Signature required</span>
          </div>
        </div>

        {reason && (
          <div className="mt-4 p-3 rounded bg-charcoal/50 border border-steel/60 text-xs font-sans">
            <span className="font-mono text-[9px] uppercase tracking-widest text-ash block mb-1">
              POLICY JUSTIFICATION:
            </span>
            <p className="text-off-white/90 leading-relaxed">
              {reason}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
