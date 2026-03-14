import type { PortfolioMetrics } from '../../types'
import { formatCrore } from '../../utils/formatters'

interface Props {
  metrics: PortfolioMetrics
}

export function PortfolioSummary({ metrics }: Props) {
  const plColor = metrics.unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'

  return (
    <div className="rounded-xl bg-slate-800 p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-3">Portfolio Summary</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-500">Face Value</p>
          <p className="text-lg font-semibold text-slate-100">{formatCrore(metrics.totalFaceValue)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Market Value</p>
          <p className="text-lg font-semibold text-slate-100">{formatCrore(metrics.totalMarketValue)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Unrealized P&L</p>
          <p className={`text-lg font-semibold ${plColor}`}>
            {metrics.unrealizedPL >= 0 ? '+' : ''}{formatCrore(metrics.unrealizedPL)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Mod. Duration</p>
          <p className="text-lg font-semibold text-slate-100">{metrics.weightedModifiedDuration.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">PV01 (Cr)</p>
          <p className="text-lg font-semibold text-slate-100">{metrics.portfolioPV01.toFixed(4)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Convexity</p>
          <p className="text-lg font-semibold text-slate-100">{metrics.weightedConvexity.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}
