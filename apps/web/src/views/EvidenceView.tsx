import React, { useState } from 'react'
import { EvidenceItem, EpistemicLabel } from '../api/client'

interface EvidenceViewProps {
  evidence: EvidenceItem[]
  onNavigate: (route: string) => void
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({ evidence, onNavigate }) => {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(
    evidence.length > 0 ? evidence[0] : null
  )

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
    <div className="space-y-3 font-mono">
      {/* Workspace Header */}
      <div className="bg-rally-surface border border-rally-border rounded p-3.5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-rally-text uppercase tracking-wider">
              EVIDENCE INVESTIGATION WORKSPACE
            </h1>
            <span className="px-2 py-0.2 rounded-sm text-xs bg-rally-cyan/15 text-rally-cyan border border-rally-cyan/30">
              {evidence.length} ARTIFACTS
            </span>
          </div>
          <p className="text-xs text-rally-secondary font-sans mt-0.5">
            Strict epistemic provenance classification distinguishing observed facts from autonomous inferences and proposals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/hypotheses')}
            className="px-2.5 py-1 rounded bg-rally-bg border border-rally-border hover:border-rally-blue text-xs text-rally-secondary hover:text-rally-text"
          >
            Hypotheses Matrix →
          </button>
          <button
            onClick={() => onNavigate('/action-plan')}
            className="px-2.5 py-1 rounded bg-rally-bg border border-rally-border hover:border-rally-blue text-xs text-rally-secondary hover:text-rally-text"
          >
            Remediation Plan →
          </button>
        </div>
      </div>

      {evidence.length === 0 ? (
        <div className="bg-rally-surface border border-rally-border rounded p-12 text-center">
          <div className="text-rally-muted text-sm uppercase">AWAITING INVESTIGATION</div>
          <p className="text-xs text-rally-secondary font-sans mt-1">
            No evidence gathered yet. Trigger 'Investigate incident' from Overview or Copilot to collect telemetry artifacts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Evidence Ledger Table (Left/Center) */}
          <div className="lg:col-span-8 bg-rally-surface border border-rally-border rounded p-3">
            <div className="text-[10px] text-rally-muted uppercase pb-2 border-b border-rally-border flex justify-between">
              <span>EVIDENCE TABLE ({evidence.length} RECORDS)</span>
              <span>CLICK TO INSPECT DETAIL</span>
            </div>

            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-rally-border text-[10px] text-rally-muted uppercase">
                    <th className="pb-1.5 min-w-[60px]">TIME</th>
                    <th className="pb-1.5 min-w-[80px]">SOURCE</th>
                    <th className="pb-1.5">OBSERVATION</th>
                    <th className="pb-1.5 text-right min-w-[90px]">CLASSIFICATION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rally-border/60">
                  {evidence.map((item) => {
                    const isSelected = selectedEvidence?.evidence_id === item.evidence_id
                    return (
                      <tr
                        key={item.evidence_id}
                        onClick={() => setSelectedEvidence(item)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-rally-surface-card border-l-2 border-rally-cyan' : 'hover:bg-rally-bg/60'
                        }`}
                      >
                        <td className="py-2 text-[10px] text-rally-muted align-top">{item.timestamp}</td>
                        <td className="py-2 text-[11px] text-rally-cyan align-top">
                          {item.source_tool.replace('get_', '').replace('_', ' ')}
                        </td>
                        <td className="py-2 text-xs text-rally-text font-sans align-top pr-2">
                          {item.description}
                        </td>
                        <td className="py-2 text-right align-top">
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded-sm text-[9px] border uppercase tracking-wider ${getEpistemicBadge(
                              item.label
                            )}`}
                          >
                            {item.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Evidence Inspector Card (Right) */}
          <div className="lg:col-span-4 bg-rally-surface border border-rally-border rounded p-3 flex flex-col justify-between">
            <div>
              <div className="text-[10px] text-rally-muted uppercase pb-2 border-b border-rally-border flex justify-between">
                <span>EVIDENCE INSPECTOR</span>
                <span className="text-rally-cyan">{selectedEvidence?.evidence_id ?? 'SELECT ITEM'}</span>
              </div>

              {selectedEvidence ? (
                <div className="py-3 space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] text-rally-muted uppercase block">CLASSIFICATION</span>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded-sm text-[10px] border uppercase font-bold ${getEpistemicBadge(
                        selectedEvidence.label
                      )}`}
                    >
                      {selectedEvidence.label}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-rally-muted uppercase block">SOURCE TOOL</span>
                    <span className="text-rally-cyan font-bold text-xs mt-0.5 block">
                      {selectedEvidence.source_tool}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-rally-muted uppercase block">TIMESTAMP</span>
                    <span className="text-rally-text text-xs mt-0.5 block">
                      {selectedEvidence.timestamp}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-rally-muted uppercase block">OBSERVATION</span>
                    <p className="text-rally-text text-xs font-sans mt-0.5 leading-relaxed bg-rally-bg p-2 rounded border border-rally-border">
                      {selectedEvidence.description}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-rally-muted uppercase block">PAYLOAD DETAILS</span>
                    <pre className="text-[10px] text-rally-secondary bg-rally-bg p-2 rounded border border-rally-border overflow-x-auto max-h-[140px]">
                      {Object.keys(selectedEvidence.details ?? {}).length > 0
                        ? JSON.stringify(selectedEvidence.details, null, 2)
                        : 'No additional metadata payload.'}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-rally-muted">
                  Click any evidence row to inspect full provenance details.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-rally-border text-[10px] text-rally-muted">
              EPISTEMIC STANDARD: Strict provenance verification
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
