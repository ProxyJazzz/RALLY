import React from 'react'

interface ErrorRateChartProps {
  currentRate: number
  baseline?: number
  isRecovered?: boolean
}

export const ErrorRateChart: React.FC<ErrorRateChartProps> = ({
  currentRate,
  baseline = 0.7,
  isRecovered = false,
}) => {
  // SVG coordinates: Width 600, Height 140
  // Left baseline: 0.7% -> Y ≈ 115
  // Peak error rate: 18.4% -> Y ≈ 25
  // If recovered, line returns to baseline Y ≈ 115 on the right.
  // If active incident, line stays elevated on the right.

  const baselineY = 115
  const peakY = 25
  const activeY = isRecovered ? baselineY : peakY

  // SVG path definition
  const pathD = isRecovered
    ? `M 20 ${baselineY} L 120 ${baselineY} C 160 ${baselineY}, 180 ${peakY}, 230 ${peakY} L 340 ${peakY} C 380 ${peakY}, 410 ${baselineY}, 460 ${baselineY} L 580 ${baselineY}`
    : `M 20 ${baselineY} L 140 ${baselineY} C 180 ${baselineY}, 200 ${peakY}, 260 ${peakY} L 580 ${peakY}`

  const areaD = isRecovered
    ? `M 20 ${baselineY} L 120 ${baselineY} C 160 ${baselineY}, 180 ${peakY}, 230 ${peakY} L 340 ${peakY} C 380 ${peakY}, 410 ${baselineY}, 460 ${baselineY} L 580 ${baselineY} L 580 130 L 20 130 Z`
    : `M 20 ${baselineY} L 140 ${baselineY} C 180 ${baselineY}, 200 ${peakY}, 260 ${peakY} L 580 ${peakY} L 580 130 L 20 130 Z`

  return (
    <div className="bg-rally-surface border border-rally-border rounded p-3 select-none flex flex-col justify-between">
      <div className="flex items-center justify-between pb-1.5 border-b border-rally-border text-[10px] font-mono uppercase text-rally-muted tracking-wider">
        <span className="flex items-center gap-2">
          <span>TELEMETRY GRAPH • CHECKOUT ERROR RATE (5M WINDOW)</span>
          <span className="text-rally-cyan bg-rally-cyan/10 border border-rally-cyan/25 px-1 py-0.2 rounded-sm">
            mcp::get_error_rate
          </span>
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-rally-muted">
            <span className="w-2 h-0.5 bg-rally-muted inline-block" />
            BASELINE ({baseline.toFixed(2)}%)
          </span>
          <span className="flex items-center gap-1 text-rally-red font-semibold">
            <span className="w-2 h-2 rounded-full bg-rally-red animate-pulse inline-block" />
            ACTIVE ({isRecovered ? '0.70%' : `${currentRate.toFixed(1)}%`})
          </span>
        </div>
      </div>

      <div className="relative h-[120px] w-full pt-2">
        <svg
          viewBox="0 0 600 130"
          className="w-full h-full overflow-visible font-mono text-[9px]"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isRecovered ? '#35D07F' : '#FF4655'} stopOpacity="0.25" />
              <stop offset="100%" stopColor={isRecovered ? '#35D07F' : '#FF4655'} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="20" y1="25" x2="580" y2="25" stroke="#202833" strokeDasharray="3 3" />
          <text x="5" y="28" fill="#687482">20%</text>

          <line x1="20" y1="70" x2="580" y2="70" stroke="#202833" strokeDasharray="3 3" />
          <text x="5" y="73" fill="#687482">10%</text>

          <line x1="20" y1="115" x2="580" y2="115" stroke="#202833" strokeDasharray="3 3" />
          <text x="5" y="118" fill="#687482">0%</text>

          {/* Baseline guide line */}
          <line x1="20" y1={baselineY} x2="580" y2={baselineY} stroke="#687482" strokeWidth="1" strokeDasharray="2 2" />

          {/* Shaded Area */}
          <path d={areaD} fill="url(#errorGradient)" />

          {/* Primary Trend Line */}
          <path
            d={pathD}
            fill="none"
            stroke={isRecovered ? '#35D07F' : '#FF4655'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Markers */}
          {/* Deployment marker at spike onset */}
          <line x1="180" y1="10" x2="180" y2="125" stroke="#55D6FF" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="180" cy="115" r="3" fill="#55D6FF" />
          <rect x="155" y="6" width="70" height="13" fill="#10151C" stroke="#55D6FF" rx="2" />
          <text x="160" y="15" fill="#55D6FF" fontSize="8" fontWeight="bold">checkout-v42</text>

          {/* If recovered, rollback marker */}
          {isRecovered && (
            <>
              <line x1="390" y1="10" x2="390" y2="125" stroke="#35D07F" strokeWidth="1" strokeDasharray="2 2" />
              <rect x="365" y="6" width="70" height="13" fill="#10151C" stroke="#35D07F" rx="2" />
              <text x="370" y="15" fill="#35D07F" fontSize="8" fontWeight="bold">checkout-v41</text>
            </>
          )}

          {/* Current state pulse point */}
          <circle
            cx="570"
            cy={activeY}
            r="4.5"
            fill={isRecovered ? '#35D07F' : '#FF4655'}
            className="animate-pulse"
          />
        </svg>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-rally-border/60 text-[9px] font-mono text-rally-muted">
        <span>-15m (Normal)</span>
        <span>-10m (Deployment checkout-v42)</span>
        <span>-5m (Error Spike Detected)</span>
        <span>Now ({isRecovered ? 'Recovery Verified' : 'Elevated 18.4%'})</span>
      </div>
    </div>
  )
}
