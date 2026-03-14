import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import type { BorrowingWeekly } from '../../types'
import { formatDateShort, formatCrore } from '../../utils/formatters'

interface Props {
  weekly: BorrowingWeekly[]
}

export function NetIssuanceChart({ weekly }: Props) {
  const data = weekly.map((w) => ({
    date: formatDateShort(w.weekEnding),
    tbill: w.tbillNetIssuanceCrore,
    tbond: w.tbondNetIssuanceCrore,
  }))

  return (
    <div className="bg-surface rounded-xl p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-1">Weekly Net Issuance</h3>
      <p className="text-xs text-slate-500 mb-3">T-Bill and T-Bond net supply (new - maturing)</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={(v) => `${(v / 1000).toFixed(1)}K`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value: number, name: string) => [formatCrore(value), name]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="tbill" name="T-Bill" fill="#38bdf8" fillOpacity={0.8} radius={[2, 2, 0, 0]} />
          <Bar dataKey="tbond" name="T-Bond" fill="#a78bfa" fillOpacity={0.8} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
