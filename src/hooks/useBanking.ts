import { useEffect, useState } from 'react'
import { fetchLatest, fetchSeries } from '../lib/econdelta'
import { METRIC } from '../lib/econdelta-metrics'
import { gateMetric, CAR_BAND, NPL_BAND } from '../lib/plausibility'

export interface BankingData {
  nplRatio: number | null    // gross_npl_ratio (industry-wide %), plausibility-gated
  nplVintage: string | null  // vintage of the (quarterly) NPL print, e.g. "Mar '26"
  nplStale: boolean          // NPL older than the quarterly max-age
  crar: number | null        // banking_sector_crar (CAR / Basel-III %) — null when implausible/absent
  crarVintage: string | null // vintage of the CAR print, e.g. "Sep '25"
  crarStale: boolean         // CAR older than the quarterly max-age
  crarImplausible: boolean   // CAR present but outside the plausibility band (e.g. fabricated 1.56)
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
        // Plausibility + vintage gate: CAR and NPL are quarterly. A fabricated
        // or badly-stale print is nulled/flagged here rather than rendered clean.
        const nplGate = gateMetric(npl?.value, npl?.asOf, { band: NPL_BAND, cadence: 'quarterly' })
        const crarGate = gateMetric(crar?.value, crar?.asOf, { band: CAR_BAND, cadence: 'quarterly' })
        setState({
          loading: false,
          error: null,
          data: {
            nplRatio: nplGate.value,
            nplVintage: nplGate.vintage,
            nplStale: nplGate.stale,
            crar: crarGate.value,
            crarVintage: crarGate.vintage,
            crarStale: crarGate.stale,
            crarImplausible: crarGate.implausible,
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
