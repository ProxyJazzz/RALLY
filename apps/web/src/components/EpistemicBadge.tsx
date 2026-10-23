import React from 'react'
import { EpistemicLabel } from '../api/client'

export interface EpistemicBadgeProps {
  label: EpistemicLabel
  showDescription?: boolean
}

export const EpistemicBadge: React.FC<EpistemicBadgeProps> = ({
  label,
  showDescription = false,
}) => {
  const getEpistemicConfig = () => {
    switch (label) {
      case 'OBSERVED':
        return {
          marker: '◉',
          colorClass: 'bg-signal-cyan/15 text-signal-cyan border-signal-cyan/40',
          dotClass: 'bg-signal-cyan',
          description: 'Hard observed telemetry fact directly received from monitoring or MCP tool.',
        }
      case 'INFERRED':
        return {
          marker: '◈',
          colorClass: 'bg-tactical-gold/15 text-tactical-gold border-tactical-gold/40',
          dotClass: 'bg-tactical-gold',
          description: 'Autonomous reasoning deduction synthesized across correlated signals.',
        }
      case 'PROPOSED':
        return {
          marker: '▲',
          colorClass: 'bg-warning-amber/15 text-warning-amber border-warning-amber/40',
          dotClass: 'bg-warning-amber',
          description: 'Synthesized remediation action pending human operator approval.',
        }
      case 'APPROVED':
        return {
          marker: '🛡',
          colorClass: 'bg-tactical-gold/25 text-off-white border-tactical-gold/60 font-bold',
          dotClass: 'bg-tactical-gold',
          description: 'Authorized by designated human SRE lead under governance policy.',
        }
      case 'EXECUTED':
        return {
          marker: '⚡',
          colorClass: 'bg-success-green/15 text-success-green border-success-green/40',
          dotClass: 'bg-success-green',
          description: 'Action safely dispatched through governed MCP tool executor.',
        }
      case 'VERIFIED':
        return {
          marker: '✓',
          colorClass: 'bg-success-green/20 text-success-green border-success-green/50 font-bold',
          dotClass: 'bg-success-green',
          description: 'Independently checked post-remediation against baseline error rates.',
        }
      default:
        return {
          marker: '●',
          colorClass: 'bg-charcoal text-ash border-steel',
          dotClass: 'bg-ash',
          description: 'Unclassified forensic artifact.',
        }
    }
  }

  const config = getEpistemicConfig()

  return (
    <div className="inline-flex flex-col">
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider border uppercase ${config.colorClass}`}
      >
        <span className="font-bold select-none">{config.marker}</span>
        <span>{label}</span>
      </span>
      {showDescription && (
        <span className="text-[10px] font-sans text-ash mt-1 leading-snug">
          {config.description}
        </span>
      )}
    </div>
  )
}
