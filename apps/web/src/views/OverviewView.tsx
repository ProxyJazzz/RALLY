import React from 'react'
import { AlexaSimulationState } from '../api/client'
import { IncidentHero } from '../components/IncidentHero'
import { RecoverySummary } from '../components/RecoverySummary'
import { IncidentJourney } from '../components/IncidentJourney'
import { ForensicFinding } from '../components/ForensicFinding'
import { CommandMetric } from '../components/CommandMetric'
import { ErrorRateChart } from '../components/ErrorRateChart'
import { BlastRadiusVisual } from '../components/BlastRadiusVisual'
import { AgentActivity } from '../components/AgentActivity'
import { MCPActivity } from '../components/MCPActivity'
import { GovernanceApprovalPanel } from '../components/GovernanceApprovalPanel'

interface OverviewViewProps {
  state: AlexaSimulationState | null
  activeState: string
  isProcessing: boolean
  numericErrorRate: number
  isResolved: boolean
  onInvestigate: () => void
  onReset: () => void
  onApprove: () => void
  onReject: () => void
  onNavigate: (route: string) => void
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  state,
  activeState,
  isProcessing,
  numericErrorRate,
  isResolved,
  onInvestigate,
  onReset,
  onApprove,
  onReject,
  onNavigate,
}) => {
  const isAwaitingApproval = activeState === 'AWAITING_APPROVAL'

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* ── 1. CINEMATIC HERO SECTION (Active Incident vs. Recovery Summary) ── */}
      {isResolved ? (
        <RecoverySummary
          onReset={onReset}
          isProcessing={isProcessing}
          onNavigate={onNavigate}
        />
      ) : (
        <IncidentHero
          state={activeState}
          serviceId={state?.service_id ?? 'checkout-service'}
          activeDeployment={state?.active_deployment ?? 'checkout-v42'}
          errorRate={numericErrorRate}
          baseline={0.7}
          confidence={state?.confidence}
          primaryHypothesis={state?.primary_hypothesis}
          onInvestigate={onInvestigate}
          onReset={onReset}
          isProcessing={isProcessing}
          onNavigate={onNavigate}
        />
      )}

      {/* ── 2. FORENSIC FINDING CALLOUT ────────────────────────────────────── */}
      <ForensicFinding
        primaryHypothesis={state?.primary_hypothesis}
        confidence={state?.confidence}
        deployment={state?.active_deployment ?? 'checkout-v42'}
        state={activeState}
        onViewHypotheses={() => onNavigate('/hypotheses')}
      />

      {/* ── 3. TACTICAL INCIDENT JOURNEY ───────────────────────────────────── */}
      <IncidentJourney state={activeState} />

      {/* ── 4. COMMAND CENTER TELEMETRY METRICS STRIP ──────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 border border-steel/80 rounded bg-obsidian divide-y sm:divide-y-0 sm:divide-x divide-steel/60">
        <CommandMetric
          index="01"
          label="ACTIVE INCIDENTS"
          value={isResolved ? "0" : "1"}
          statusColor={isResolved ? "green" : "crimson"}
          subtext={isResolved ? "All cleared" : "SEV-2 checkout"}
        />
        <CommandMetric
          index="02"
          label="CURRENT ERROR RATE"
          value={isResolved ? "0.7" : numericErrorRate.toFixed(1)}
          unit="%"
          statusColor={isResolved ? "green" : "crimson"}
          subtext={isResolved ? "Baseline healthy" : "Spike observed"}
        />
        <CommandMetric
          index="03"
          label="AUTONOMOUS DEDUCTION"
          value={Math.round((state?.confidence ?? 0.95) * 100)}
          unit="%"
          statusColor="gold"
          subtext="Model confidence"
        />
        <CommandMetric
          index="04"
          label="EVIDENCE LEDGER"
          value={state?.evidence?.length ?? 5}
          unit="items"
          statusColor="cyan"
          subtext="Telemetry & diffs"
        />
        <CommandMetric
          index="05"
          label="GOVERNANCE GATE"
          value={isAwaitingApproval ? "PAUSED" : isResolved ? "SEALED" : "READY"}
          statusColor={isAwaitingApproval ? "amber" : isResolved ? "green" : "default"}
          subtext={isAwaitingApproval ? "Action required" : "Rollback locked"}
        />
        <CommandMetric
          index="06"
          label="SYSTEM INTEGRITY"
          value={isResolved ? "HEALTHY" : "DEGRADED"}
          statusColor={isResolved ? "green" : "crimson"}
          subtext="1 node affected"
        />
      </div>

      {/* ── 5. ASYMMETRIC BENTO GRID: Telemetry Sparkline & Blast Radius ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <ErrorRateChart
            currentRate={numericErrorRate}
            baseline={0.7}
            isRecovered={isResolved}
          />
        </div>
        <div className="lg:col-span-5">
          <BlastRadiusVisual
            activeDeployment={state?.active_deployment ?? 'checkout-v42'}
            isRecovered={isResolved}
            errorRate={numericErrorRate}
          />
        </div>
      </div>

      {/* ── 6. AGENT ACTIVITY & MCP INVOCATIONS ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <AgentActivity
            timeline={state?.timeline ?? []}
            state={activeState}
            isProcessing={isProcessing}
          />
        </div>
        <div className="lg:col-span-6">
          <MCPActivity
            state={activeState}
            isProcessing={isProcessing}
          />
        </div>
      </div>

      {/* ── 7. GOVERNANCE APPROVAL BARRIER (When Action Plan primed) ────────── */}
      {state?.action_plan && (
        <div className="pt-2">
          <GovernanceApprovalPanel
            plan={state.action_plan}
            execVerif={
              state.execution_verification ?? {
                execution_status: 'NOT_EXECUTED',
                verification_status: 'PENDING',
              }
            }
            state={activeState}
            onApprove={onApprove}
            onReject={onReject}
            isProcessing={isProcessing}
          />
        </div>
      )}
    </div>
  )
}
