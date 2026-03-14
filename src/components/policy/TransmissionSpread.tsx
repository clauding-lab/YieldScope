import { formatBps } from '../../utils/formatters'
import { calcSpread } from '../../utils/yieldMath'

interface TransmissionSpreadProps {
  repoRate: number
  tbill91dYield: number
}

export function TransmissionSpread({ repoRate, tbill91dYield }: TransmissionSpreadProps) {
  const spread = calcSpread(tbill91dYield, repoRate)
  const isAbove = spread > 0

  return (
    <div className="bg-surface rounded-xl p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-2">Policy Transmission</h3>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500">91D T-bill vs Repo Rate</div>
          <div className={`text-xl font-bold ${isAbove ? 'text-red-400' : 'text-green-400'}`}>
            {formatBps(spread)}
          </div>
        </div>
        <div className="text-right text-xs text-slate-400">
          <div>91D: {tbill91dYield.toFixed(2)}%</div>
          <div>Repo: {repoRate.toFixed(2)}%</div>
        </div>
      </div>
      <p className="text-[11px] text-slate-500 mt-2">
        {isAbove
          ? 'Market rates above policy rate — tight transmission, banks demanding premium over repo'
          : 'Market rates below policy rate — loose transmission, excess liquidity compressing yields below the floor'
        }
      </p>
    </div>
  )
}
