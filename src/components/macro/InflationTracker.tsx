import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts'
import { DataTimestamp } from '../ui/DataTimestamp'
import type { MacroSnapshot } from '../../types'

interface InflationTrackerProps {
  snapshots: MacroSnapshot[]
  lastUpdated: string
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatMonth(date: string) {
  const m = parseInt(date.slice(5, 7), 10) - 1
  return MONTH_NAMES[m] ?? date.slice(5, 7)
}

export function InflationTracker({ snapshots, lastUpdated }: InflationTrackerProps) {
  const sorted = useMemo(() => [...snapshots].sort((a, b) => a.date.localeCompare(b.date)), [snapshots])
  const latest = sorted[sorted.length - 1]
  const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null

  const chartData = useMemo(() => {
    return sorted.map(s => ({
      month: formatMonth(s.date),
      Food: s.cpiFoodYoY,
      'Non-Food': s.cpiNonFoodYoY,
      Headline: s.cpiHeadlineYoY,
    }))
  }, [sorted])

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

      {/* Interactive Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}%`}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}
            itemStyle={{ padding: '1px 0' }}
            formatter={(value: number) => [`${value.toFixed(2)}%`]}
            cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
          />
          <Legend
            iconType="square"
            iconSize={8}
            wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }}
          />
          <ReferenceLine
            y={7}
            stroke="#ef4444"
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{ value: 'BB Target 7%', position: 'right', fill: '#ef4444', fontSize: 9 }}
          />
          <Bar dataKey="Food" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Non-Food" fill="#10b981" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Headline" fill="#38bdf8" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
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
