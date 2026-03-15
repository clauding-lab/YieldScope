import { DataTimestamp } from '../ui/DataTimestamp'
import type { MacroSnapshot } from '../../types'
import type { YieldData } from '../../types'

interface RealYieldIndicatorProps {
  macroSnapshot: MacroSnapshot
  yieldData: YieldData | null
  lastUpdated: string
}

export function RealYieldIndicator({ macroSnapshot, yieldData, lastUpdated }: RealYieldIndicatorProps) {
  const latestYields = yieldData?.daily?.[yieldData.daily.length - 1]?.yields
  const cpi = macroSnapshot.cpiHeadlineYoY

  const tenors = [
    { key: '91D' as const, label: '91D' },
    { key: '364D' as const, label: '364D' },
    { key: '2Y' as const, label: '2Y' },
    { key: '5Y' as const, label: '5Y' },
    { key: '10Y' as const, label: '10Y' },
    { key: '20Y' as const, label: '20Y' },
  ]

  return (
    <div className="rounded-xl bg-slate-800/80 border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-300">Real Yield Monitor</h2>
          <p className="text-[10px] text-slate-500">Nominal yield minus CPI ({cpi.toFixed(1)}%)</p>
        </div>
        <DataTimestamp lastUpdated={lastUpdated} frequency="monthly" compact />
      </div>

      <div className="space-y-1.5">
        {tenors.map(({ key, label }) => {
          const nominal = latestYields?.[key]
          if (nominal == null) return null
          const real = nominal - cpi
          const barMaxWidth = 100
          const barWidth = Math.min(Math.abs(real) / 3 * barMaxWidth, barMaxWidth)

          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 w-8 text-right font-medium">{label}</span>
              <div className="flex-1 flex items-center h-5">
                {/* Zero line at the center */}
                <div className="relative w-full h-full flex items-center">
                  <div className="absolute left-1/2 w-px h-full bg-slate-600" />
                  {real >= 0 ? (
                    <div
                      className="absolute left-1/2 h-3 rounded-r bg-emerald-500/70"
                      style={{ width: `${barWidth / 2}%` }}
                    />
                  ) : (
                    <div
                      className="absolute h-3 rounded-l bg-red-500/70"
                      style={{ width: `${barWidth / 2}%`, right: '50%' }}
                    />
                  )}
                </div>
              </div>
              <span className={`text-[10px] tabular-nums font-medium w-14 text-right ${real >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {real > 0 ? '+' : ''}{real.toFixed(2)}%
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500/70" /> Positive real</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/70" /> Negative real</span>
      </div>
    </div>
  )
}
