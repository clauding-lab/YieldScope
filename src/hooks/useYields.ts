import { useEffect, useState } from 'react'
import { fetchLatest, fetchSeries } from '../lib/econdelta'
import { METRIC } from '../lib/econdelta-metrics'
import { spreadBps } from '../lib/yieldMath'

export type TenorKey = '91D' | '182D' | '364D' | '2Y' | '5Y' | '10Y' | '20Y'

export interface YieldsData {
  yields: Record<TenorKey, number | null>
  series: Record<TenorKey, number[]>
  // Per-tenor as_of (landmine 21): 2Y/20Y are lagged MONTHLY prints whose
  // vintage differs from the daily anchor — consumers must not date them "today".
  tenorAsOf: Record<TenorKey, string | null>
  spread10Y_91D_bps: number | null
  spread91D_SDF_bps: number | null
  asOf: string | null
}

interface UseYieldsResult {
  data: YieldsData | null
  loading: boolean
  error: Error | null
}

export function useYields(): UseYieldsResult {
  const [state, setState] = useState<UseYieldsResult>({
    data: null, loading: true, error: null,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [
          y91, y182, y364, y2y, y5y, y10y, y20y,
          s91, s182, s364, s2y, s5y, s10y, s20y,
          sdf,
        ] = await Promise.all([
          fetchLatest(METRIC.TBILL_91),
          fetchLatest(METRIC.TBILL_182),
          fetchLatest(METRIC.TBILL_364),
          fetchLatest(METRIC.YIELD_2Y_M),
          fetchLatest(METRIC.TBOND_5Y),
          fetchLatest(METRIC.TBOND_10Y),
          fetchLatest(METRIC.YIELD_20Y_M),
          fetchSeries(METRIC.TBILL_91,  { limit: 11 }),
          fetchSeries(METRIC.TBILL_182, { limit: 11 }),
          fetchSeries(METRIC.TBILL_364, { limit: 11 }),
          fetchSeries(METRIC.YIELD_2Y_M, { limit: 11 }),
          fetchSeries(METRIC.TBOND_5Y,  { limit: 11 }),
          fetchSeries(METRIC.TBOND_10Y, { limit: 11 }),
          fetchSeries(METRIC.YIELD_20Y_M, { limit: 11 }),
          fetchLatest(METRIC.POLICY_RATE_SDF),
        ])
        if (cancelled) return

        const v91  = y91?.value  ?? null
        const v182 = y182?.value ?? null
        const v364 = y364?.value ?? null
        const v2y  = y2y?.value  ?? null
        const v5y  = y5y?.value  ?? null
        const v10y = y10y?.value ?? null
        const v20y = y20y?.value ?? null
        const vSdf = sdf?.value ?? null

        setState({
          loading: false,
          error: null,
          data: {
            yields: { '91D': v91, '182D': v182, '364D': v364, '2Y': v2y, '5Y': v5y, '10Y': v10y, '20Y': v20y },
            series: {
              '91D':  s91.map(p => p.value),
              '182D': s182.map(p => p.value),
              '364D': s364.map(p => p.value),
              '2Y':   s2y.map(p => p.value),
              '5Y':   s5y.map(p => p.value),
              '10Y':  s10y.map(p => p.value),
              '20Y':  s20y.map(p => p.value),
            },
            tenorAsOf: {
              '91D': y91?.asOf ?? null, '182D': y182?.asOf ?? null, '364D': y364?.asOf ?? null,
              '2Y': y2y?.asOf ?? null, '5Y': y5y?.asOf ?? null, '10Y': y10y?.asOf ?? null, '20Y': y20y?.asOf ?? null,
            },
            spread10Y_91D_bps: spreadBps(v10y, v91),
            spread91D_SDF_bps: spreadBps(v91, vSdf),
            asOf: y91?.asOf ?? y10y?.asOf ?? null,
          },
        })
      } catch (e) {
        if (cancelled) return
        setState({ data: null, loading: false, error: e as Error })
      }
    })()
    return () => { cancelled = true }
  }, [])

  return state
}
