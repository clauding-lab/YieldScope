import type { BorrowingActual, BorrowingBudgetTarget } from '../../types'
import { formatCrore } from '../../utils/formatters'

interface Props {
  actual: BorrowingActual
  target: BorrowingBudgetTarget
  fiscalYear: string
}

export function BorrowingTracker({ actual, target, fiscalYear }: Props) {
  const pct = actual.pctOfBudgetTarget
  const remaining = target.totalDomesticBorrowingCrore - actual.totalDomesticBorrowingCrore
  const isAhead = pct > (9 / 12) * 100 // More than 75% through 9 months
  const isBehind = pct < (6 / 12) * 100 // Less than 50% through 9 months

  return (
    <div className="bg-surface rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-slate-300">Borrowing Progress</h3>
        <span className="text-xs text-slate-500">{fiscalYear}</span>
      </div>
      <p className="text-xs text-slate-500 mb-3">YTD domestic borrowing vs budget target</p>

      {/* Progress bar */}
      <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all ${
            isAhead ? 'bg-red-500' : isBehind ? 'bg-amber-500' : 'bg-sky-500'
          }`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs mb-3">
        <span className="text-slate-400">{pct.toFixed(1)}% of target</span>
        <span className="text-slate-500">{formatCrore(actual.totalDomesticBorrowingCrore)} / {formatCrore(target.totalDomesticBorrowingCrore)}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-800/50 rounded-lg p-2">
          <div className="text-[10px] text-slate-500">Remaining</div>
          <div className="text-sm font-bold text-slate-200">{formatCrore(remaining)}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-2">
          <div className="text-[10px] text-slate-500">Months Left</div>
          <div className="text-sm font-bold text-slate-200">{actual.remainingMonths}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-2">
          <div className="text-[10px] text-slate-500">Monthly Run Rate</div>
          <div className="text-sm font-bold text-amber-400">{formatCrore(actual.impliedMonthlyRunRate)}</div>
        </div>
      </div>

      {isBehind && (
        <div className="mt-2 p-2 bg-amber-900/20 border border-amber-800/30 rounded-lg">
          <p className="text-[11px] text-amber-400">
            Behind target — expect supply surge in remaining months, upward pressure on yields
          </p>
        </div>
      )}
    </div>
  )
}
