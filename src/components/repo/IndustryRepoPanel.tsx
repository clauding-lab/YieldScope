import type { RepoDailySnapshot } from '../../types'
import { formatCrore, formatYield } from '../../utils/formatters'

interface Props {
  latest: RepoDailySnapshot
  repoRate: number
}

export function IndustryRepoPanel({ latest, repoRate }: Props) {
  const spreadBps = Math.round((latest.interBankRepoRate - repoRate) * 100)

  return (
    <div className="bg-surface rounded-xl p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-3">Inter-Bank Repo Market</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-slate-500">Volume</div>
          <div className="text-lg font-bold text-slate-100">{formatCrore(latest.interBankRepoVolumeCrore)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Rate</div>
          <div className="text-lg font-bold text-amber-400">{formatYield(latest.interBankRepoRate)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">BB Repo Rate</div>
          <div className="text-sm font-medium text-slate-300">{formatYield(repoRate)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Spread to BB Repo</div>
          <div className={`text-sm font-medium ${spreadBps > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {spreadBps > 0 ? '+' : ''}{spreadBps}bps
          </div>
        </div>
      </div>
      {spreadBps > 25 && (
        <div className="mt-3 p-2 bg-amber-900/20 border border-amber-800/30 rounded-lg">
          <p className="text-[11px] text-amber-400">
            Inter-bank repo rate significantly above BB repo — indicates funding stress
          </p>
        </div>
      )}
    </div>
  )
}
