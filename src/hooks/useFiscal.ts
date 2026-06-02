import { useEffect, useState } from 'react'
import { fetchLatest, fetchSeries, type MetricPoint } from '../lib/econdelta'
import { METRIC } from '../lib/econdelta-metrics'

export interface FiscalData {
  revenuePct: number | null            // total_revenue_budget_vs_actual (% of target)
  adpPct: number | null                // budget_adpex_of_the_fy_vs_utilization
  taxToGdp: number | null              // tax_gdp_ratio
  domesticBorrowingCr: number | null   // domestic_borrowing_for_budget_deficit (crore)
  debtGdpRatio: number | null          // debt_gdp_ratio — latest COMPLETE-YEAR actual (% of GDP)
  debtGdpAsOf: string | null           // vintage of that actual (e.g. '2025-12-31')
  debtGdpHist: number[]                // year-end actuals, ascending (for the area chart)
  debtDomesticCr: number | null        // debt_domestic_stock_cr (BDT crore, absolute stock)
  debtExternalCr: number | null        // debt_external_stock_cr (BDT crore, absolute stock)
  debtStockAsOf: string | null         // vintage of the stock figures
  imfEffSdrMn: number | null           // imf_eff_outstanding_sdr_mn (SDR million)
  imfEffAsOf: string | null
  asOf: string | null
}

interface UseFiscalResult {
  data: FiscalData | null
  loading: boolean
  error: Error | null
}

/**
 * `debt_gdp_ratio` conflates three things in one series: IMF annual actuals (Dec-31 dated),
 * IMF projections (future Dec-31 dated), and one off-cycle MoF daily print (a non-year-end date).
 * The honest "current Debt/GDP" is the latest COMPLETE-YEAR actual: a Dec-31 row dated on/before
 * today. This drops the projections (future-dated) and the off-cycle print (not a year-end), so the
 * headline and the history chart stay consistent (landmines 15/18 — no false trend, no relabelling).
 */
export function selectDebtGdpActuals(
  series: readonly MetricPoint[],
  now: Date,
): { latest: MetricPoint | null; hist: number[] } {
  const actuals = series
    .filter(p => p.asOf.slice(5) === '12-31' && new Date(p.asOf).getTime() <= now.getTime())
    .slice()
    .sort((a, b) => a.asOf.localeCompare(b.asOf))
  return {
    latest: actuals.length ? actuals[actuals.length - 1] : null,
    hist: actuals.map(p => p.value),
  }
}

export function useFiscal(): UseFiscalResult {
  const [state, setState] = useState<UseFiscalResult>({
    data: null, loading: true, error: null,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [rev, adp, tgd, dom, debtGdpSeries, debtDom, debtExt, imfEff] = await Promise.all([
          fetchLatest(METRIC.TOTAL_REV),
          fetchLatest(METRIC.BUDGET_ADPEX),
          fetchLatest(METRIC.TAX_GDP),
          fetchLatest(METRIC.DOMESTIC_BORROW),
          fetchSeries(METRIC.DEBT_GDP, { limit: 40 }),
          fetchLatest(METRIC.DEBT_DOMESTIC),
          fetchLatest(METRIC.DEBT_EXTERNAL),
          fetchLatest(METRIC.IMF_EFF),
        ])
        if (cancelled) return
        const debtGdp = selectDebtGdpActuals(debtGdpSeries ?? [], new Date())
        setState({
          loading: false,
          error: null,
          data: {
            revenuePct:          rev?.value ?? null,
            adpPct:              adp?.value ?? null,
            taxToGdp:            tgd?.value ?? null,
            domesticBorrowingCr: dom?.value ?? null,
            debtGdpRatio:        debtGdp.latest?.value ?? null,
            debtGdpAsOf:         debtGdp.latest?.asOf ?? null,
            debtGdpHist:         debtGdp.hist,
            debtDomesticCr:      debtDom?.value ?? null,
            debtExternalCr:      debtExt?.value ?? null,
            debtStockAsOf:       debtDom?.asOf ?? debtExt?.asOf ?? null,
            imfEffSdrMn:         imfEff?.value ?? null,
            imfEffAsOf:          imfEff?.asOf ?? null,
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
