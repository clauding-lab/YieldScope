import { useMemo } from 'react'
import type { FiscalData } from '../../types'
import type { BorrowingData } from '../../types'

interface FiscalPressureGaugeProps {
  fiscalData: FiscalData
  borrowingData: BorrowingData | null
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export function FiscalPressureGauge({ fiscalData, borrowingData }: FiscalPressureGaugeProps) {
  const score = useMemo(() => {
    let total = 0
    let factors = 0

    // Revenue collection ratio (lower = more pressure)
    const revScore = 100 - clamp(fiscalData.revenue.collectionRatioPct, 40, 100) / 100 * 100
    total += revScore * 0.25
    factors++

    // ADP implementation (lower = less spending, less pressure)
    const adpScore = clamp(fiscalData.adp.implementationRatePct, 0, 100) / 100 * 30
    total += adpScore
    factors++

    // Debt-to-GDP
    const debtScore = clamp((fiscalData.debt.debtToGdpPct - 30) / 30, 0, 1) * 100
    total += debtScore * 0.25
    factors++

    // Interest-to-revenue
    const intScore = clamp((fiscalData.debt.interestToRevenuePct - 10) / 30, 0, 1) * 100
    total += intScore * 0.25
    factors++

    // Borrowing pace
    if (borrowingData) {
      const borrowScore = clamp((borrowingData.actual.pctOfBudgetTarget - 50) / 50, 0, 1) * 100
      total += borrowScore * 0.2
      factors++
    }

    return clamp(total / factors * (factors > 3 ? 1.2 : 1), 0, 100)
  }, [fiscalData, borrowingData])

  const label = score < 30 ? 'Low Pressure' : score < 60 ? 'Moderate' : score < 80 ? 'Elevated' : 'High Pressure'
  const color = score < 30 ? 'text-emerald-400' : score < 60 ? 'text-amber-400' : score < 80 ? 'text-orange-400' : 'text-red-400'
  const barColor = score < 30 ? 'bg-emerald-500' : score < 60 ? 'bg-amber-500' : score < 80 ? 'bg-orange-500' : 'bg-red-500'

  return (
    <div className="rounded-xl bg-slate-800/80 border border-slate-700/50 p-4">
      <h2 className="text-sm font-semibold text-slate-300 mb-1">Fiscal Pressure Composite</h2>
      <p className="text-[10px] text-slate-500 mb-3">
        Weighted score combining revenue, expenditure, debt, and borrowing pace
      </p>

      <div className="flex items-center gap-4 mb-3">
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="4" />
            <circle
              cx="18" cy="18" r="14" fill="none"
              stroke={score < 30 ? '#10b981' : score < 60 ? '#f59e0b' : score < 80 ? '#f97316' : '#ef4444'}
              strokeWidth="4"
              strokeDasharray={`${score * 0.88} 88`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-slate-200 tabular-nums">{score.toFixed(0)}</span>
          </div>
        </div>
        <div>
          <p className={`text-sm font-semibold ${color}`}>{label}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Score: {score.toFixed(1)} / 100</p>
        </div>
      </div>

      {/* Component breakdown */}
      <div className="space-y-1.5 text-[10px]">
        <FactorRow label="Revenue Gap" value={100 - fiscalData.revenue.collectionRatioPct} barColor={barColor} />
        <FactorRow label="ADP Spending" value={fiscalData.adp.implementationRatePct} barColor="bg-sky-500" />
        <FactorRow label="Debt/GDP" value={fiscalData.debt.debtToGdpPct} barColor={barColor} max={60} />
        <FactorRow label="Interest/Revenue" value={fiscalData.debt.interestToRevenuePct} barColor={barColor} max={40} />
      </div>
    </div>
  )
}

function FactorRow({ label, value, barColor, max = 100 }: { label: string; value: number; barColor: string; max?: number }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-500 w-24">{label}</span>
      <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-slate-400 tabular-nums w-10 text-right">{value.toFixed(1)}%</span>
    </div>
  )
}
