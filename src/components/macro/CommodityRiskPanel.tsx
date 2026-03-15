import { useMemo } from 'react'
import { DataTimestamp } from '../ui/DataTimestamp'
import type { CommodityData } from '../../types'

interface CommodityRiskPanelProps {
  data: CommodityData
}

export function CommodityRiskPanel({ data }: CommodityRiskPanelProps) {
  const { oil, lng, gold, importBillImpact } = data

  return (
    <div className="rounded-xl bg-slate-800/80 border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-300">Commodity & Energy Risk</h2>
          <p className="text-[10px] text-slate-500">Oil, LNG, gold prices and import bill exposure</p>
        </div>
        <DataTimestamp lastUpdated={data.lastUpdated} frequency="daily" compact />
      </div>

      {/* Price cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <PriceCard
          label="Brent Crude"
          value={oil.brentUsd}
          unit="$/bbl"
          change={oil.change30d}
          history={oil.history.map(h => h.price)}
          color="#f59e0b"
        />
        <PriceCard
          label="JKM LNG"
          value={lng.jkmUsdMmbtu}
          unit="$/mmbtu"
          change={lng.change30d}
          history={lng.history.map(h => h.price)}
          color="#38bdf8"
        />
        <PriceCard
          label="Gold"
          value={gold.priceUsd}
          unit="$/oz"
          change={gold.change30d}
          history={gold.history.map(h => h.price)}
          color="#fbbf24"
        />
      </div>

      {/* Import bill impact */}
      <div className="rounded-lg bg-slate-900/50 p-3">
        <p className="text-[10px] text-slate-500 font-medium mb-2">Import Bill Exposure</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-slate-500">Monthly Oil Import</p>
            <p className="text-sm font-semibold text-slate-200 tabular-nums">${importBillImpact.monthlyOilImportBnUsd.toFixed(2)}B</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">Monthly LNG Import</p>
            <p className="text-sm font-semibold text-slate-200 tabular-nums">${importBillImpact.monthlyLngImportBnUsd.toFixed(2)}B</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">Annual Energy Bill (est.)</p>
            <p className="text-sm font-semibold text-amber-400 tabular-nums">${importBillImpact.estimatedAnnualEnergyBnUsd.toFixed(1)}B</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">ME Dependency</p>
            <p className="text-sm font-semibold text-slate-200 tabular-nums">
              Oil {importBillImpact.oilDependencyPct}% / LNG {importBillImpact.lngDependencyPct}%
            </p>
          </div>
        </div>
      </div>

      {/* Transmission chain */}
      <div className="mt-3 px-2">
        <p className="text-[10px] text-slate-500 font-medium mb-1">Risk Transmission Chain</p>
        <div className="flex items-center gap-1 text-[9px] text-slate-400 flex-wrap">
          <span className="px-1.5 py-0.5 bg-red-900/30 border border-red-800/30 rounded">Oil +$10</span>
          <span className="text-slate-600">&rarr;</span>
          <span className="px-1.5 py-0.5 bg-slate-700/50 rounded">Import bill +$1.2B/yr</span>
          <span className="text-slate-600">&rarr;</span>
          <span className="px-1.5 py-0.5 bg-slate-700/50 rounded">USD demand &uarr;</span>
          <span className="text-slate-600">&rarr;</span>
          <span className="px-1.5 py-0.5 bg-slate-700/50 rounded">BB sells reserves</span>
          <span className="text-slate-600">&rarr;</span>
          <span className="px-1.5 py-0.5 bg-amber-900/30 border border-amber-800/30 rounded">BDT liquidity &darr;</span>
          <span className="text-slate-600">&rarr;</span>
          <span className="px-1.5 py-0.5 bg-amber-900/30 border border-amber-800/30 rounded">T-bill yields &uarr;</span>
        </div>
      </div>
    </div>
  )
}

function PriceCard({ label, value, unit, change, history, color }: {
  label: string
  value: number
  unit: string
  change: number
  history: number[]
  color: string
}) {
  const sparkline = useMemo(() => {
    if (history.length < 2) return ''
    const min = Math.min(...history) * 0.95
    const max = Math.max(...history) * 1.05
    const range = max - min || 1
    const w = 50
    const h = 20
    return history.map((v, i) => {
      const x = (i / (history.length - 1)) * w
      const y = h - ((v - min) / range) * h
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
  }, [history])

  const isLargeValue = value >= 1000

  return (
    <div className="rounded-lg bg-slate-900/50 p-2">
      <p className="text-[10px] text-slate-500 truncate">{label}</p>
      <p className="text-sm font-bold text-slate-200 tabular-nums">
        {isLargeValue ? value.toFixed(0) : value.toFixed(2)}
      </p>
      <p className="text-[9px] text-slate-600">{unit}</p>
      <div className="flex items-center justify-between mt-1">
        <span className={`text-[10px] tabular-nums font-medium ${change < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {change > 0 ? '+' : ''}{change.toFixed(1)}
        </span>
        {sparkline && (
          <svg width="50" height="20">
            <path d={sparkline} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  )
}
