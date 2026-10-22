import React from 'react'
import { AlexaSimulationState } from '../api/client'
import { IncidentHero } from '../components/IncidentHero'
import { IncidentJourney } from '../components/IncidentJourney'
import { ErrorRateChart } from '../components/ErrorRateChart'
import { ServiceTopology } from '../components/ServiceTopology'
import { AgentActivity } from '../components/AgentActivity'
import { MCPActivity } from '../components/MCPActivity'
import { HypothesisPanel } from '../components/HypothesisPanel'
import { GovernanceApprovalPanel } from '../components/GovernanceApprovalPanel'
import { InvestigationTimeline } from '../components/InvestigationTimeline'
import { EvidenceLedgerPanel } from '../components/EvidenceLedgerPanel'

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
  return (
    <div className="space-y-3 font-mono">
      {/* 1. Incident Hero Banner & Telemetry Strip */}
      <IncidentHero
        state={activeState}
        serviceId={state?.service_id ?? 'checkout-service'}
        activeDeployment={state?.active_deployment ?? 'checkout-v42'}
        errorRate={numericErrorRate}
        baseline={0.7}
        onInvestigate={onInvestigate}
        onReset={onReset}
        isProcessing={isProcessing}
      />

      {/* 2. Connected Incident Journey Timeline */}
      <IncidentJourney state={activeState} />

      {/* Cross-navigation bar */}
      <div className="p-2 rounded bg-rally-surface border border-rally-border flex items-center justify-between text-xs">
        <span className="text-[10px] text-rally-muted uppercase">WORKSPACES:</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onNavigate('/incident')}
            className="px-2 py-0.5 rounded-sm bg-rally-bg border border-rally-border hover:border-rally-blue text-rally-secondary hover:text-rally-text text-[10px]"
          >
            Incident Detail →
          </button>
          <button
            onClick={() => onNavigate('/evidence')}
            className="px-2 py-0.5 rounded-sm bg-rally-bg border border-rally-border hover:border-rally-blue text-rally-secondary hover:text-rally-text text-[10px]"
          >
            Evidence Ledger ({state?.evidence?.length ?? 0}) →
          </button>
          <button
            onClick={() => onNavigate('/hypotheses')}
            className="px-2 py-0.5 rounded-sm bg-rally-bg border border-rally-border hover:border-rally-blue text-rally-secondary hover:text-rally-text text-[10px]"
          >
            Root Cause Matrix →
          </button>
          <button
            onClick={() => onNavigate('/approval')}
            className="px-2 py-0.5 rounded-sm bg-rally-bg border border-rally-border hover:border-rally-amber text-rally-secondary hover:text-rally-text text-[10px]"
          >
            Governance Gate →
          </button>
          <button
            onClick={() => onNavigate('/services')}
            className="px-2 py-0.5 rounded-sm bg-rally-bg border border-rally-border hover:border-rally-cyan text-rally-secondary hover:text-rally-text text-[10px]"
          >
            Services Topology →
          </button>
        </div>
      </div>

      {/* 3. Live Telemetry Graph & Service Dependency Topology */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <div className="xl:col-span-7">
          <ErrorRateChart
            currentRate={numericErrorRate}
            baseline={0.7}
            isRecovered={isResolved}
          />
        </div>
        <div className="xl:col-span-5">
          <ServiceTopology
            activeDeployment={state?.active_deployment ?? 'checkout-v42'}
            isRecovered={isResolved}
            mcpActive={isProcessing}
          />
        </div>
      </div>

      {/* 4. Agent Activity & MCP Calls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AgentActivity
          timeline={state?.timeline ?? []}
          state={activeState}
          isProcessing={isProcessing}
        />
        <MCPActivity
          state={activeState}
          isProcessing={isProcessing}
        />
      </div>

      {/* 5. Hypotheses & Change Control */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <HypothesisPanel
          primaryHypothesis={state?.primary_hypothesis}
          confidence={state?.confidence}
          state={activeState}
        />
        <GovernanceApprovalPanel
          plan={state?.action_plan}
          execVerif={
            state?.execution_verification ?? {
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

      {/* 6. Timeline & Evidence Ledger */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InvestigationTimeline
          timeline={state?.timeline ?? []}
          state={activeState}
        />
        <EvidenceLedgerPanel evidence={state?.evidence ?? []} />
      </div>
    </div>
  )
}
