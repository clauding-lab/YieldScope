import { useEffect, useState } from 'react'
import { fetchLatest } from '../lib/econdelta'
import { METRIC } from '../lib/econdelta-metrics'

export interface YieldsData {
  yields: {
    '91D':  number | null
    '182D': number | null
    '364D': number | null
    '5Y':   number | null
    '10Y':  number | null
  }
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
        const [y91, y182, y364, y5y, y10y] = await Promise.all([
          fetchLatest(METRIC.TBILL_91),
          fetchLatest(METRIC.TBILL_182),
          fetchLatest(METRIC.TBILL_364),
          fetchLatest(METRIC.TBOND_5Y),
          fetchLatest(METRIC.TBOND_10Y),
        ])
        if (cancelled) return

        const v91  = y91?.value  ?? null
        const v182 = y182?.value ?? null
        const v364 = y364?.value ?? null
        const v5y  = y5y?.value  ?? null
        const v10y = y10y?.value ?? null

        const spread = v91 != null && v10y != null
          ? Math.round((v10y - v91) * 100)
          : null

        setState({
          loading: false,
          error: null,
          data: {
            yields: { '91D': v91, '182D': v182, '364D': v364, '5Y': v5y, '10Y': v10y },
            spread10Y_91D_bps: spread,
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
