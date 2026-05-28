import { useEffect, useState } from 'react'
import { fetchLatest, fetchSeries } from '../lib/econdelta'
import { METRIC } from '../lib/econdelta-metrics'
import { spreadBps } from '../lib/yieldMath'

export type TenorKey = '91D' | '182D' | '364D' | '5Y' | '10Y'

export interface YieldsData {
  yields: Record<TenorKey, number | null>
  series: Record<TenorKey, number[]>
  spread10Y_91D_bps: number | null
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
          y91, y182, y364, y5y, y10y,
          s91, s182, s364, s5y, s10y,
        ] = await Promise.all([
          fetchLatest(METRIC.TBILL_91),
          fetchLatest(METRIC.TBILL_182),
          fetchLatest(METRIC.TBILL_364),
          fetchLatest(METRIC.TBOND_5Y),
          fetchLatest(METRIC.TBOND_10Y),
          fetchSeries(METRIC.TBILL_91,  { limit: 11 }),
          fetchSeries(METRIC.TBILL_182, { limit: 11 }),
          fetchSeries(METRIC.TBILL_364, { limit: 11 }),
          fetchSeries(METRIC.TBOND_5Y,  { limit: 11 }),
          fetchSeries(METRIC.TBOND_10Y, { limit: 11 }),
        ])
        if (cancelled) return

        const v91  = y91?.value  ?? null
        const v182 = y182?.value ?? null
        const v364 = y364?.value ?? null
        const v5y  = y5y?.value  ?? null
        const v10y = y10y?.value ?? null

        setState({
          loading: false,
          error: null,
          data: {
            yields: { '91D': v91, '182D': v182, '364D': v364, '5Y': v5y, '10Y': v10y },
            series: {
              '91D':  s91.map(p => p.value),
              '182D': s182.map(p => p.value),
              '364D': s364.map(p => p.value),
              '5Y':   s5y.map(p => p.value),
              '10Y':  s10y.map(p => p.value),
            },
            spread10Y_91D_bps: spreadBps(v10y, v91),
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
