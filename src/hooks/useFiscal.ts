import { useEffect, useState } from 'react'
import { fetchLatest } from '../lib/econdelta'
import { METRIC } from '../lib/econdelta-metrics'

export interface FiscalData {
  revenuePct: number | null            // total_revenue_budget_vs_actual (% of target)
  adpPct: number | null                // budget_adpex_of_the_fy_vs_utilization
  taxToGdp: number | null              // tax_gdp_ratio
  domesticBorrowingCr: number | null   // domestic_borrowing_for_budget_deficit (crore)
  asOf: string | null
}

interface UseFiscalResult {
  data: FiscalData | null
  loading: boolean
  error: Error | null
}

export function useFiscal(): UseFiscalResult {
  const [state, setState] = useState<UseFiscalResult>({
    data: null, loading: true, error: null,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [rev, adp, tgd, dom] = await Promise.all([
          fetchLatest(METRIC.TOTAL_REV),
          fetchLatest(METRIC.BUDGET_ADPEX),
          fetchLatest(METRIC.TAX_GDP),
          fetchLatest(METRIC.DOMESTIC_BORROW),
        ])
        if (cancelled) return
        setState({
          loading: false,
          error: null,
          data: {
            revenuePct:          rev?.value ?? null,
            adpPct:              adp?.value ?? null,
            taxToGdp:            tgd?.value ?? null,
            domesticBorrowingCr: dom?.value ?? null,
            asOf:                rev?.asOf ?? null,
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
