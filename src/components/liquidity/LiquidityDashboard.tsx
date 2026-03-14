import type { MoneySupplySnapshot } from '../../types'
import { formatCrore, formatYield, formatPercent } from '../../utils/formatters'

interface Props {
  latest: MoneySupplySnapshot
}

export function LiquidityDashboard({ latest }: Props) {
  const liquidityTrend = latest.excessLiquidityChange30d >= 0 ? 'Inflow' : 'Outflow'
  const trendColor = latest.excessLiquidityChange30d >= 0 ? 'text-green-400' : 'text-red-400'

  return (
    <div className="bg-surface rounded-xl p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-3">System Liquidity Snapshot</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-slate-500">Excess Liquidity</div>
          <div className="text-lg font-bold text-slate-100">{formatCrore(latest.excessLiquidityCrore)}</div>
          <div className={`text-xs ${trendColor}`}>
            {liquidityTrend}: {formatCrore(Math.abs(latest.excessLiquidityChange30d))}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Call Money Rate</div>
          <div className="text-lg font-bold text-amber-400">{formatYield(latest.callMoneyRate)}</div>
          <div className="text-xs text-slate-500">Vol: {formatCrore(latest.callMoneyVolumeCrore)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Broad Money (M2)</div>
          <div className="text-lg font-bold text-sky-400">BDT {latest.m2Bn.toLocaleString('en-IN')}B</div>
          <div className="text-xs text-slate-500">YoY: {formatPercent(latest.m2GrowthYoY)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Reserve Money</div>
          <div className="text-lg font-bold text-slate-100">BDT {latest.reserveMoneyBn.toLocaleString('en-IN')}B</div>
          <div className="text-xs text-slate-500">
            NDA: {latest.netDomesticAssetsBn.toLocaleString('en-IN')}B
          </div>
        </div>
      </div>
    </div>
  )
}
