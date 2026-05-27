import { useEffect, useState } from 'react'
import { fetchLatest, fetchSeries } from '../lib/econdelta'
import { METRIC } from '../lib/econdelta-metrics'

export interface BankingData {
  nplRatio: number | null    // gross_npl_ratio (industry-wide %)
  crar: number | null        // banking_sector_crar (CAR / Basel-III %)
  nplHist: number[]          // NPL trajectory
  asOf: string | null
}

interface UseBankingResult {
  data: BankingData | null
  loading: boolean
  error: Error | null
}

export function useBanking(): UseBankingResult {
  const [state, setState] = useState<UseBankingResult>({
    data: null, loading: true, error: null,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [npl, crar, nplSer] = await Promise.all([
          fetchLatest(METRIC.NPL_RATIO),
          fetchLatest(METRIC.CRAR),
          fetchSeries(METRIC.NPL_RATIO, { limit: 8 }),
        ])
        if (cancelled) return
        setState({
          loading: false,
          error: null,
          data: {
            nplRatio: npl?.value ?? null,
            crar:     crar?.value ?? null,
            nplHist:  nplSer.map(p => p.value),
            asOf:     npl?.asOf ?? null,
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
