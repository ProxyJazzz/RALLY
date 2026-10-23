import React from 'react'
import { EvidenceItem } from '../api/client'
import { EpistemicBadge } from './EpistemicBadge'

interface MetricEvidenceCardProps {
  item: EvidenceItem
  isSelected?: boolean
  onClick?: () => void
}

export const MetricEvidenceCard: React.FC<MetricEvidenceCardProps> = ({
  item,
  isSelected = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-obsidian border rounded p-5 select-none cursor-pointer transition-all ${
        isSelected
          ? 'border-tactical-gold shadow-tactical-gold'
          : 'border-steel hover:border-tactical-gold/40'
      }`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-steel/60">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-widest uppercase text-ash">
            {item.evidence_id} • METRIC SIGNAL
          </span>
        </div>
        <EpistemicBadge label={item.label} />
      </div>

      <div className="mt-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase text-ash tracking-widest">
            HTTP 5XX ERROR RATE SPIKE
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-5xl sm:text-6xl text-crimson leading-none">
              18.4%
            </span>
            <span className="font-mono text-xs text-crimson/80 font-bold uppercase">
              CRITICAL ELEVATION
            </span>
          </div>
          <p className="font-sans text-xs text-off-white/80 mt-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        <div className="text-right shrink-0 bg-charcoal/60 border border-steel/60 p-2.5 rounded">
          <span className="text-[9px] font-mono uppercase text-ash block">SOURCE MCP TOOL</span>
          <span className="text-xs font-mono text-signal-cyan font-bold block mt-0.5">
            {item.source_tool}
          </span>
          <span className="text-[9px] font-mono text-ash block mt-1">
            {item.timestamp}
          </span>
        </div>
      </div>
    </div>
  )
}
