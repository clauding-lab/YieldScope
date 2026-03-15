import { useMemo } from 'react'
import { DataTimestamp } from '../ui/DataTimestamp'
import type { DebtData } from '../../types'

interface PublicDebtPanelProps {
  debt: DebtData
  lastUpdated: string
}

export function PublicDebtPanel({ debt, lastUpdated }: PublicDebtPanelProps) {
  const domesticPct = (debt.domesticDebtLakhCrore / debt.totalDebtLakhCrore) * 100
  const externalPct = (debt.externalDebtLakhCrore / debt.totalDebtLakhCrore) * 100

  // Quarterly trend sparkline
  const trendPoints = useMemo(() => {
    const data = debt.quarterly.map(q => q.totalLakhCr)
    if (data.length < 2) return ''
    const min = Math.min(...data) * 0.95
    const max = Math.max(...data) * 1.05
    const range = max - min || 1
    const w = 200
    const h = 40
    return data.map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / range) * h
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
  }, [debt.quarterly])

  return (
    <div className="rounded-xl bg-slate-800/80 border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-300">Public Debt Dynamics</h2>
          <p className="text-[10px] text-slate-500">Total stock, composition & sustainability</p>
        </div>
        <DataTimestamp lastUpdated={lastUpdated} frequency="monthly" compact />
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-lg bg-slate-900/50 p-2">
          <p className="text-[10px] text-slate-500">Total Debt</p>
          <p className="text-base font-bold text-slate-200 tabular-nums">{debt.totalDebtLakhCrore.toFixed(1)}L Cr</p>
        </div>
        <div className="rounded-lg bg-slate-900/50 p-2">
          <p className="text-[10px] text-slate-500">Debt/GDP</p>
          <p className="text-base font-bold text-amber-400 tabular-nums">{debt.debtToGdpPct.toFixed(1)}%</p>
        </div>
        <div className="rounded-lg bg-slate-900/50 p-2">
          <p className="text-[10px] text-slate-500">Interest/Rev</p>
          <p className={`text-base font-bold tabular-nums ${debt.interestToRevenuePct > 25 ? 'text-red-400' : 'text-amber-400'}`}>
            {debt.interestToRevenuePct.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Composition bar */}
      <div className="mb-3">
        <p className="text-[10px] text-slate-500 mb-1">Debt Composition</p>
        <div className="h-4 bg-slate-900 rounded-full overflow-hidden flex">
          <div
            className="bg-sky-500/80 flex items-center justify-center"
            style={{ width: `${domesticPct}%` }}
          >
            <span className="text-[8px] text-white font-medium">{domesticPct.toFixed(0)}%</span>
          </div>
          <div
            className="bg-violet-500/80 flex items-center justify-center"
            style={{ width: `${externalPct}%` }}
          >
            <span className="text-[8px] text-white font-medium">{externalPct.toFixed(0)}%</span>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-1 text-[10px]">
          <span className="flex items-center gap-1 text-slate-500">
            <span className="w-2 h-2 rounded-sm bg-sky-500/80" />
            Domestic ({debt.domesticDebtLakhCrore.toFixed(1)}L Cr)
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <span className="w-2 h-2 rounded-sm bg-violet-500/80" />
            External ({debt.externalDebtLakhCrore.toFixed(1)}L Cr)
          </span>
        </div>
      </div>

      {/* Quarterly trend */}
      {trendPoints && (
        <div>
          <p className="text-[10px] text-slate-500 mb-1">Total Debt Trend</p>
          <svg viewBox="0 0 200 40" className="w-full h-10">
            <path d={trendPoints} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div className="flex justify-between text-[8px] text-slate-600">
            {debt.quarterly.length > 0 && <span>{debt.quarterly[0].quarter}</span>}
            {debt.quarterly.length > 1 && <span>{debt.quarterly[debt.quarterly.length - 1].quarter}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
