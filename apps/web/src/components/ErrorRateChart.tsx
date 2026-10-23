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
  const baselineY = 110
  const peakY = 25
  const activeY = isRecovered ? baselineY : peakY

  // SVG smooth paths
  const pathD = isRecovered
    ? `M 20 ${baselineY} L 120 ${baselineY} C 160 ${baselineY}, 180 ${peakY}, 230 ${peakY} L 340 ${peakY} C 380 ${peakY}, 410 ${baselineY}, 460 ${baselineY} L 580 ${baselineY}`
    : `M 20 ${baselineY} L 140 ${baselineY} C 180 ${baselineY}, 200 ${peakY}, 260 ${peakY} L 580 ${peakY}`

  const areaD = isRecovered
    ? `M 20 ${baselineY} L 120 ${baselineY} C 160 ${baselineY}, 180 ${peakY}, 230 ${peakY} L 340 ${peakY} C 380 ${peakY}, 410 ${baselineY}, 460 ${baselineY} L 580 ${baselineY} L 580 125 L 20 125 Z`
    : `M 20 ${baselineY} L 140 ${baselineY} C 180 ${baselineY}, 200 ${peakY}, 260 ${peakY} L 580 ${peakY} L 580 125 L 20 125 Z`

  return (
    <div className="bg-obsidian border border-steel rounded p-4 select-none flex flex-col justify-between">
      <div className="flex items-center justify-between pb-2 border-b border-steel/60 text-[10px] font-mono uppercase text-ash tracking-wider">
        <span className="flex items-center gap-2">
          <span className="text-tactical-gold">📈</span>
          <span className="text-off-white font-medium">TELEMETRY SPARKLINE • 5M SLIDING WINDOW</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="text-ash">BASELINE: {baseline.toFixed(2)}%</span>
          <span
            className={`font-semibold flex items-center gap-1 ${
              isRecovered ? 'text-success-green' : 'text-crimson'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isRecovered ? 'bg-success-green' : 'bg-crimson animate-pulse'
              }`}
            />
            ACTIVE: {isRecovered ? '0.70%' : `${currentRate.toFixed(1)}%`}
          </span>
        </div>
      </div>

      <div className="relative h-[125px] w-full pt-2">
        <svg
          viewBox="0 0 600 130"
          className="w-full h-full overflow-visible font-mono text-[9px]"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={isRecovered ? '#6F9F7A' : '#A83232'}
                stopOpacity="0.25"
              />
              <stop
                offset="100%"
                stopColor={isRecovered ? '#6F9F7A' : '#A83232'}
                stopOpacity="0.0"
              />
            </linearGradient>
          </defs>

          {/* Reference guides */}
          <line x1="20" y1="25" x2="580" y2="25" stroke="#242424" strokeDasharray="3 3" />
          <text x="5" y="28" fill="#777777">20%</text>

          <line x1="20" y1="65" x2="580" y2="65" stroke="#242424" strokeDasharray="3 3" />
          <text x="5" y="68" fill="#777777">10%</text>

          <line x1="20" y1={baselineY} x2="580" y2={baselineY} stroke="#383838" strokeWidth="1" strokeDasharray="2 2" />
          <text x="5" y="113" fill="#777777">0%</text>

          {/* Area fill */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Line stroke */}
          <path
            d={pathD}
            fill="none"
            stroke={isRecovered ? '#6F9F7A' : '#A83232'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Incident Spike Marker */}
          <line x1="180" y1="12" x2="180" y2="120" stroke="#6B9BA8" strokeWidth="1" strokeDasharray="2 2" />
          <rect x="150" y="6" width="76" height="14" fill="#111111" stroke="#6B9BA8" rx="2" />
          <text x="156" y="16" fill="#6B9BA8" fontSize="8" fontWeight="bold">checkout-v42</text>

          {/* Recovery Marker */}
          {isRecovered && (
            <>
              <line x1="390" y1="12" x2="390" y2="120" stroke="#6F9F7A" strokeWidth="1" strokeDasharray="2 2" />
              <rect x="360" y="6" width="76" height="14" fill="#111111" stroke="#6F9F7A" rx="2" />
              <text x="366" y="16" fill="#6F9F7A" fontSize="8" fontWeight="bold">checkout-v41</text>
            </>
          )}

          {/* Current pulse dot */}
          <circle
            cx="575"
            cy={activeY}
            r="4.5"
            fill={isRecovered ? '#6F9F7A' : '#A83232'}
            className="animate-pulse"
          />
        </svg>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-steel/60 text-[9px] font-mono text-ash">
        <span>-15m (Baseline)</span>
        <span>-10m (Deployment Active)</span>
        <span>-5m (Spike Detected)</span>
        <span>Now ({isRecovered ? 'Verified Healthy 0.70%' : 'Elevated Anomaly 18.4%'})</span>
      </div>
    </div>
  )
}
