import { useMemo } from 'react'
import { DataTimestamp } from '../ui/DataTimestamp'
import type { MacroSnapshot } from '../../types'

interface InflationTrackerProps {
  snapshots: MacroSnapshot[]
  lastUpdated: string
}

export function InflationTracker({ snapshots, lastUpdated }: InflationTrackerProps) {
  // Sort chronologically (oldest → newest) so chart reads left-to-right
  const sorted = useMemo(() => [...snapshots].sort((a, b) => a.date.localeCompare(b.date)), [snapshots])
  const latest = sorted[sorted.length - 1]
  const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null

  const chartData = useMemo(() => {
    return sorted.map(s => ({
      date: s.date,
      headline: s.cpiHeadlineYoY,
      food: s.cpiFoodYoY,
      nonFood: s.cpiNonFoodYoY,
    }))
  }, [sorted])

  // Simple bar chart SVG
  const barWidth = 280
  const barHeight = 120
  const maxVal = Math.max(...chartData.map(d => Math.max(d.headline, d.food, d.nonFood))) * 1.1

  return (
    <div className="rounded-xl bg-slate-800/80 border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-300">Inflation Tracker</h2>
          <p className="text-[10px] text-slate-500">CPI headline with food/non-food breakdown</p>
        </div>
        <DataTimestamp lastUpdated={lastUpdated} frequency="monthly" compact />
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <MetricBox
          label="Headline CPI"
          value={latest.cpiHeadlineYoY}
          change={prev ? latest.cpiHeadlineYoY - prev.cpiHeadlineYoY : null}
          color="text-sky-400"
        />
        <MetricBox
          label="Food"
          value={latest.cpiFoodYoY}
          change={prev ? latest.cpiFoodYoY - prev.cpiFoodYoY : null}
          color="text-amber-400"
        />
        <MetricBox
          label="Non-Food"
          value={latest.cpiNonFoodYoY}
          change={prev ? latest.cpiNonFoodYoY - prev.cpiNonFoodYoY : null}
          color="text-emerald-400"
        />
      </div>

      {/* Chart */}
      <svg viewBox={`0 0 ${barWidth} ${barHeight}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {chartData.map((d, i) => {
          const groupWidth = barWidth / chartData.length
          const x = i * groupWidth + groupWidth * 0.15
          const bw = groupWidth * 0.2

          return (
            <g key={d.date}>
              <rect
                x={x}
                y={barHeight - (d.food / maxVal) * barHeight}
                width={bw}
                height={(d.food / maxVal) * barHeight}
                fill="#f59e0b"
                opacity={0.7}
                rx={1}
              />
              <rect
                x={x + bw + 1}
                y={barHeight - (d.nonFood / maxVal) * barHeight}
                width={bw}
                height={(d.nonFood / maxVal) * barHeight}
                fill="#10b981"
                opacity={0.7}
                rx={1}
              />
              <rect
                x={x + (bw + 1) * 2}
                y={barHeight - (d.headline / maxVal) * barHeight}
                width={bw}
                height={(d.headline / maxVal) * barHeight}
                fill="#38bdf8"
                opacity={0.8}
                rx={1}
              />
              <text
                x={x + groupWidth * 0.35 - groupWidth * 0.15}
                y={barHeight - 2}
                className="fill-slate-500"
                fontSize="7"
                textAnchor="middle"
              >
                {d.date.slice(5, 7)}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500" /> Food</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> Non-Food</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-sky-400" /> Headline</span>
      </div>
    </div>
  )
}

function MetricBox({ label, value, change, color }: {
  label: string
  value: number
  change: number | null
  color: string
}) {
  return (
    <div className="rounded-lg bg-slate-900/50 p-2">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={`text-base font-bold tabular-nums ${color}`}>{value.toFixed(1)}%</p>
      {change !== null && (
        <p className={`text-[10px] tabular-nums ${change < 0 ? 'text-emerald-400' : change > 0 ? 'text-red-400' : 'text-slate-500'}`}>
          {change > 0 ? '+' : ''}{change.toFixed(1)}pp
        </p>
      )}
    </div>
  )
}
