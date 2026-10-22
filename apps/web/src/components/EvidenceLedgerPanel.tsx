import React from 'react'
import { EvidenceItem, EpistemicLabel } from '../api/client'

interface EvidenceLedgerPanelProps {
  evidence: EvidenceItem[]
}

export const EvidenceLedgerPanel: React.FC<EvidenceLedgerPanelProps> = ({ evidence }) => {
  const getEpistemicBadge = (label: EpistemicLabel) => {
    switch (label) {
      case 'OBSERVED':
        return 'bg-rally-surface border-rally-border text-rally-secondary'
      case 'INFERRED':
        return 'bg-rally-blue/15 border-rally-blue/40 text-rally-blue'
      case 'PROPOSED':
        return 'bg-rally-amber/15 border-rally-amber/40 text-rally-amber'
      case 'APPROVED':
        return 'bg-rally-amber/25 border-rally-amber/50 text-rally-amber font-bold'
      case 'EXECUTED':
      case 'VERIFIED':
        return 'bg-rally-green/15 border-rally-green/40 text-rally-green font-bold'
      default:
        return 'bg-rally-surface border-rally-border text-rally-muted'
    }
  }

  return (
    <div className="bg-rally-surface border border-rally-border rounded p-3 select-none flex flex-col justify-between font-mono">
      <div className="flex items-center justify-between pb-1.5 border-b border-rally-border text-[10px] uppercase text-rally-muted tracking-wider">
        <span className="flex items-center gap-1.5">
          <span>EVIDENCE LEDGER & EPISTEMIC STREAM</span>
          <span className="text-rally-cyan bg-rally-cyan/10 border border-rally-cyan/25 px-1 py-0.2 rounded-sm">
            {evidence.length} ITEMS
          </span>
        </span>
        <span className="text-rally-secondary">PROVENANCE CLASSIFIED</span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[220px] space-y-1.5 py-1.5 pr-1">
        {evidence.length === 0 ? (
          <div className="py-8 text-center text-xs text-rally-muted">
            No evidence gathered yet. Telemetry monitoring idle.
          </div>
        ) : (
          evidence.map((item, idx) => (
            <div
              key={item.evidence_id || idx}
              className="p-2 rounded-sm bg-rally-bg border border-rally-border hover:border-rally-border-subtle flex flex-col gap-1 text-[11px]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rally-cyan" />
                  <span className="text-[10px] text-rally-muted">{item.timestamp}</span>
                  <span className="text-rally-text font-semibold uppercase text-[10px]">
                    {item.source_tool.replace('get_', '').replace('_', ' ')}
                  </span>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-sm border uppercase tracking-wider ${getEpistemicBadge(
                    item.label
                  )}`}
                >
                  {item.label}
                </span>
              </div>
              <p className="text-rally-secondary text-xs font-sans pl-3 leading-snug">
                {item.description}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
