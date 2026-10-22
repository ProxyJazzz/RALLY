import React from 'react'
import { EpistemicLabel, EvidenceItem } from '../api/client'

interface EvidenceLedgerPanelProps {
  evidence: EvidenceItem[]
}

const labelStyles: Record<EpistemicLabel, { bg: string; text: string; border: string }> = {
  OBSERVED: {
    bg: 'bg-rally-info/10',
    text: 'text-rally-info',
    border: 'border-rally-info/30',
  },
  INFERRED: {
    bg: 'bg-rally-warning/10',
    text: 'text-rally-warning',
    border: 'border-rally-warning/30',
  },
  PROPOSED: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
  APPROVED: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  EXECUTED: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  VERIFIED: {
    bg: 'bg-rally-healthy/10',
    text: 'text-rally-healthy',
    border: 'border-rally-healthy/30',
  },
}

export const EvidenceLedgerPanel: React.FC<EvidenceLedgerPanelProps> = ({ evidence }) => {
  return (
    <div className="bg-rally-surface border border-rally-border rounded-lg p-4 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-rally-border mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rally-warning" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-rally-text">
            Evidence Ledger & Reasoning
          </span>
        </div>
        <span className="text-[10px] font-mono text-rally-muted">
          Strict Epistemic Classification
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[360px]">
        {evidence.length === 0 ? (
          <div className="text-xs font-mono text-rally-muted py-6 text-center">
            Evidence ledger empty. Awaiting investigative tool invocations.
          </div>
        ) : (
          evidence.map((item) => {
            const style = labelStyles[item.label] ?? labelStyles.OBSERVED
            return (
              <div
                key={item.evidence_id}
                className="p-2.5 rounded bg-rally-graphite border border-rally-border flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${style.bg} ${style.text} ${style.border}`}
                    >
                      {item.label}
                    </span>
                    <span className="text-xs font-mono text-rally-text font-medium">
                      {item.evidence_id}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-rally-muted">{item.timestamp}</span>
                </div>
                <p className="text-xs text-rally-secondary font-sans leading-relaxed">
                  {item.description}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-mono text-rally-muted">
                  <span>Source: {item.source_tool}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
