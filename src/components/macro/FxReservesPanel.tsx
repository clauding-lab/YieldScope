import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { DataTimestamp } from '../ui/DataTimestamp'
import type { MacroSnapshot } from '../../types'

interface FxReservesPanelProps {
  snapshots: MacroSnapshot[]
  lastUpdated: string
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatMonth(date: string) {
  const m = parseInt(date.slice(5, 7), 10) - 1
  return MONTH_NAMES[m] ?? date.slice(5, 7)
}

export function FxReservesPanel({ snapshots, lastUpdated }: FxReservesPanelProps) {
  const sorted = useMemo(() => [...snapshots].sort((a, b) => a.date.localeCompare(b.date)), [snapshots])
  const latest = sorted[sorted.length - 1]
  const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null

  const reserveData = useMemo(() => {
    return sorted.map(s => ({
      month: formatMonth(s.date),
      reserves: s.bbFxReservesBn,
    }))
  }, [sorted])

  const fxData = useMemo(() => {
    return sorted.map(s => ({
      month: formatMonth(s.date),
      rate: s.usdBdtRate,
    }))
  }, [sorted])

  const importCoverMonths = latest.bbFxReservesBn / 6.5

  return (
    <div className="rounded-xl bg-slate-800/80 border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-300">FX Reserves & Exchange Rate</h2>
          <p className="text-[10px] text-slate-500">BB gross reserves & BDT/USD rate</p>
        </div>
        <DataTimestamp lastUpdated={lastUpdated} frequency="weekly" compact />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-lg bg-slate-900/50 p-3">
          <p className="text-[10px] text-slate-500 mb-1">Gross Reserves</p>
          <p className="text-xl font-bold text-sky-400 tabular-nums">${latest.bbFxReservesBn.toFixed(1)}B</p>
          {prev && (
            <p className={`text-[10px] tabular-nums ${latest.bbFxReservesBn > prev.bbFxReservesBn ? 'text-emerald-400' : 'text-red-400'}`}>
              {latest.bbFxReservesBn > prev.bbFxReservesBn ? '+' : ''}
              ${(latest.bbFxReservesBn - prev.bbFxReservesBn).toFixed(2)}B
            </p>
          )}
        </div>
        <div className="rounded-lg bg-slate-900/50 p-3">
          <p className="text-[10px] text-slate-500 mb-1">USD/BDT Rate</p>
          <p className="text-xl font-bold text-slate-200 tabular-nums">{latest.usdBdtRate.toFixed(2)}</p>
          <p className={`text-[10px] tabular-nums ${latest.usdBdtChange30d < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {latest.usdBdtChange30d > 0 ? '+' : ''}{latest.usdBdtChange30d.toFixed(2)} (30d)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-slate-900/50 p-2">
          <p className="text-[10px] text-slate-500">Import Cover</p>
          <p className="text-sm font-semibold text-slate-300 tabular-nums">{importCoverMonths.toFixed(1)} months</p>
        </div>
        <div className="rounded-lg bg-slate-900/50 p-2">
          <p className="text-[10px] text-slate-500">ADR</p>
          <p className="text-sm font-semibold text-slate-300 tabular-nums">{latest.advanceDepositRatio.toFixed(1)}%</p>
        </div>
      </div>

      {/* Reserve Trend — Interactive Area Chart */}
      <div className="mb-4">
        <p className="text-[10px] text-slate-500 mb-2">Reserve Trend ($B)</p>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={reserveData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <defs>
              <linearGradient id="reserveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${v}`}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
              formatter={(value: number) => [`$${value.toFixed(2)}B`, 'Reserves']}
            />
            <Area
              type="monotone"
              dataKey="reserves"
              stroke="#38bdf8"
              strokeWidth={2}
              fill="url(#reserveGradient)"
              dot={{ r: 4, fill: '#38bdf8', stroke: '#1e293b', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#38bdf8', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* USD/BDT Trend — Interactive Line Chart */}
      <div>
        <p className="text-[10px] text-slate-500 mb-2">USD/BDT Rate Trend</p>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={fxData} margin={{ top: 5, right: 5, left: -5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(v: number) => v.toFixed(1)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
              formatter={(value: number) => [`৳${value.toFixed(2)}`, 'USD/BDT']}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 4, fill: '#f59e0b', stroke: '#1e293b', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
