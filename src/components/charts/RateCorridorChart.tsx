import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { PolicyData } from '../../types'
import { formatYield } from '../../utils/formatters'

interface RateCorridorChartProps {
  policyData: PolicyData
  callMoneyRate?: number
  tbill91dYield?: number
}

export function RateCorridorChart({ policyData, callMoneyRate, tbill91dYield }: RateCorridorChartProps) {
  const { corridor, currentRates } = policyData

  // Create simple data for the corridor visualization
  const data = [
    { name: 'SDF (Floor)', rate: corridor.floor },
    { name: 'Midpoint', rate: corridor.midpoint },
    { name: 'Repo (Ceiling)', rate: corridor.ceiling },
  ]

  return (
    <div className="bg-surface rounded-xl p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-3">Policy Rate Corridor</h3>

      {/* Current rates cards */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <RateCard label="Repo Rate" value={currentRates.repoRate} color="text-amber-400" />
        <RateCard label="Reverse Repo (SDF)" value={currentRates.reverseRepoRate} color="text-sky-400" />
        <RateCard label="Bank Rate" value={currentRates.bankRate} color="text-slate-400" />
        <RateCard label="CRR" value={currentRates.crrRate} suffix="" color="text-slate-400" />
      </div>

      {/* Corridor chart */}
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={{ stroke: '#475569' }}
            tickLine={false}
          />
          <YAxis
            domain={[Math.floor(corridor.floor - 1), Math.ceil(corridor.ceiling + 1)]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              fontSize: '11px',
            }}
            formatter={(value: number) => [formatYield(value), 'Rate']}
          />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="#0ea5e9"
            fill="#0ea5e9"
            fillOpacity={0.1}
            strokeWidth={2}
          />
          {callMoneyRate && (
            <ReferenceLine
              y={callMoneyRate}
              stroke="#22c55e"
              strokeDasharray="4 4"
              label={{ value: `Call ${callMoneyRate}%`, position: 'right', fill: '#22c55e', fontSize: 9 }}
            />
          )}
          {tbill91dYield && (
            <ReferenceLine
              y={tbill91dYield}
              stroke="#f472b6"
              strokeDasharray="4 4"
              label={{ value: `91D ${tbill91dYield}%`, position: 'left', fill: '#f472b6', fontSize: 9 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function RateCard({ label, value, color, suffix = '%' }: { label: string; value: number; color: string; suffix?: string }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-2.5">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className={`text-lg font-semibold ${color}`}>
        {value.toFixed(2)}{suffix}
      </div>
    </div>
  )
}
