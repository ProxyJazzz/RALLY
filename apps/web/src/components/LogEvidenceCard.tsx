import React from 'react'
import { EvidenceItem } from '../api/client'
import { EpistemicBadge } from './EpistemicBadge'

interface LogEvidenceCardProps {
  item: EvidenceItem
  isSelected?: boolean
  onClick?: () => void
}

export const LogEvidenceCard: React.FC<LogEvidenceCardProps> = ({
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
            {item.evidence_id} • LOG TELEMETRY
          </span>
          <EpistemicBadge label={item.label} />
        </div>

        <div className="mt-3">
          <span className="text-[10px] font-mono text-crimson uppercase tracking-wider font-semibold block">
            ● ERROR LOG DETECTED
          </span>
          <p className="font-sans text-xs text-off-white mt-1 leading-snug">
            {item.description}
          </p>
        </div>

        {/* Syntax formatted code block */}
        <div className="mt-3 p-2.5 rounded bg-charcoal border border-steel/80 font-mono text-[11px] text-off-white/90 overflow-x-auto">
          <div className="text-ash text-[9px] mb-1">STDOUT / order_validator.py:142</div>
          <div className="text-crimson font-bold">
            SchemaValidationError: Missing required 'payment_method'
          </div>
          <div className="text-ash text-[10px] mt-0.5">
            checkout-service (pid 41) dropped cart session
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
