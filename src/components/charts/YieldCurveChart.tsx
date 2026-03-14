import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { YieldData, Tenor } from '../../types'
import { TENORS } from '../../types'
import { TENOR_SHORT, CURVE_OVERLAY_STYLES } from '../../utils/constants'
import { formatYield } from '../../utils/formatters'

interface YieldCurveChartProps {
  yieldData: YieldData
  repoRate?: number
}

type OverlayKey = keyof typeof CURVE_OVERLAY_STYLES

const OVERLAY_KEYS: OverlayKey[] = ['latest', 'oneWeekAgo', 'oneMonthAgo', 'threeMonthsAgo', 'oneYearAgo']

export function YieldCurveChart({ yieldData, repoRate }: YieldCurveChartProps) {
  const [activeOverlays, setActiveOverlays] = useState<Set<OverlayKey>>(
    new Set(['latest', 'oneWeekAgo', 'oneMonthAgo'])
  )

  const chartData = useMemo(() => {
    const dateMap = new Map(yieldData.daily.map((d) => [d.date, d.yields]))

    return TENORS.map((tenor: Tenor) => {
      const point: Record<string, string | number> = { tenor: TENOR_SHORT[tenor] }
      for (const key of OVERLAY_KEYS) {
        const date = yieldData.curves[key]
        const yields = dateMap.get(date)
        if (yields && yields[tenor] != null) {
          point[key] = yields[tenor]
        }
      }
      return point
    })
  }, [yieldData])

  function toggleOverlay(key: OverlayKey) {
    setActiveOverlays((prev) => {
      const next = new Set(prev)
      if (key === 'latest') return next // Can't toggle off "today"
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="bg-surface rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-300">Yield Curve</h3>
        <div className="flex gap-1.5 flex-wrap">
          {OVERLAY_KEYS.map((key) => {
            const style = CURVE_OVERLAY_STYLES[key]
            const isActive = activeOverlays.has(key)
            return (
              <button
                key={key}
                onClick={() => toggleOverlay(key)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                  isActive
                    ? 'border-slate-600 text-slate-200'
                    : 'border-slate-700/50 text-slate-600'
                }`}
                style={isActive ? { borderColor: style.color, color: style.color } : undefined}
              >
                {style.label}
              </button>
            )
          })}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="tenor"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={{ stroke: '#475569' }}
            tickLine={false}
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
            formatter={(value: number, name: string) => [
              formatYield(value),
              CURVE_OVERLAY_STYLES[name as OverlayKey]?.label ?? name,
            ]}
          />
          <Legend
            verticalAlign="top"
            height={0}
            content={() => null}
          />

          {repoRate && (
            <ReferenceLine
              y={repoRate}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: `Repo ${repoRate}%`,
                position: 'right',
                fill: '#f59e0b',
                fontSize: 10,
              }}
            />
          )}

          {OVERLAY_KEYS.filter((k) => activeOverlays.has(k))
            .reverse()
            .map((key) => {
              const style = CURVE_OVERLAY_STYLES[key]
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={style.color}
                  strokeWidth={style.strokeWidth}
                  strokeDasharray={style.dash}
                  dot={key === 'latest' ? { r: 3, fill: style.color } : false}
                  activeDot={key === 'latest' ? { r: 5 } : false}
                  connectNulls
                />
              )
            })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
