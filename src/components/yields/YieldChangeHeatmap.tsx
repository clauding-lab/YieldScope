import { useMemo } from 'react'
import { DataTimestamp } from '../ui/DataTimestamp'
import { useYieldData } from '../../hooks/useYieldData'
import { TENORS, type Tenor } from '../../types'

const PERIODS = [
  { key: '1W', weeksBack: 1 },
  { key: '2W', weeksBack: 2 },
  { key: '1M', weeksBack: 4 },
  { key: '3M', weeksBack: 13 },
  { key: '6M', weeksBack: 26 },
] as const

function getHeatmapColor(bps: number): string {
  if (bps <= -50) return 'bg-emerald-600 text-emerald-50'
  if (bps <= -25) return 'bg-emerald-700/80 text-emerald-100'
  if (bps <= -10) return 'bg-emerald-800/60 text-emerald-200'
  if (bps < 0) return 'bg-emerald-900/40 text-emerald-300'
  if (bps === 0) return 'bg-slate-800 text-slate-400'
  if (bps <= 10) return 'bg-red-900/40 text-red-300'
  if (bps <= 25) return 'bg-red-800/60 text-red-200'
  if (bps <= 50) return 'bg-red-700/80 text-red-100'
  return 'bg-red-600 text-red-50'
}

export function YieldChangeHeatmap() {
  const { data } = useYieldData()

  const heatmapData = useMemo(() => {
    if (!data?.daily?.length) return null

    const daily = data.daily
    const latestIdx = daily.length - 1
    const latest = daily[latestIdx]

    return TENORS.map((tenor) => {
      const currentYield = latest.yields[tenor]
      const row: { tenor: Tenor; changes: { period: string; bps: number | null }[] } = {
        tenor,
        changes: PERIODS.map(({ key, weeksBack }) => {
          const pastIdx = latestIdx - weeksBack
          if (pastIdx < 0 || currentYield == null) return { period: key, bps: null }
          const pastYield = daily[pastIdx]?.yields[tenor]
          if (pastYield == null) return { period: key, bps: null }
          return { period: key, bps: Math.round((currentYield - pastYield) * 100) }
        }),
      }
      return row
    })
  }, [data])

  if (!heatmapData) {
    return (
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
        <p className="text-xs text-slate-500">No yield data available for heatmap.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-slate-800/80 border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-300">Yield Change Heatmap</h2>
        <DataTimestamp lastUpdated={data?.lastUpdated ?? null} compact />
      </div>
      <p className="text-[10px] text-slate-500 mb-3">
        Basis point change by tenor and time period. Green = yields falling, Red = yields rising.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left text-slate-500 font-medium py-1 pr-2">Tenor</th>
              {PERIODS.map(({ key }) => (
                <th key={key} className="text-center text-slate-500 font-medium py-1 px-1 min-w-[44px]">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmapData.map((row) => (
              <tr key={row.tenor}>
                <td className="text-slate-300 font-medium py-0.5 pr-2">{row.tenor}</td>
                {row.changes.map(({ period, bps }) => (
                  <td key={period} className="py-0.5 px-0.5">
                    {bps !== null ? (
                      <div className={`text-center rounded px-1 py-0.5 tabular-nums font-medium ${getHeatmapColor(bps)}`}>
                        {bps > 0 ? '+' : ''}{bps}
                      </div>
                    ) : (
                      <div className="text-center text-slate-600">—</div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
