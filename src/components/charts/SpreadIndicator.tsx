import type { YieldData } from '../../types'
import { getCurveSpread, getCurveShape, getSpreadDirection } from '../../utils/yieldMath'
import { formatBps } from '../../utils/formatters'

interface SpreadIndicatorProps {
  yieldData: YieldData
}

export function SpreadIndicator({ yieldData }: SpreadIndicatorProps) {
  const latest = yieldData.daily[0]
  const previous = yieldData.daily.length > 1 ? yieldData.daily[1] : null

  if (!latest) return null

  const spread = getCurveSpread(latest.yields)
  const prevSpread = previous ? getCurveSpread(previous.yields) : null
  const direction = prevSpread != null ? getSpreadDirection(spread, prevSpread) : 'stable'
  const shape = getCurveShape(latest.yields)
  const delta = prevSpread != null ? spread - prevSpread : 0

  const directionColor = {
    steepening: 'text-red-400',
    flattening: 'text-green-400',
    stable: 'text-slate-400',
  }[direction]

  const directionArrow = {
    steepening: '↑',
    flattening: '↓',
    stable: '→',
  }[direction]

  return (
    <div className="flex items-center gap-4 bg-surface rounded-xl px-4 py-3">
      <div className="flex-1">
        <div className="text-xs text-slate-500 mb-0.5">10Y-91D Spread</div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold text-slate-100">{formatBps(spread)}</span>
          {delta !== 0 && (
            <span className={`text-xs font-medium ${directionColor}`}>
              {directionArrow} {formatBps(Math.abs(delta))}
            </span>
          )}
        </div>
      </div>
      <div className="flex-1">
        <div className="text-xs text-slate-500 mb-0.5">Curve Shape</div>
        <span className="text-sm font-medium text-slate-300 capitalize">{shape}</span>
      </div>
      <div className="flex-1">
        <div className="text-xs text-slate-500 mb-0.5">Direction</div>
        <span className={`text-sm font-medium capitalize ${directionColor}`}>
          {direction}
        </span>
      </div>
    </div>
  )
}
