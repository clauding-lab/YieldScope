import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import type { MoneySupplySnapshot } from '../../types'
import { formatDateShort } from '../../utils/formatters'

interface Props {
  snapshots: MoneySupplySnapshot[]
}

export function MoneySupplyChart({ snapshots }: Props) {
  const data = snapshots.map((s) => ({
    date: formatDateShort(s.date),
    'm2Growth': s.m2GrowthYoY,
    'callMoney': s.callMoneyRate,
  }))

  return (
    <div className="bg-surface rounded-xl p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-1">M2 Growth vs Call Money Rate</h3>
      <p className="text-xs text-slate-500 mb-3">Broad money growth overlaid with interbank rate</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey="m2Growth"
            name="M2 Growth YoY"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="callMoney"
            name="Call Money Rate"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
