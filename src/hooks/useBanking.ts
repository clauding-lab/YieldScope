import { useEffect, useState } from 'react'
import { fetchLatest, fetchSeries } from '../lib/econdelta'
import { METRIC } from '../lib/econdelta-metrics'

export interface BankingData {
  nplRatio: number | null    // gross_npl_ratio (industry-wide %)
  crar: number | null        // banking_sector_crar (CAR / Basel-III %)
  nplHist: number[]          // NPL trajectory
  pvtCreditYoY: number | null // private_sector_credit_yoy_pct
  pvtCreditYoYAsOf: string | null // vintage of the pvt-credit YoY print
  cdRatio: number | null      // derived: private_sector_credit / deposits_of_the_system * 100
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
        const [npl, crar, nplSer, pcy, pc, dep] = await Promise.all([
          fetchLatest(METRIC.NPL_RATIO),
          fetchLatest(METRIC.CRAR),
          fetchSeries(METRIC.NPL_RATIO, { limit: 8 }),
          fetchLatest(METRIC.PRIV_CREDIT_YOY),
          fetchLatest(METRIC.PRIV_CREDIT),
          fetchLatest(METRIC.TOTAL_DEPOSITS),
        ])
        if (cancelled) return
        setState({
          loading: false,
          error: null,
          data: {
            nplRatio: npl?.value ?? null,
            crar:     crar?.value ?? null,
            nplHist:  nplSer.map(p => p.value),
            pvtCreditYoY: pcy?.value ?? null,
            pvtCreditYoYAsOf: pcy?.asOf ?? null,
            cdRatio: (pc?.value != null && dep?.value) ? (pc.value / dep.value) * 100 : null,
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
