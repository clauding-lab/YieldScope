import { useEffect, useState } from 'react'
import { fetchLatest } from '../lib/econdelta'
import { METRIC } from '../lib/econdelta-metrics'

export interface DashboardData {
  tbill91: number | null
  tbond10: number | null
  callMoney: number | null
  cpiHeadline: number | null
  spread10Y_91D_bps: number | null
  asOf: string | null
}

interface UseDashboardResult {
  data: DashboardData | null
  loading: boolean
  error: Error | null
}

export function useDashboard(): UseDashboardResult {
  const [state, setState] = useState<UseDashboardResult>({
    data: null, loading: true, error: null,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [t91, t10, call, cpi] = await Promise.all([
          fetchLatest(METRIC.TBILL_91),
          fetchLatest(METRIC.TBOND_10Y),
          fetchLatest(METRIC.CALL_MONEY),
          fetchLatest(METRIC.CPI_HEADLINE),
        ])
        if (cancelled) return

        const v91  = t91?.value  ?? null
        const v10y = t10?.value  ?? null
        const spread = v91 != null && v10y != null
          ? Math.round((v10y - v91) * 100)
          : null

        setState({
          loading: false,
          error: null,
          data: {
            tbill91:           v91,
            tbond10:           v10y,
            callMoney:         call?.value ?? null,
            cpiHeadline:       cpi?.value ?? null,
            spread10Y_91D_bps: spread,
            asOf:              t91?.asOf ?? call?.asOf ?? cpi?.asOf ?? null,
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
