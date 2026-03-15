import { DataTimestamp } from '../ui/DataTimestamp'
import type { RevenueData } from '../../types'

interface RevenueTrackerProps {
  revenue: RevenueData
  fiscalYear: string
  lastUpdated: string
}

export function RevenueTracker({ revenue, fiscalYear, lastUpdated }: RevenueTrackerProps) {
  const progressPct = (revenue.ytdCollectedCrore / revenue.budgetTargetCrore) * 100
  const monthsElapsed = revenue.monthly.length
  const expectedPct = (monthsElapsed / 12) * 100
  const onTrack = progressPct >= expectedPct * 0.9

  return (
    <div className="rounded-xl bg-slate-800/80 border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-300">Revenue Collection</h2>
          <p className="text-[10px] text-slate-500">NBR tax revenue vs budget target ({fiscalYear})</p>
        </div>
        <DataTimestamp lastUpdated={lastUpdated} frequency="monthly" compact />
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-lg font-bold text-slate-100 tabular-nums">
            {(revenue.ytdCollectedCrore / 100).toFixed(0)} Cr
          </span>
          <span className="text-xs text-slate-500">
            of {(revenue.budgetTargetCrore / 100).toFixed(0)} Cr target
          </span>
        </div>
        <div className="h-3 bg-slate-900 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${onTrack ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${Math.min(progressPct, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className={`text-[10px] font-medium ${onTrack ? 'text-emerald-400' : 'text-amber-400'}`}>
            {progressPct.toFixed(1)}% collected
          </span>
          <span className="text-[10px] text-slate-500">
            {expectedPct.toFixed(0)}% expected by now
          </span>
        </div>
      </div>

      {/* Monthly breakdown chart */}
      <div className="mt-4">
        <p className="text-[10px] text-slate-500 mb-2">Monthly Collection vs Target</p>
        <div className="flex items-end gap-1 h-20">
          {revenue.monthly.map((m) => {
            const pct = (m.collectedCrore / m.targetCrore) * 100
            const height = Math.min(pct, 150) / 150 * 100
            const overTarget = m.collectedCrore >= m.targetCrore

            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
                  <div
                    className={`w-full rounded-t ${overTarget ? 'bg-emerald-500/70' : 'bg-amber-500/70'}`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-[8px] text-slate-600">{m.month.slice(5)}</span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500/70" /> Met target</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500/70" /> Below target</span>
        </div>
      </div>
    </div>
  )
}
