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
  crarImplausible: boolean   // CAR present but outside the plausibility band (data fault)
  crarQualifier: string | null // provenance qualifier keyed to the SPECIFIC print (null for prints with no known qualifier)
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

// Provenance qualifiers keyed to the SPECIFIC print they describe (#25 review
// HIGH): "BB QFSAR pre-shock" is a claim about the Sep-2025 print ONLY — it
// was verified against that QFSAR PDF (p13). A newer quarterly print must
// render with its vintage alone and NEVER inherit the label, or a routine data
// refresh would silently attach a false provenance to a money-critical metric.
// When BB publishes the next QFSAR and its print is verified, add its date here.
const CRAR_PRINT_QUALIFIERS: Record<string, string> = {
  '2025-09-30': 'BB QFSAR pre-shock',
}

/** Qualifier for the print at `asOf`, or null when none is known for that date. */
export function crarQualifierFor(asOf: string | null | undefined): string | null {
  if (!asOf) return null
  return CRAR_PRINT_QUALIFIERS[asOf.slice(0, 10)] ?? null
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
        // Plausibility + vintage gate: CAR and NPL are quarterly. A data-fault
        // print (outside the band) is nulled; a badly-stale print is flagged.
        // NOTE: the low CAR (1.56%, Sep-2025) is REAL — BB QFSAR pre-shock
        // system CAR — and renders with a provenance label (owner decision
        // 2026-07-09), so the band admits distress figures down to -50.
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
            // Only attach the qualifier when the rendered value is the print it
            // describes (gated-out values carry no qualifier either).
            crarQualifier: crarGate.value != null ? crarQualifierFor(crar?.asOf) : null,
            // Gate the series too: a bad point must not render in the trend
            // chart while the headline is gated (same band as the headline).
            nplHist:  nplSer.map(p => p.value).filter(v => v >= NPL_BAND.min && v <= NPL_BAND.max),
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
