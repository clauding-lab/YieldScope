import { useMemo } from 'react'
import { DataTimestamp } from '../ui/DataTimestamp'
import { useYieldData } from '../../hooks/useYieldData'
import { useMoneySupplyData } from '../../hooks/useMoneySupplyData'
import { useMacroData } from '../../hooks/useMacroData'
import type { MarketSnapshot } from '../../types/alerts'

export function MarketSnapshotCards() {
  const { data: yieldData } = useYieldData()
  const { data: moneySupplyData } = useMoneySupplyData()
  const { data: macroData } = useMacroData()

  const snapshots = useMemo<MarketSnapshot[]>(() => {
    const cards: MarketSnapshot[] = []

    // 1. 91D T-bill Yield
    if (yieldData?.daily?.length) {
      const latest = yieldData.daily[yieldData.daily.length - 1]
      const prev = yieldData.daily.length > 1 ? yieldData.daily[yieldData.daily.length - 2] : null
      const y91 = latest.yields['91D']
      const prevY91 = prev?.yields['91D'] ?? y91
      const sparkline = yieldData.daily.slice(-8).map(d => d.yields['91D'] ?? 0)
      cards.push({
        label: '91D T-bill',
        value: y91,
        unit: '%',
        change: +(y91 - prevY91).toFixed(2),
        changeDirection: y91 > prevY91 ? 'up' : y91 < prevY91 ? 'down' : 'flat',
        sparkline,
        source: 'BB auction results',
        lastUpdated: yieldData.lastUpdated,
      })
    }

    // 2. 10Y BGTB Yield
    if (yieldData?.daily?.length) {
      const latest = yieldData.daily[yieldData.daily.length - 1]
      const prev = yieldData.daily.length > 1 ? yieldData.daily[yieldData.daily.length - 2] : null
      const y10 = latest.yields['10Y']
      const prevY10 = prev?.yields['10Y'] ?? y10
      const sparkline = yieldData.daily.slice(-8).map(d => d.yields['10Y'] ?? 0)
      cards.push({
        label: '10Y BGTB',
        value: y10,
        unit: '%',
        change: +(y10 - prevY10).toFixed(2),
        changeDirection: y10 > prevY10 ? 'up' : y10 < prevY10 ? 'down' : 'flat',
        sparkline,
        source: 'BB revaluation',
        lastUpdated: yieldData.lastUpdated,
      })
    }

    // 3. Call Money Rate
    if (moneySupplyData?.monthly?.length) {
      const latest = moneySupplyData.monthly[moneySupplyData.monthly.length - 1]
      const prev = moneySupplyData.monthly.length > 1 ? moneySupplyData.monthly[moneySupplyData.monthly.length - 2] : null
      const sparkline = moneySupplyData.monthly.slice(-6).map(d => d.callMoneyRate)
      cards.push({
        label: 'Call Money',
        value: latest.callMoneyRate,
        unit: '%',
        change: prev ? +(latest.callMoneyRate - prev.callMoneyRate).toFixed(2) : 0,
        changeDirection: prev ? (latest.callMoneyRate > prev.callMoneyRate ? 'up' : latest.callMoneyRate < prev.callMoneyRate ? 'down' : 'flat') : 'flat',
        sparkline,
        source: 'BB daily data',
        lastUpdated: moneySupplyData.lastUpdated,
      })
    }

    // 4. Excess Liquidity
    if (moneySupplyData?.monthly?.length) {
      const latest = moneySupplyData.monthly[moneySupplyData.monthly.length - 1]
      const prev = moneySupplyData.monthly.length > 1 ? moneySupplyData.monthly[moneySupplyData.monthly.length - 2] : null
      const sparkline = moneySupplyData.monthly.slice(-6).map(d => d.excessLiquidityCrore / 100000)
      cards.push({
        label: 'Excess Liq.',
        value: +(latest.excessLiquidityCrore / 100000).toFixed(1),
        unit: 'L Cr',
        change: prev ? +((latest.excessLiquidityCrore - prev.excessLiquidityCrore) / 100000).toFixed(1) : 0,
        changeDirection: prev ? (latest.excessLiquidityCrore > prev.excessLiquidityCrore ? 'up' : latest.excessLiquidityCrore < prev.excessLiquidityCrore ? 'down' : 'flat') : 'flat',
        sparkline,
        source: 'BB monetary data',
        lastUpdated: moneySupplyData.lastUpdated,
      })
    }

    // 5. CPI Inflation
    if (macroData?.snapshots?.length) {
      const latest = macroData.snapshots[macroData.snapshots.length - 1]
      const prev = macroData.snapshots.length > 1 ? macroData.snapshots[macroData.snapshots.length - 2] : null
      const sparkline = macroData.snapshots.slice(-6).map(d => d.cpiHeadlineYoY)
      cards.push({
        label: 'CPI Inflation',
        value: latest.cpiHeadlineYoY,
        unit: '%',
        change: prev ? +(latest.cpiHeadlineYoY - prev.cpiHeadlineYoY).toFixed(2) : 0,
        changeDirection: prev ? (latest.cpiHeadlineYoY > prev.cpiHeadlineYoY ? 'up' : latest.cpiHeadlineYoY < prev.cpiHeadlineYoY ? 'down' : 'flat') : 'flat',
        sparkline,
        source: 'BBS monthly',
        lastUpdated: macroData.lastUpdated,
      })
    }

    // 6. FX Reserves
    if (macroData?.snapshots?.length) {
      const latest = macroData.snapshots[macroData.snapshots.length - 1]
      const prev = macroData.snapshots.length > 1 ? macroData.snapshots[macroData.snapshots.length - 2] : null
      const sparkline = macroData.snapshots.slice(-6).map(d => d.bbFxReservesBn)
      cards.push({
        label: 'FX Reserves',
        value: latest.bbFxReservesBn,
        unit: 'USD Bn',
        change: prev ? +(latest.bbFxReservesBn - prev.bbFxReservesBn).toFixed(2) : 0,
        changeDirection: prev ? (latest.bbFxReservesBn > prev.bbFxReservesBn ? 'up' : latest.bbFxReservesBn < prev.bbFxReservesBn ? 'down' : 'flat') : 'flat',
        sparkline,
        source: 'BB publications',
        lastUpdated: macroData.lastUpdated,
      })
    }

    return cards
  }, [yieldData, moneySupplyData, macroData])

  if (snapshots.length === 0) {
    return (
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6 text-center">
        <p className="text-xs text-slate-500">Loading market data...</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {snapshots.map((snap) => (
        <SnapshotCard key={snap.label} snapshot={snap} />
      ))}
    </div>
  )
}

function SnapshotCard({ snapshot }: { snapshot: MarketSnapshot }) {
  const changeColor =
    snapshot.changeDirection === 'up' ? 'text-red-400' :
    snapshot.changeDirection === 'down' ? 'text-emerald-400' :
    'text-slate-500'

  const arrow =
    snapshot.changeDirection === 'up' ? '↑' :
    snapshot.changeDirection === 'down' ? '↓' :
    '→'

  // Mini sparkline SVG
  const sparklinePoints = useMemo(() => {
    if (!snapshot.sparkline.length) return ''
    const min = Math.min(...snapshot.sparkline)
    const max = Math.max(...snapshot.sparkline)
    const range = max - min || 1
    const width = 60
    const height = 20
    return snapshot.sparkline
      .map((v, i) => {
        const x = (i / (snapshot.sparkline.length - 1)) * width
        const y = height - ((v - min) / range) * height
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }, [snapshot.sparkline])

  return (
    <div className="rounded-lg bg-slate-800/80 border border-slate-700/50 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-slate-500 font-medium">{snapshot.label}</span>
        <DataTimestamp lastUpdated={snapshot.lastUpdated} compact />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-bold text-slate-100 tabular-nums">
          {snapshot.value.toFixed(snapshot.unit === '%' ? 2 : 1)}
        </span>
        <span className="text-[10px] text-slate-500">{snapshot.unit}</span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className={`text-[10px] font-medium tabular-nums ${changeColor}`}>
          {arrow} {snapshot.change > 0 ? '+' : ''}{snapshot.change.toFixed(2)}
        </span>
        {sparklinePoints && (
          <svg width="60" height="20" className="flex-shrink-0">
            <path
              d={sparklinePoints}
              fill="none"
              stroke={snapshot.changeDirection === 'up' ? '#f87171' : snapshot.changeDirection === 'down' ? '#34d399' : '#64748b'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </div>
  )
}
