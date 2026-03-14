import type { BorrowingWeekly } from '../../types'
import { formatCrore } from '../../utils/formatters'

interface Props {
  weekly: BorrowingWeekly[]
}

export function WaysAndMeansAlert({ weekly }: Props) {
  const withWAM = weekly.filter((w) => w.waysAndMeansAdvanceCrore > 0)

  if (withWAM.length === 0) return null

  const latest = withWAM[withWAM.length - 1]

  return (
    <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
        <h3 className="text-sm font-medium text-red-400">Ways & Means Advance Active</h3>
      </div>
      <p className="text-xs text-slate-300 mb-1">
        Government is using emergency borrowing from Bangladesh Bank
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Amount outstanding:</span>
        <span className="text-sm font-bold text-red-400">{formatCrore(latest.waysAndMeansAdvanceCrore)}</span>
      </div>
      <p className="text-[11px] text-red-400/70 mt-2">
        W&M advances signal fiscal stress — may indicate upcoming supply surge in T-bill/T-bond auctions
      </p>
    </div>
  )
}
