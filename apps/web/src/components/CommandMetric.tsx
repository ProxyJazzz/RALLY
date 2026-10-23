import React from 'react'

interface CommandMetricProps {
  index: string
  label: string
  value: string | number
  unit?: string
  subtext?: string
  statusColor?: 'gold' | 'crimson' | 'green' | 'amber' | 'cyan' | 'default'
}

export const CommandMetric: React.FC<CommandMetricProps> = ({
  index,
  label,
  value,
  unit,
  subtext,
  statusColor = 'default',
}) => {
  const getColorClasses = () => {
    switch (statusColor) {
      case 'gold':
        return 'text-tactical-gold'
      case 'crimson':
        return 'text-crimson'
      case 'green':
        return 'text-success-green'
      case 'amber':
        return 'text-warning-amber'
      case 'cyan':
        return 'text-signal-cyan'
      case 'default':
      default:
        return 'text-off-white'
    }
  }

  return (
    <div className="flex flex-col py-3 px-3 sm:px-4 bg-obsidian/60 border-l border-steel/60 hover:bg-charcoal/40 transition-colors">
      <div className="flex items-center justify-between text-[10px] font-mono text-ash tracking-widest uppercase">
        <span>{label}</span>
        <span className="text-ash/50">{index}</span>
      </div>

      <div className="flex items-baseline gap-1 mt-1">
        <span className={`font-display text-3xl sm:text-4xl tracking-tight leading-none ${getColorClasses()}`}>
          {value}
        </span>
        {unit && (
          <span className="font-mono text-xs text-ash/80">
            {unit}
          </span>
        )}
      </div>

      {subtext && (
        <span className="text-[11px] font-mono text-ash truncate mt-1">
          {subtext}
        </span>
      )}
    </div>
  )
}
