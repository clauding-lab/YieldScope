import { useMemo } from 'react'
import { DataTimestamp } from '../ui/DataTimestamp'
import type { CreditDepositMonthly } from '../../types'

interface CreditDepositPanelProps {
  monthly: CreditDepositMonthly[]
  lastUpdated: string
}

export function CreditDepositPanel({ monthly, lastUpdated }: CreditDepositPanelProps) {
  const latest = monthly[monthly.length - 1]
  const prev = monthly.length > 1 ? monthly[monthly.length - 2] : null

  // Chart data
  const chartWidth = 280
  const chartHeight = 100

  const creditLine = useMemo(() => {
    const data = monthly.map(m => m.creditGrowthYoY)
    const allVals = [...data, ...monthly.map(m => m.depositGrowthYoY)]
    const min = Math.min(...allVals) - 1
    const max = Math.max(...allVals) + 1
    const range = max - min || 1
    return data.map((v, i) => {
      const x = (i / (data.length - 1)) * chartWidth
      const y = chartHeight - ((v - min) / range) * chartHeight
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
  }, [monthly])

  const depositLine = useMemo(() => {
    const data = monthly.map(m => m.depositGrowthYoY)
    const allVals = [...monthly.map(m => m.creditGrowthYoY), ...data]
    const min = Math.min(...allVals) - 1
    const max = Math.max(...allVals) + 1
    const range = max - min || 1
    return data.map((v, i) => {
      const x = (i / (data.length - 1)) * chartWidth
      const y = chartHeight - ((v - min) / range) * chartHeight
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
  }, [monthly])

  return (
    <div className="rounded-xl bg-slate-800/80 border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-300">Credit & Deposit Growth</h2>
          <p className="text-[10px] text-slate-500">Industry-wide YoY growth trends</p>
        </div>
        <DataTimestamp lastUpdated={lastUpdated} frequency="monthly" compact />
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="rounded-lg bg-slate-900/50 p-2">
          <p className="text-[10px] text-slate-500">Credit Growth</p>
          <p className="text-sm font-bold text-sky-400 tabular-nums">{latest.creditGrowthYoY.toFixed(1)}%</p>
          {prev && (
            <p className={`text-[10px] tabular-nums ${latest.creditGrowthYoY < prev.creditGrowthYoY ? 'text-red-400' : 'text-emerald-400'}`}>
              {(latest.creditGrowthYoY - prev.creditGrowthYoY) > 0 ? '+' : ''}{(latest.creditGrowthYoY - prev.creditGrowthYoY).toFixed(1)}pp
            </p>
          )}
        </div>
        <div className="rounded-lg bg-slate-900/50 p-2">
          <p className="text-[10px] text-slate-500">Deposit Growth</p>
          <p className="text-sm font-bold text-emerald-400 tabular-nums">{latest.depositGrowthYoY.toFixed(1)}%</p>
        </div>
        <div className="rounded-lg bg-slate-900/50 p-2">
          <p className="text-[10px] text-slate-500">Pvt Sector</p>
          <p className="text-sm font-bold text-slate-300 tabular-nums">{latest.privateSectorCreditGrowth.toFixed(1)}%</p>
        </div>
        <div className="rounded-lg bg-slate-900/50 p-2">
          <p className="text-[10px] text-slate-500">Pub Sector</p>
          <p className="text-sm font-bold text-amber-400 tabular-nums">{latest.publicSectorCreditGrowth.toFixed(1)}%</p>
        </div>
      </div>

      {/* Dual line chart */}
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <path d={creditLine} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
        <path d={depositLine} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" />
      </svg>

      {/* Legend + gap indicator */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-sky-400 rounded" /> Credit</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-400 rounded border-dashed" /> Deposit</span>
        </div>
        <div className="text-[10px]">
          <span className="text-slate-500">Gap: </span>
          <span className={`font-medium tabular-nums ${latest.creditDepositGap > 1 ? 'text-amber-400' : 'text-slate-400'}`}>
            {latest.creditDepositGap.toFixed(1)}pp
          </span>
        </div>
      </div>

      {/* Outstanding volumes */}
      <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-500">
        <span>Credit outstanding: {latest.totalCreditOutstandingLakhCr.toFixed(1)}L Cr</span>
        <span>Deposits: {latest.totalDepositLakhCr.toFixed(1)}L Cr</span>
      </div>
    </div>
  )
}
