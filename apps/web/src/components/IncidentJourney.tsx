import React from 'react'

interface IncidentJourneyProps {
  state: string
}

type StageKey =
  | 'UNDERSTAND'
  | 'INVESTIGATE'
  | 'REASON'
  | 'PLAN'
  | 'APPROVE'
  | 'EXECUTE'
  | 'VERIFY'
  | 'RESOLVE'

const STAGES: StageKey[] = [
  'UNDERSTAND',
  'INVESTIGATE',
  'REASON',
  'PLAN',
  'APPROVE',
  'EXECUTE',
  'VERIFY',
  'RESOLVE',
]

export const IncidentJourney: React.FC<IncidentJourneyProps> = ({ state }) => {
  // Determine status for each stage derived directly from real backend state
  const getStageStatus = (stageIdx: number): 'completed' | 'current' | 'warning' | 'critical' | 'future' => {
    if (state === 'IDLE') return 'future'

    if (state === 'RESOLVED') {
      return 'completed'
    }

    let currentIdx = 0
    if (state === 'RECEIVED' || state === 'TRIAGING') currentIdx = 0
    else if (state === 'INVESTIGATING') currentIdx = 1
    else if (state === 'REASONING') currentIdx = 2
    else if (state === 'PLANNING') currentIdx = 3
    else if (state === 'AWAITING_APPROVAL') currentIdx = 4
    else if (state === 'APPROVED' || state === 'EXECUTING') currentIdx = 5
    else if (state === 'VERIFYING') currentIdx = 6
    else if (state === 'RESOLVED') currentIdx = 7

    if (stageIdx < currentIdx) return 'completed'
    if (stageIdx === currentIdx) {
      if (state === 'AWAITING_APPROVAL') return 'warning'
      if (state === 'FAILED') return 'critical'
      return 'current'
    }
    return 'future'
  }

  return (
    <div className="bg-rally-surface border border-rally-border rounded p-3 select-none flex flex-col justify-between">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase text-rally-muted tracking-wider mb-2">
        <span className="flex items-center gap-1.5">
          <span>INCIDENT LIFECYCLE PIPELINE</span>
          <span className="text-rally-secondary">•</span>
          <span className="text-rally-cyan font-bold">{state}</span>
        </span>
        <span className="text-rally-secondary">
          {state === 'RESOLVED' ? '8 / 8 COMPLETED' : 'PROGRESS MONITORED'}
        </span>
      </div>

      {/* Connected Nodes Pipeline: ●━━━━●━━━━●━━━━◉━━━━○ */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
        {STAGES.map((stage, idx) => {
          const status = getStageStatus(idx)
          const isLast = idx === STAGES.length - 1

          let nodeDot = 'bg-rally-muted text-rally-muted'
          let nodeBox = 'border-rally-border bg-rally-bg text-rally-muted'
          let lineBg = 'bg-rally-border'

          if (status === 'completed') {
            nodeDot = 'bg-rally-green text-rally-green ring-2 ring-rally-green/20'
            nodeBox = 'border-rally-green/50 bg-rally-green/10 text-rally-green font-bold'
            lineBg = 'bg-rally-green'
          } else if (status === 'current') {
            nodeDot = 'bg-rally-blue text-rally-blue ring-4 ring-rally-blue/30 animate-pulse'
            nodeBox = 'border-rally-blue bg-rally-blue/15 text-rally-blue font-bold shadow-sm'
            lineBg = 'bg-rally-border'
          } else if (status === 'warning') {
            nodeDot = 'bg-rally-amber text-rally-amber ring-4 ring-rally-amber/30 animate-ping'
            nodeBox = 'border-rally-amber bg-rally-amber/20 text-rally-amber font-bold'
            lineBg = 'bg-rally-border'
          } else if (status === 'critical') {
            nodeDot = 'bg-rally-red text-rally-red ring-2 ring-rally-red/20'
            nodeBox = 'border-rally-red bg-rally-red/20 text-rally-red font-bold'
            lineBg = 'bg-rally-border'
          }

          return (
            <React.Fragment key={stage}>
              <div className="flex flex-col items-center min-w-[76px] flex-1">
                {/* Node indicator */}
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center mb-1.5 transition-all ${nodeDot}`}>
                  {status === 'completed' && <span className="text-[8px] font-bold text-black">✓</span>}
                </div>

                {/* Stage Label Box */}
                <div className={`w-full py-1 rounded-sm border text-center transition-all ${nodeBox}`}>
                  <span className="text-[10px] font-mono tracking-wider block truncate px-1">
                    {stage}
                  </span>
                </div>
              </div>

              {/* Connecting rail line */}
              {!isLast && (
                <div className={`h-0.5 flex-1 min-w-[12px] mx-1 self-center -mt-6 transition-all ${lineBg}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
