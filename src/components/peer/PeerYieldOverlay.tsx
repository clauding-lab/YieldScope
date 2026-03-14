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
import type { PeerComparison } from '../../types'
import { formatYield } from '../../utils/formatters'

interface Props {
  comparisons: PeerComparison[]
}

const COUNTRY_COLORS = {
  BD: '#38bdf8',
  IN: '#f59e0b',
  PK: '#22c55e',
}

export function PeerYieldOverlay({ comparisons }: Props) {
  const data = comparisons.map((c) => ({
    tenor: c.tenor,
    Bangladesh: c.bdYield,
    India: c.inYield,
    Pakistan: c.pkYield,
  }))

  return (
    <div className="bg-surface rounded-xl p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-1">Regional Yield Curve Overlay</h3>
      <p className="text-xs text-slate-500 mb-3">Bangladesh vs India vs Pakistan nominal yields</p>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="tenor" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value) => typeof value === 'number' ? [formatYield(value)] : ['N/A']}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey="Bangladesh"
            stroke={COUNTRY_COLORS.BD}
            strokeWidth={2.5}
            dot={{ r: 4, fill: COUNTRY_COLORS.BD }}
          />
          <Line
            type="monotone"
            dataKey="India"
            stroke={COUNTRY_COLORS.IN}
            strokeWidth={2}
            dot={{ r: 3, fill: COUNTRY_COLORS.IN }}
            strokeDasharray="5 5"
          />
          <Line
            type="monotone"
            dataKey="Pakistan"
            stroke={COUNTRY_COLORS.PK}
            strokeWidth={2}
            dot={{ r: 3, fill: COUNTRY_COLORS.PK }}
            strokeDasharray="3 3"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
