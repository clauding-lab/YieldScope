import { DataTimestamp } from '../ui/DataTimestamp'
import type { AdpData } from '../../types'

interface AdpImplementationProps {
  adp: AdpData
  lastUpdated: string
}

export function AdpImplementation({ adp, lastUpdated }: AdpImplementationProps) {
  return (
    <div className="rounded-xl bg-slate-800/80 border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-300">ADP Implementation</h2>
          <p className="text-[10px] text-slate-500">Development expenditure allocation vs actuals</p>
        </div>
        <DataTimestamp lastUpdated={lastUpdated} frequency="monthly" compact />
      </div>

      {/* Current year gauge */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="14" fill="none"
              stroke={adp.implementationRatePct > 40 ? '#10b981' : '#f59e0b'}
              strokeWidth="3"
              strokeDasharray={`${adp.implementationRatePct * 0.88} 88`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-slate-200 tabular-nums">{adp.implementationRatePct.toFixed(0)}%</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-300">
            <span className="font-semibold">{(adp.implementedCrore / 100).toFixed(0)} Cr</span>
            <span className="text-slate-500"> of {(adp.allocationCrore / 100).toFixed(0)} Cr</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Current fiscal year implementation rate
          </p>
        </div>
      </div>

      {/* Historical rates */}
      <div>
        <p className="text-[10px] text-slate-500 mb-2">Historical Implementation Rates</p>
        <div className="space-y-1.5">
          {adp.historicalRates.map((h) => {
            const isCurrent = h.fiscalYear === adp.historicalRates[adp.historicalRates.length - 1].fiscalYear
            return (
              <div key={h.fiscalYear} className="flex items-center gap-2">
                <span className={`text-[10px] w-8 ${isCurrent ? 'text-sky-400 font-medium' : 'text-slate-500'}`}>
                  {h.fiscalYear}
                </span>
                <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isCurrent ? 'bg-sky-500' : 'bg-slate-600'}`}
                    style={{ width: `${Math.min(h.ratePct, 100)}%` }}
                  />
                </div>
                <span className={`text-[10px] tabular-nums w-10 text-right ${isCurrent ? 'text-sky-400 font-medium' : 'text-slate-500'}`}>
                  {h.ratePct.toFixed(1)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
