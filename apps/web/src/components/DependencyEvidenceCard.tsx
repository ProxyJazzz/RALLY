import React from 'react'
import { EvidenceItem } from '../api/client'
import { EpistemicBadge } from './EpistemicBadge'

interface DependencyEvidenceCardProps {
  item: EvidenceItem
  isSelected?: boolean
  onClick?: () => void
}

export const DependencyEvidenceCard: React.FC<DependencyEvidenceCardProps> = ({
  item,
  isSelected = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-obsidian border rounded p-5 select-none cursor-pointer transition-all flex flex-col justify-between ${
        isSelected
          ? 'border-tactical-gold shadow-tactical-gold'
          : 'border-steel hover:border-tactical-gold/40'
      }`}
    >
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-steel/60">
          <span className="text-[10px] font-mono tracking-widest uppercase text-ash">
            {item.evidence_id} • DEPENDENCY TOPOLOGY
          </span>
          <EpistemicBadge label={item.label} />
        </div>

        <div className="mt-3">
          <span className="text-[10px] font-mono text-success-green uppercase tracking-wider font-semibold block">
            ✓ DOWNSTREAM HEALTH ISOLATION
          </span>
          <p className="font-sans text-xs text-off-white mt-1 leading-snug">
            {item.description}
          </p>
        </div>

        {/* Downstream status chips */}
        <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[10px]">
          <div className="bg-charcoal p-2 rounded border border-steel/80 text-center">
            <span className="text-ash block uppercase text-[8px]">PAYMENT</span>
            <span className="text-success-green font-bold block mt-0.5">HEALTHY</span>
          </div>
          <div className="bg-charcoal p-2 rounded border border-steel/80 text-center">
            <span className="text-ash block uppercase text-[8px]">INVENTORY</span>
            <span className="text-success-green font-bold block mt-0.5">HEALTHY</span>
          </div>
          <div className="bg-charcoal p-2 rounded border border-steel/80 text-center">
            <span className="text-ash block uppercase text-[8px]">AUTH</span>
            <span className="text-success-green font-bold block mt-0.5">HEALTHY</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-steel/60 flex items-center justify-between text-[10px] font-mono text-ash">
        <span className="text-signal-cyan">{item.source_tool}</span>
        <span>{item.timestamp}</span>
      </div>
    </div>
  )
}
