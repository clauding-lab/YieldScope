import { useMemo } from 'react'
import { DataTimestamp } from '../ui/DataTimestamp'
import type { MacroSnapshot } from '../../types'

interface FxReservesPanelProps {
  snapshots: MacroSnapshot[]
  lastUpdated: string
}

export function FxReservesPanel({ snapshots, lastUpdated }: FxReservesPanelProps) {
  const sorted = useMemo(() => [...snapshots].sort((a, b) => a.date.localeCompare(b.date)), [snapshots])
  const latest = sorted[sorted.length - 1]
  const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null

  const sparklinePoints = useMemo(() => {
    const data = sorted.map(s => s.bbFxReservesBn)
    if (data.length < 2) return ''
    const min = Math.min(...data) * 0.95
    const max = Math.max(...data) * 1.05
    const range = max - min || 1
    const w = 200
    const h = 50
    return data.map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / range) * h
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
  }, [snapshots])

  const importCoverMonths = latest.bbFxReservesBn / 6.5 // rough monthly import ~$6.5bn

  return (
    <div className="rounded-xl bg-slate-800/80 border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-300">FX Reserves & Exchange Rate</h2>
          <p className="text-[10px] text-slate-500">BB gross reserves & BDT/USD rate</p>
        </div>
        <DataTimestamp lastUpdated={lastUpdated} frequency="weekly" compact />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-lg bg-slate-900/50 p-3">
          <p className="text-[10px] text-slate-500 mb-1">Gross Reserves</p>
          <p className="text-xl font-bold text-sky-400 tabular-nums">${latest.bbFxReservesBn.toFixed(1)}B</p>
          {prev && (
            <p className={`text-[10px] tabular-nums ${latest.bbFxReservesBn > prev.bbFxReservesBn ? 'text-emerald-400' : 'text-red-400'}`}>
              {latest.bbFxReservesBn > prev.bbFxReservesBn ? '+' : ''}
              ${(latest.bbFxReservesBn - prev.bbFxReservesBn).toFixed(2)}B
            </p>
          )}
        </div>
        <div className="rounded-lg bg-slate-900/50 p-3">
          <p className="text-[10px] text-slate-500 mb-1">USD/BDT Rate</p>
          <p className="text-xl font-bold text-slate-200 tabular-nums">{latest.usdBdtRate.toFixed(2)}</p>
          <p className={`text-[10px] tabular-nums ${latest.usdBdtChange30d < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {latest.usdBdtChange30d > 0 ? '+' : ''}{latest.usdBdtChange30d.toFixed(2)} (30d)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-lg bg-slate-900/50 p-2">
          <p className="text-[10px] text-slate-500">Import Cover</p>
          <p className="text-sm font-semibold text-slate-300 tabular-nums">{importCoverMonths.toFixed(1)} months</p>
        </div>
        <div className="rounded-lg bg-slate-900/50 p-2">
          <p className="text-[10px] text-slate-500">ADR</p>
          <p className="text-sm font-semibold text-slate-300 tabular-nums">{latest.advanceDepositRatio.toFixed(1)}%</p>
        </div>
      </div>

      {/* Sparkline */}
      {sparklinePoints && (
        <div className="mt-2">
          <p className="text-[10px] text-slate-500 mb-1">Reserve Trend</p>
          <svg viewBox="0 0 200 50" className="w-full h-12">
            <path d={sparklinePoints} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  )
}
