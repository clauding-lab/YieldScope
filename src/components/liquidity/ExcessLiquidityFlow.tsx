import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts'
import type { MoneySupplySnapshot } from '../../types'
import { formatDateShort, formatCrore } from '../../utils/formatters'

interface Props {
  snapshots: MoneySupplySnapshot[]
}

export function ExcessLiquidityFlow({ snapshots }: Props) {
  const data = snapshots.map((s) => ({
    date: formatDateShort(s.date),
    change: s.excessLiquidityChange30d,
    total: s.excessLiquidityCrore,
  }))

  return (
    <div className="bg-surface rounded-xl p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-1">Excess Liquidity Change</h3>
      <p className="text-xs text-slate-500 mb-3">Monthly net inflow/outflow (30-day change)</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value: number) => [formatCrore(Math.abs(value)), value >= 0 ? 'Inflow' : 'Outflow']}
          />
          <Bar dataKey="change" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.change >= 0 ? '#22c55e' : '#ef4444'}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
