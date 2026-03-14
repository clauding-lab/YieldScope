import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import type { RepoDailySnapshot } from '../../types'
import { formatDateShort, formatCrore } from '../../utils/formatters'

interface Props {
  snapshots: RepoDailySnapshot[]
}

export function RepoOperationsChart({ snapshots }: Props) {
  const data = snapshots.map((s) => ({
    date: formatDateShort(s.date),
    repo: s.bbRepoOutstandingCrore,
    reverseRepo: s.bbReverseRepoOutstandingCrore,
    net: s.netLiquidityInjectionCrore,
  }))

  return (
    <div className="bg-surface rounded-xl p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-1">BB Repo Operations</h3>
      <p className="text-xs text-slate-500 mb-3">Repo injection vs reverse repo absorption</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value: number, name: string) => [formatCrore(value), name]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area
            type="monotone"
            dataKey="repo"
            name="Repo (Injection)"
            stroke="#22c55e"
            fill="#22c55e"
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="reverseRepo"
            name="Reverse Repo (Mopping)"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
