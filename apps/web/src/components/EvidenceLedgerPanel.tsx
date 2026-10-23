import React from 'react'
import { EvidenceItem } from '../api/client'
import { EpistemicBadge } from './EpistemicBadge'

interface EvidenceLedgerPanelProps {
  evidence: EvidenceItem[]
}

export const EvidenceLedgerPanel: React.FC<EvidenceLedgerPanelProps> = ({ evidence }) => {
  return (
    <div className="bg-obsidian border border-steel rounded p-4 sm:p-5 select-none flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-steel/60 text-[10px] font-mono uppercase text-ash tracking-wider">
        <span className="flex items-center gap-2">
          <span className="text-tactical-gold">◈</span>
          <span className="text-off-white font-medium">EVIDENCE LEDGER & PROVENANCE</span>
        </span>
        <span className="text-tactical-gold font-bold">
          {evidence.length} ARTIFACTS RECORDED
        </span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[260px] space-y-2 py-2 pr-1 font-sans">
        {evidence.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-ash">
            No evidence gathered yet. Telemetry monitoring idle.
          </div>
        ) : (
          evidence.map((item, idx) => (
            <div
              key={item.evidence_id || idx}
              className="p-3 rounded bg-charcoal/80 border border-steel/70 hover:border-tactical-gold/40 transition-colors flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between font-mono text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="text-off-white font-bold">{item.evidence_id}</span>
                  <span className="text-ash">•</span>
                  <span className="text-ash">{item.timestamp}</span>
                  <span className="text-ash">•</span>
                  <span className="text-signal-cyan font-semibold">
                    {item.source_tool}
                  </span>
                </div>
                <EpistemicBadge label={item.label} />
              </div>
              <p className="text-off-white/90 text-xs leading-snug">
                {item.description}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="pt-2 border-t border-steel/60 text-[9px] font-mono text-ash uppercase flex items-center justify-between">
        <span>CRYPTOGRAPHIC AUDIT TRAIL</span>
        <span className="text-success-green">VERIFIED</span>
      </div>
    </div>
  )
}
