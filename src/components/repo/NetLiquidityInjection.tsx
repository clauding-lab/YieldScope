import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { RepoDailySnapshot } from '../../types'
import { formatDateShort, formatCrore } from '../../utils/formatters'

interface Props {
  snapshots: RepoDailySnapshot[]
}

export function NetLiquidityInjection({ snapshots }: Props) {
  const data = snapshots.map((s) => ({
    date: formatDateShort(s.date),
    net: s.netLiquidityInjectionCrore,
  }))

  const latest = snapshots[snapshots.length - 1]
  const prev = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null
  const change = prev ? latest.netLiquidityInjectionCrore - prev.netLiquidityInjectionCrore : 0

  return (
    <div className="bg-surface rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-slate-300">Net Liquidity Injection</h3>
        <div className="text-right">
          <div className="text-sm font-bold text-slate-100">{formatCrore(latest.netLiquidityInjectionCrore)}</div>
          {change !== 0 && (
            <div className={`text-[11px] ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change > 0 ? '+' : ''}{formatCrore(change)}
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-3">Repo minus reverse repo outstanding</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value: number) => [formatCrore(value), 'Net Injection']}
          />
          <Line
            type="monotone"
            dataKey="net"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={{ r: 3, fill: '#38bdf8' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
