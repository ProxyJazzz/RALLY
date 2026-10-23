import React from 'react'
import { EvidenceItem } from '../api/client'
import { EpistemicBadge } from './EpistemicBadge'

interface DeploymentEvidenceCardProps {
  item: EvidenceItem
  isSelected?: boolean
  onClick?: () => void
}

export const DeploymentEvidenceCard: React.FC<DeploymentEvidenceCardProps> = ({
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
            {item.evidence_id} • DEPLOYMENT STATE
          </span>
          <EpistemicBadge label={item.label} />
        </div>

        <div className="mt-3">
          <span className="text-[10px] font-mono text-tactical-gold uppercase tracking-wider font-semibold block">
            ◈ RELEASE CORRELATION
          </span>
          <p className="font-sans text-xs text-off-white mt-1 leading-snug">
            {item.description}
          </p>
        </div>

        {/* Release Version Transition Visual */}
        <div className="mt-4 p-3 rounded bg-charcoal border border-steel/80 flex items-center justify-between font-mono text-xs">
          <div>
            <span className="text-[9px] text-ash block uppercase">STABLE RELEASE</span>
            <span className="text-success-green font-bold text-sm block mt-0.5">
              checkout-v41
            </span>
          </div>
          <span className="text-ash text-sm">→</span>
          <div>
            <span className="text-[9px] text-ash block uppercase">ACTIVE RELEASE</span>
            <span className="text-crimson font-bold text-sm block mt-0.5">
              checkout-v42
            </span>
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
