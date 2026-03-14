import type { BorrowingWeekly } from '../../types'
import { formatCrore } from '../../utils/formatters'

interface Props {
  weekly: BorrowingWeekly[]
}

export function SupplyDemandBalance({ weekly }: Props) {
  const latest = weekly[weekly.length - 1]
  const totalNetIssuance = latest.tbillNetIssuanceCrore + latest.tbondNetIssuanceCrore
  const totalOutstanding = latest.outstandingTbillsCrore + latest.outstandingTbondsCrore
  const tbillShare = ((latest.outstandingTbillsCrore / totalOutstanding) * 100).toFixed(1)
  const tbondShare = ((latest.outstandingTbondsCrore / totalOutstanding) * 100).toFixed(1)

  return (
    <div className="bg-surface rounded-xl p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-3">Outstanding Securities</h3>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-xs text-slate-500">T-Bills Outstanding</div>
          <div className="text-lg font-bold text-sky-400">{formatCrore(latest.outstandingTbillsCrore)}</div>
          <div className="text-[11px] text-slate-500">{tbillShare}% of total</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">T-Bonds Outstanding</div>
          <div className="text-lg font-bold text-purple-400">{formatCrore(latest.outstandingTbondsCrore)}</div>
          <div className="text-[11px] text-slate-500">{tbondShare}% of total</div>
        </div>
      </div>

      {/* Composition bar */}
      <div className="h-3 rounded-full overflow-hidden flex">
        <div className="bg-sky-500" style={{ width: `${tbillShare}%` }} />
        <div className="bg-purple-500" style={{ width: `${tbondShare}%` }} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-slate-500">Latest week net issuance:</span>
        <span className={`font-medium ${totalNetIssuance > 0 ? 'text-red-400' : 'text-green-400'}`}>
          {totalNetIssuance > 0 ? '+' : ''}{formatCrore(totalNetIssuance)}
        </span>
      </div>
    </div>
  )
}
