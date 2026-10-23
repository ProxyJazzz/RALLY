import React from 'react'

interface IncidentJourneyProps {
  state: string
}

type StageKey =
  | 'UNDERSTAND'
  | 'INVESTIGATE'
  | 'EVIDENCE'
  | 'HYPOTHESIS'
  | 'PLAN'
  | 'APPROVAL'
  | 'EXECUTE'
  | 'VERIFY'
  | 'RESOLVE'

const STAGES: { key: StageKey; num: string; label: string }[] = [
  { key: 'UNDERSTAND', num: '01', label: 'INCIDENT' },
  { key: 'INVESTIGATE', num: '02', label: 'INVESTIGATE' },
  { key: 'EVIDENCE', num: '03', label: 'EVIDENCE' },
  { key: 'HYPOTHESIS', num: '04', label: 'HYPOTHESIS' },
  { key: 'PLAN', num: '05', label: 'PLAN' },
  { key: 'APPROVAL', num: '06', label: 'APPROVAL' },
  { key: 'EXECUTE', num: '07', label: 'EXECUTE' },
  { key: 'VERIFY', num: '08', label: 'VERIFY' },
  { key: 'RESOLVE', num: '09', label: 'RESOLVE' },
]

export const IncidentJourney: React.FC<IncidentJourneyProps> = ({ state }) => {
  const getStageStatus = (
    stageIdx: number
  ): 'completed' | 'current' | 'warning' | 'critical' | 'future' => {
    if (state === 'IDLE') return 'future'
    if (state === 'RESOLVED') return 'completed'

    let currentIdx = 0
    if (state === 'RECEIVED' || state === 'TRIAGING') currentIdx = 0
    else if (state === 'INVESTIGATING') currentIdx = 1
    else if (state === 'REASONING') currentIdx = 2
    else if (state === 'PLANNING') currentIdx = 4
    else if (state === 'AWAITING_APPROVAL') currentIdx = 5
    else if (state === 'APPROVED' || state === 'EXECUTING') currentIdx = 6
    else if (state === 'VERIFYING') currentIdx = 7
    else if (state === 'RESOLVED') currentIdx = 8

    if (stageIdx < currentIdx) return 'completed'
    if (stageIdx === currentIdx) {
      if (state === 'AWAITING_APPROVAL') return 'warning'
      if (state === 'FAILED') return 'critical'
      return 'current'
    }
    return 'future'
  }

  return (
    <div className="bg-obsidian border border-steel/80 rounded p-4 sm:p-5 select-none">
      {/* Top Section Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-steel/60 text-[10px] font-mono tracking-widest uppercase text-ash">
        <div className="flex items-center gap-2">
          <span className="text-tactical-gold font-mono">◈</span>
          <span className="font-semibold text-off-white">TACTICAL INCIDENT JOURNEY</span>
          <span className="text-steel">|</span>
          <span className="text-tactical-gold font-bold">STATE: {state}</span>
        </div>
        <span className="text-ash">
          {state === 'RESOLVED' ? '9 / 9 STAGES COMPLETED' : 'AUTONOMOUS RUNTIME ACTIVE'}
        </span>
      </div>

      {/* Cinematic Horizontal Pipeline (Desktop) / Vertical progression (Mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
        {STAGES.map((stage, idx) => {
          const status = getStageStatus(idx)

          let markerClasses = 'text-ash border-steel/60 bg-charcoal/40'
          let titleClasses = 'text-ash'
          let numberClasses = 'text-ash/60'

          if (status === 'completed') {
            markerClasses = 'text-success-green border-success-green/60 bg-success-green/10 ring-1 ring-success-green/20'
            titleClasses = 'text-off-white'
            numberClasses = 'text-success-green'
          } else if (status === 'current') {
            markerClasses = 'text-tactical-gold border-tactical-gold bg-tactical-gold/15 ring-2 ring-tactical-gold/30 animate-pulse'
            titleClasses = 'text-tactical-gold font-bold'
            numberClasses = 'text-tactical-gold'
          } else if (status === 'warning') {
            markerClasses = 'text-warning-amber border-warning-amber bg-warning-amber/20 ring-2 ring-warning-amber/40 animate-pulse'
            titleClasses = 'text-warning-amber font-bold'
            numberClasses = 'text-warning-amber'
          } else if (status === 'critical') {
            markerClasses = 'text-crimson border-crimson bg-crimson/20'
            titleClasses = 'text-crimson font-bold'
            numberClasses = 'text-crimson'
          }

          return (
            <div
              key={stage.key}
              className={`p-2.5 rounded border flex flex-col justify-between transition-all ${markerClasses}`}
            >
              <div className="flex items-center justify-between font-mono text-[9px]">
                <span className={`font-bold ${numberClasses}`}>{stage.num}</span>
                {status === 'completed' && <span className="text-success-green font-bold">✓</span>}
                {status === 'current' && <span className="w-1.5 h-1.5 rounded-full bg-tactical-gold animate-ping" />}
                {status === 'warning' && <span className="w-1.5 h-1.5 rounded-full bg-warning-amber animate-pulse" />}
              </div>

              <div className="mt-2">
                <span className={`font-display text-sm tracking-wider block uppercase truncate ${titleClasses}`}>
                  {stage.label}
                </span>
                <span className="text-[9px] font-mono uppercase text-ash/70 block mt-0.5">
                  {status === 'completed'
                    ? 'VERIFIED'
                    : status === 'current'
                    ? 'ACTIVE'
                    : status === 'warning'
                    ? 'GATEWAY'
                    : 'PENDING'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
