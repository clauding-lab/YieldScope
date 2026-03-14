import { useEffect, useRef, useState } from 'react'
import { createChart, type IChartApi, type ISeriesApi, LineSeries, type LineSeriesOptions } from 'lightweight-charts'
import type { YieldData, Tenor } from '../../types'
import { TENORS } from '../../types'
import { TENOR_COLORS, TENOR_SHORT } from '../../utils/constants'

interface YieldTimeSeriesChartProps {
  yieldData: YieldData
  policyEvents?: Array<{ date: string; title: string }> // TODO: render as chart markers in future
}

type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'All'

export function YieldTimeSeriesChart({ yieldData, policyEvents: _policyEvents }: YieldTimeSeriesChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRefs = useRef<Map<Tenor, ISeriesApi<'Line'>>>(new Map())
  const [selectedTenors, setSelectedTenors] = useState<Set<Tenor>>(new Set(['91D', '364D', '5Y', '10Y']))
  const [timeRange, setTimeRange] = useState<TimeRange>('All')

  // Create/destroy chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { color: '#0f172a' },
        textColor: '#94a3b8',
        fontSize: 11,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: '#1e293b' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#475569', labelBackgroundColor: '#1e293b' },
        horzLine: { color: '#475569', labelBackgroundColor: '#1e293b' },
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: false,
      },
      rightPriceScale: {
        borderColor: '#334155',
      },
    })

    chartRef.current = chart

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width })
      }
    })
    resizeObserver.observe(chartContainerRef.current)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRefs.current.clear()
    }
  }, [])

  // Update series data when tenors or data change
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    // Remove all existing series
    for (const [, series] of seriesRefs.current) {
      chart.removeSeries(series)
    }
    seriesRefs.current.clear()

    // Sort daily data by date ascending
    const sorted = [...yieldData.daily].sort((a, b) => a.date.localeCompare(b.date))

    // Filter by time range
    const now = new Date()
    const rangeMonths: Record<TimeRange, number> = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12, 'All': 999 }
    const cutoffDate = new Date(now)
    cutoffDate.setMonth(cutoffDate.getMonth() - rangeMonths[timeRange])
    const filtered = sorted.filter((d) => new Date(d.date) >= cutoffDate)

    // Add series for each selected tenor
    for (const tenor of TENORS) {
      if (!selectedTenors.has(tenor)) continue

      const series = chart.addSeries(LineSeries, {
        color: TENOR_COLORS[tenor],
        lineWidth: 2,
        title: TENOR_SHORT[tenor],
        priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
        crosshairMarkerVisible: true,
      } as LineSeriesOptions)

      const seriesData = filtered
        .filter((d) => d.yields[tenor] != null)
        .map((d) => ({
          time: d.date as string,
          value: d.yields[tenor],
        }))

      if (seriesData.length > 0) {
        series.setData(seriesData)
      }

      seriesRefs.current.set(tenor, series)
    }

    chart.timeScale().fitContent()
  }, [yieldData, selectedTenors, timeRange, _policyEvents])

  function toggleTenor(tenor: Tenor) {
    setSelectedTenors((prev) => {
      const next = new Set(prev)
      if (next.has(tenor)) {
        if (next.size > 1) next.delete(tenor) // Keep at least one
      } else {
        next.add(tenor)
      }
      return next
    })
  }

  const TIME_RANGES: TimeRange[] = ['1M', '3M', '6M', '1Y', 'All']

  return (
    <div className="bg-surface rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-300">Yield History</h3>
        <div className="flex gap-1">
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`text-[10px] px-2 py-0.5 rounded-full transition-all ${
                timeRange === range
                  ? 'bg-accent/20 text-accent border border-accent/40'
                  : 'text-slate-500 border border-slate-700/50 hover:text-slate-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-3">
        {TENORS.map((tenor) => (
          <button
            key={tenor}
            onClick={() => toggleTenor(tenor)}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
              selectedTenors.has(tenor)
                ? 'border-opacity-60 text-white'
                : 'border-slate-700/50 text-slate-600'
            }`}
            style={
              selectedTenors.has(tenor)
                ? { borderColor: TENOR_COLORS[tenor], backgroundColor: `${TENOR_COLORS[tenor]}20`, color: TENOR_COLORS[tenor] }
                : undefined
            }
          >
            {TENOR_SHORT[tenor]}
          </button>
        ))}
      </div>

      <div ref={chartContainerRef} className="w-full" />
    </div>
  )
}
