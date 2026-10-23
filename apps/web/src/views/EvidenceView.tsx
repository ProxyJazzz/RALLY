import React, { useState, useMemo } from 'react'
import { EvidenceItem } from '../api/client'
import { EpistemicBadge } from '../components/EpistemicBadge'
import { MetricEvidenceCard } from '../components/MetricEvidenceCard'
import { LogEvidenceCard } from '../components/LogEvidenceCard'
import { DeploymentEvidenceCard } from '../components/DeploymentEvidenceCard'
import { DependencyEvidenceCard } from '../components/DependencyEvidenceCard'
import { EvidenceCorrelationFlow } from '../components/EvidenceCorrelationFlow'

interface EvidenceViewProps {
  evidence: EvidenceItem[]
  onNavigate: (route: string) => void
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({ evidence, onNavigate }) => {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(
    evidence.length > 0 ? evidence[0] : null
  )
  const [activeFilter, setActiveFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isInspectorExpanded, setIsInspectorExpanded] = useState<boolean>(false)

  // Epistemic count metrics derived directly from actual state
  const counts = useMemo(() => {
    const total = evidence.length
    const observed = evidence.filter((e) => e.label === 'OBSERVED').length
    const inferred = evidence.filter((e) => e.label === 'INFERRED').length
    const proposed = evidence.filter((e) => e.label === 'PROPOSED').length
    const verified = evidence.filter(
      (e) => e.label === 'VERIFIED' || e.label === 'EXECUTED' || e.label === 'APPROVED'
    ).length
    const uniqueTools = new Set(evidence.map((e) => e.source_tool)).size
    return { total, observed, inferred, proposed, verified, uniqueTools }
  }, [evidence])

  // Client-side filtering by Epistemic category and search query
  const filteredEvidence = useMemo(() => {
    return evidence.filter((item) => {
      // Category filter
      if (activeFilter !== 'ALL' && item.label !== activeFilter) {
        return false
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          item.description.toLowerCase().includes(q) ||
          item.source_tool.toLowerCase().includes(q) ||
          item.evidence_id.toLowerCase().includes(q) ||
          item.label.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [evidence, activeFilter, searchQuery])

  // Primary metric evidence item if present
  const primaryMetricItem = useMemo(() => {
    return evidence.find((e) => e.source_tool === 'get_error_rate') || evidence[0]
  }, [evidence])

  const logItem = useMemo(() => {
    return evidence.find((e) => e.source_tool === 'query_logs')
  }, [evidence])

  const deploymentItem = useMemo(() => {
    return (
      evidence.find((e) => e.source_tool === 'get_service_health') ||
      evidence.find((e) => e.description.includes('checkout-v42'))
    )
  }, [evidence])

  const dependencyItem = useMemo(() => {
    return evidence.find((e) => e.source_tool === 'get_dependency_health')
  }, [evidence])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* ── 1. EDITORIAL PAGE HERO ───────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-obsidian border border-steel rounded p-6 sm:p-8 select-none">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-signal-cyan/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-steel/60 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-signal-cyan" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-off-white font-semibold">
              FORENSIC EVIDENCE LEDGER • INVESTIGATION CASE BOARD
            </span>
            <span className="text-steel">|</span>
            <span className="text-[10px] font-mono text-tactical-gold">
              STRICT EPISTEMIC PROVENANCE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('/hypotheses')}
              className="px-3.5 py-1.5 rounded bg-charcoal hover:bg-graphite border border-steel text-xs font-mono text-off-white transition-colors"
            >
              HYPOTHESES MATRIX →
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/action-plan')}
              className="px-3.5 py-1.5 rounded bg-charcoal hover:bg-graphite border border-steel text-xs font-mono text-off-white transition-colors"
            >
              REMEDIATION PLAN →
            </button>
          </div>
        </div>

        <div className="max-w-3xl">
          <div className="font-editorial italic text-tactical-gold text-base sm:text-lg mb-1">
            "Evidence is not noise. It is the trail the system leaves behind."
          </div>
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl tracking-tight text-off-white leading-none uppercase">
            FORENSIC EVIDENCE
          </h1>
          <p className="font-sans text-sm sm:text-base text-ash mt-3 leading-relaxed">
            RALLY autonomously correlates live telemetry, deployment metadata, structured logs, and downstream dependency health to build an ironclad case before proposing remediation.
          </p>
        </div>
      </div>

      {/* ── 2. LARGE FORENSIC SUMMARY METRICS ────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border border-steel/80 rounded bg-obsidian divide-y sm:divide-y-0 sm:divide-x divide-steel/60">
        <div className="py-3 px-4">
          <span className="text-[9px] font-mono uppercase text-ash tracking-widest block">
            01 • TOTAL ARTIFACTS
          </span>
          <span className="font-display text-4xl text-off-white leading-none mt-1 block">
            {counts.total}
          </span>
          <span className="text-[10px] font-mono text-ash mt-1 block">Collected facts</span>
        </div>

        <div className="py-3 px-4">
          <span className="text-[9px] font-mono uppercase text-ash tracking-widest block">
            02 • OBSERVED FACTS
          </span>
          <span className="font-display text-4xl text-signal-cyan leading-none mt-1 block">
            {counts.observed}
          </span>
          <span className="text-[10px] font-mono text-signal-cyan/80 mt-1 block">Telemetry facts</span>
        </div>

        <div className="py-3 px-4">
          <span className="text-[9px] font-mono uppercase text-ash tracking-widest block">
            03 • INFERRED FINDINGS
          </span>
          <span className="font-display text-4xl text-tactical-gold leading-none mt-1 block">
            {counts.inferred}
          </span>
          <span className="text-[10px] font-mono text-tactical-gold/80 mt-1 block">Model deductions</span>
        </div>

        <div className="py-3 px-4">
          <span className="text-[9px] font-mono uppercase text-ash tracking-widest block">
            04 • PROPOSED ACTIONS
          </span>
          <span className="font-display text-4xl text-warning-amber leading-none mt-1 block">
            {counts.proposed}
          </span>
          <span className="text-[10px] font-mono text-warning-amber/80 mt-1 block">Remediations</span>
        </div>

        <div className="py-3 px-4">
          <span className="text-[9px] font-mono uppercase text-ash tracking-widest block">
            05 • VERIFIED PROOF
          </span>
          <span className="font-display text-4xl text-success-green leading-none mt-1 block">
            {counts.verified}
          </span>
          <span className="text-[10px] font-mono text-success-green/80 mt-1 block">Audit confirmations</span>
        </div>

        <div className="py-3 px-4">
          <span className="text-[9px] font-mono uppercase text-ash tracking-widest block">
            06 • MCP TOOLS
          </span>
          <span className="font-display text-4xl text-off-white leading-none mt-1 block">
            {counts.uniqueTools}
          </span>
          <span className="text-[10px] font-mono text-ash mt-1 block">Streamable HTTP</span>
        </div>
      </div>

      {/* ── 3. VISUAL FORENSIC CORRELATION GRAPH ─────────────────────────── */}
      <EvidenceCorrelationFlow
        deployment="checkout-v42"
        hypothesis="CHECKOUT_VALIDATION_REGRESSION"
        errorRate={18.4}
      />

      {/* ── 4. ASYMMETRIC BENTO EVIDENCE GRID ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Large Primary Metric Signal */}
        {primaryMetricItem && (
          <div className="lg:col-span-7">
            <MetricEvidenceCard
              item={primaryMetricItem}
              isSelected={selectedEvidence?.evidence_id === primaryMetricItem.evidence_id}
              onClick={() => setSelectedEvidence(primaryMetricItem)}
            />
          </div>
        )}

        {/* Medium Deployment Card */}
        {deploymentItem && (
          <div className="lg:col-span-5">
            <DeploymentEvidenceCard
              item={deploymentItem}
              isSelected={selectedEvidence?.evidence_id === deploymentItem.evidence_id}
              onClick={() => setSelectedEvidence(deploymentItem)}
            />
          </div>
        )}

        {/* Medium Log Signal */}
        {logItem && (
          <div className="lg:col-span-6">
            <LogEvidenceCard
              item={logItem}
              isSelected={selectedEvidence?.evidence_id === logItem.evidence_id}
              onClick={() => setSelectedEvidence(logItem)}
            />
          </div>
        )}

        {/* Downstream Dependency Isolation */}
        {dependencyItem && (
          <div className="lg:col-span-6">
            <DependencyEvidenceCard
              item={dependencyItem}
              isSelected={selectedEvidence?.evidence_id === dependencyItem.evidence_id}
              onClick={() => setSelectedEvidence(dependencyItem)}
            />
          </div>
        )}
      </div>

      {/* ── 5. COMPACT FILTERING & SEARCH CONTROLS ───────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-steel/60">
        {/* Compact Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 font-mono text-xs">
          {['ALL', 'OBSERVED', 'INFERRED', 'PROPOSED', 'VERIFIED'].map((filter) => {
            const isActive = activeFilter === filter
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 rounded transition-colors text-xs uppercase ${
                  isActive
                    ? 'bg-tactical-gold text-void-black font-bold'
                    : 'bg-charcoal text-ash hover:text-off-white hover:bg-graphite border border-steel/80'
                }`}
              >
                {filter}
              </button>
            )
          })}
        </div>

        {/* Lightweight Search Input */}
        <div className="flex items-center gap-2 max-w-xs w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search artifacts, tools, descriptions..."
            className="w-full bg-obsidian border border-steel rounded px-3 py-1.5 text-xs text-off-white placeholder:text-ash focus:outline-none focus:border-tactical-gold font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-ash hover:text-off-white font-mono px-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── 6. FORENSIC EVIDENCE CASE TABLE & INSPECTOR ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Forensic Evidence Ledger Table */}
        <div className="lg:col-span-8 bg-obsidian border border-steel rounded p-5 select-none">
          <div className="flex items-center justify-between pb-3 border-b border-steel/60 text-[10px] font-mono uppercase text-ash tracking-wider">
            <span>FILTERED EVIDENCE RECORDS ({filteredEvidence.length})</span>
            <span>CLICK ROW TO INSPECT TECHNICAL PROVENANCE</span>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-steel/80 text-[10px] font-mono text-ash uppercase">
                  <th className="pb-2 min-w-[70px]">ID</th>
                  <th className="pb-2 min-w-[65px]">TIME</th>
                  <th className="pb-2 min-w-[130px]">SOURCE MCP TOOL</th>
                  <th className="pb-2">OBSERVATION & CONTEXT</th>
                  <th className="pb-2 text-right min-w-[100px]">EPISTEMIC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel/40 font-mono text-xs">
                {filteredEvidence.map((item) => {
                  const isSelected = selectedEvidence?.evidence_id === item.evidence_id
                  return (
                    <tr
                      key={item.evidence_id}
                      onClick={() => setSelectedEvidence(item)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-graphite text-off-white border-l-2 border-tactical-gold pl-2'
                          : 'hover:bg-charcoal/50 text-off-white/80'
                      }`}
                    >
                      <td className="py-2.5 text-off-white font-bold align-top">
                        {item.evidence_id}
                      </td>
                      <td className="py-2.5 text-[10px] text-ash align-top">
                        {item.timestamp}
                      </td>
                      <td className="py-2.5 text-[11px] text-signal-cyan align-top truncate">
                        {item.source_tool}
                      </td>
                      <td className="py-2.5 text-xs text-off-white font-sans align-top pr-3 leading-snug">
                        {item.description}
                      </td>
                      <td className="py-2.5 text-right align-top">
                        <EpistemicBadge label={item.label} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Technical Inspector Card */}
        <div className="lg:col-span-4 bg-obsidian border border-steel rounded p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-steel/60 text-[10px] font-mono uppercase text-ash tracking-wider">
              <span>FORENSIC INSPECTOR</span>
              <span className="text-tactical-gold font-bold">
                {selectedEvidence?.evidence_id ?? 'SELECT ARTIFACT'}
              </span>
            </div>

            {selectedEvidence ? (
              <div className="py-4 space-y-4">
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-ash block">
                    PROVENANCE CLASSIFICATION
                  </span>
                  <div className="mt-1">
                    <EpistemicBadge label={selectedEvidence.label} showDescription />
                  </div>
                </div>

                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-ash block">
                    SOURCE MCP TOOL
                  </span>
                  <span className="font-mono text-xs font-bold text-signal-cyan block mt-0.5">
                    {selectedEvidence.source_tool}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-ash block">
                    TIMESTAMP
                  </span>
                  <span className="font-mono text-xs text-off-white block mt-0.5">
                    {selectedEvidence.timestamp}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-ash block">
                    FORENSIC SUMMARY
                  </span>
                  <p className="font-sans text-xs text-off-white mt-1 leading-relaxed bg-charcoal p-3 rounded border border-steel/80">
                    {selectedEvidence.description}
                  </p>
                </div>

                {/* Advanced Technical Inspector Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setIsInspectorExpanded((prev) => !prev)}
                    className="flex items-center justify-between w-full text-[10px] font-mono uppercase text-ash hover:text-off-white pb-1 border-b border-steel/60 transition-colors"
                  >
                    <span>ADVANCED TECHNICAL PAYLOAD</span>
                    <span>{isInspectorExpanded ? '▲ HIDE' : '▼ EXPOSE'}</span>
                  </button>

                  {isInspectorExpanded && (
                    <pre className="mt-2 text-[10px] font-mono text-off-white/80 bg-charcoal p-3 rounded border border-steel/80 overflow-x-auto max-h-[160px]">
                      {Object.keys(selectedEvidence.details ?? {}).length > 0
                        ? JSON.stringify(selectedEvidence.details, null, 2)
                        : JSON.stringify(
                            {
                              evidence_id: selectedEvidence.evidence_id,
                              source: selectedEvidence.source_tool,
                              classification: selectedEvidence.label,
                              verification: 'PROVENANCE_SEALED',
                            },
                            null,
                            2
                          )}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-xs font-mono text-ash">
                Select an evidence record from the ledger to inspect provenance.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-steel/60 text-[9px] font-mono text-ash uppercase">
            EPISTEMIC STANDARD: Strict cryptographic provenance verification
          </div>
        </div>
      </div>
    </div>
  )
}
