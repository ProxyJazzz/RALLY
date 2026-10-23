import React from 'react'

interface VerificationBeforeAfterProps {
  beforeErrorRate?: number
  afterErrorRate?: number
  faultyDeployment?: string
  restoredDeployment?: string
  status?: string
}

export const VerificationBeforeAfter: React.FC<VerificationBeforeAfterProps> = ({
  beforeErrorRate = 18.4,
  afterErrorRate = 0.7,
  faultyDeployment = 'checkout-v42',
  restoredDeployment = 'checkout-v41',
  status = 'PASSED',
}) => {
  return (
    <div className="bg-obsidian border border-success-green/40 rounded p-6 sm:p-8 select-none shadow-tactical-green font-sans">
      <div className="flex items-center justify-between pb-3 border-b border-steel/60 text-[10px] font-mono uppercase text-ash tracking-wider">
        <span className="flex items-center gap-2">
          <span className="text-success-green">✓</span>
          <span className="text-off-white font-medium">INDEPENDENT TELEMETRY RESTORATION PROOF</span>
        </span>
        <span className="text-success-green font-bold">
          STATUS: {status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 items-center">
        {/* Before State */}
        <div className="bg-charcoal/80 border border-crimson/40 p-5 rounded relative">
          <div className="flex items-center justify-between font-mono text-[10px] pb-2 border-b border-steel/60">
            <span className="text-crimson font-bold uppercase">PRE-REMEDIATION (FAULTY)</span>
            <span className="text-ash">INCIDENT ACTIVE</span>
          </div>

          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-display text-5xl sm:text-6xl text-crimson leading-none">
              {beforeErrorRate.toFixed(1)}
            </span>
            <span className="font-mono text-base text-crimson/80 font-bold">%</span>
          </div>
          <span className="text-[10px] font-mono text-ash block mt-1">HTTP 5XX ERROR RATE</span>

          <div className="mt-4 pt-3 border-t border-steel/60 flex items-center justify-between font-mono text-xs">
            <span className="text-ash">DEPLOYMENT:</span>
            <span className="text-crimson font-bold line-through">{faultyDeployment}</span>
          </div>
        </div>

        {/* After State */}
        <div className="bg-charcoal/80 border border-success-green/50 p-5 rounded relative shadow-sm">
          <div className="flex items-center justify-between font-mono text-[10px] pb-2 border-b border-steel/60">
            <span className="text-success-green font-bold uppercase">POST-REMEDIATION (RESTORED)</span>
            <span className="text-success-green font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success-green animate-pulse" />
              VERIFIED
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-display text-5xl sm:text-6xl text-success-green leading-none">
              {afterErrorRate.toFixed(2)}
            </span>
            <span className="font-mono text-base text-success-green/80 font-bold">%</span>
          </div>
          <span className="text-[10px] font-mono text-ash block mt-1">BASELINE HEALTH RESTORED</span>

          <div className="mt-4 pt-3 border-t border-steel/60 flex items-center justify-between font-mono text-xs">
            <span className="text-ash">ACTIVE RELEASE:</span>
            <span className="text-success-green font-bold">{restoredDeployment}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
