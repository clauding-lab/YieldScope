import type { RepoMaturity } from '../../types'
import { formatCrore, formatDate } from '../../utils/formatters'

interface Props {
  maturities: RepoMaturity[]
}

export function MaturityCalendar({ maturities }: Props) {
  const totalMaturing = maturities.reduce((sum, m) => sum + m.amountCrore, 0)

  return (
    <div className="bg-surface rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-300">Upcoming Repo Maturities</h3>
        <span className="text-xs text-amber-400 font-medium">{formatCrore(totalMaturing)} total</span>
      </div>

      {maturities.length === 0 ? (
        <p className="text-xs text-slate-500">No upcoming maturities</p>
      ) : (
        <div className="space-y-2">
          {maturities.map((m, i) => {
            const daysAway = Math.ceil(
              (new Date(m.maturityDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
            const isImminent = daysAway <= 3

            return (
              <div
                key={i}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  isImminent ? 'bg-red-900/20 border border-red-800/30' : 'bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isImminent ? 'bg-red-400 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="text-xs text-slate-300">{formatDate(m.maturityDate)}</span>
                  {isImminent && <span className="text-[10px] text-red-400 font-medium">{daysAway}d</span>}
                </div>
                <span className="text-xs font-medium text-slate-200">{formatCrore(m.amountCrore)}</span>
              </div>
            )
          })}
        </div>
      )}

      {totalMaturing > 30000 && (
        <div className="mt-2 p-2 bg-amber-900/20 border border-amber-800/30 rounded-lg">
          <p className="text-[11px] text-amber-400">
            Large repo maturities may tighten liquidity — watch for yield spikes at next auction
          </p>
        </div>
      )}
    </div>
  )
}
