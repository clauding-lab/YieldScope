import { useEffect, useState } from 'react'
import { fetchLatest, fetchSeries, type MetricPoint } from '../lib/econdelta'
import { METRIC } from '../lib/econdelta-metrics'

export interface MacroData {
  cpiHeadline: number | null
  cpiFood: number | null
  cpiNonFood: number | null
  cpiHist: number[]
  foodHist: number[]
  nonFoodHist: number[]
  cpiMonths: string[]

  usdBdt: number | null
  usdBdtHist: number[]
  fxReservesUsdBn: number | null
  fxResHist: number[]

  remitMonthlyUsdBn: number | null
  exportMonthlyUsdBn: number | null
  importMonthlyUsdBn: number | null
  currentAccountUsdBn: number | null   // current_account_balance (USD bn; negative = deficit) — NOT bop_summary
  currentAccountAsOf: string | null

  brentUsdBarrel: number | null
  brentHist: number[]
  lngUsd: number | null                // lng_price_usd_mmbtu (USD/MMBtu) — World Bank pink sheet
  lngAsOf: string | null
  wheatUsd: number | null              // wheat_price_usd_mt (USD/MT)
  wheatAsOf: string | null
  palmOilUsd: number | null            // palm_oil_price_usd_mt (USD/MT)
  palmOilAsOf: string | null

  reer: number | null
  reerAsOf: string | null              // REER is a lagged monthly index — surface its vintage
  importCoverMonths: number | null
  importCoverAsOf: string | null       // import cover is a lagged monthly print

  asOf: string | null
}

interface UseMacroResult {
  data: MacroData | null
  loading: boolean
  error: Error | null
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function monthsFromSeries(series: MetricPoint[]): string[] {
  return series.map(p => {
    const d = new Date(p.asOf)
    return Number.isNaN(d.getTime()) ? '' : MONTH_SHORT[d.getUTCMonth()]
  })
}

export function useMacro(): UseMacroResult {
  const [state, setState] = useState<UseMacroResult>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [
          cpiH, cpiF, cpiNF, usd, fxr, brent,
          cpiSer, foodSer, nfSer, fxSer, usdSer, brentSer,
          rem, exp, imp, curAcct,
          lng, wheat, palm,
          reer, impCov,
        ] = await Promise.all([
          fetchLatest(METRIC.CPI_HEADLINE),
          fetchLatest(METRIC.CPI_FOOD),
          fetchLatest(METRIC.CPI_NONFOOD),
          fetchLatest(METRIC.USD_BDT),
          fetchLatest(METRIC.FX_RESERVES),
          fetchLatest(METRIC.BRENT),
          fetchSeries(METRIC.CPI_HEADLINE,  { limit: 8 }),
          fetchSeries(METRIC.CPI_FOOD,      { limit: 8 }),
          fetchSeries(METRIC.CPI_NONFOOD,   { limit: 8 }),
          fetchSeries(METRIC.FX_RESERVES,   { limit: 8 }),
          fetchSeries(METRIC.USD_BDT,       { limit: 8 }),
          fetchSeries(METRIC.BRENT,         { limit: 8 }),
          fetchLatest(METRIC.REMIT_MONTHLY),
          fetchLatest(METRIC.EXPORT_MONTHLY),
          fetchLatest(METRIC.IMPORT_MONTHLY),
          fetchLatest(METRIC.CURRENT_ACCOUNT),
          fetchLatest(METRIC.LNG),
          fetchLatest(METRIC.WHEAT),
          fetchLatest(METRIC.PALM_OIL),
          fetchLatest(METRIC.REER_M),
          fetchLatest(METRIC.IMPORT_COVER_M),
        ])

        if (cancelled) return

        const asOf = cpiH?.asOf ?? null
        setState({
          loading: false,
          error: null,
          data: {
            cpiHeadline:   cpiH?.value ?? null,
            cpiFood:       cpiF?.value ?? null,
            cpiNonFood:    cpiNF?.value ?? null,
            cpiHist:       cpiSer.map(p => p.value),
            foodHist:      foodSer.map(p => p.value),
            nonFoodHist:   nfSer.map(p => p.value),
            cpiMonths:     monthsFromSeries(cpiSer),
            usdBdt:        usd?.value ?? null,
            usdBdtHist:    usdSer.map(p => p.value),
            fxReservesUsdBn: fxr?.value ?? null,
            fxResHist:     fxSer.map(p => p.value),
            remitMonthlyUsdBn:  rem?.value ?? null,
            exportMonthlyUsdBn: exp?.value ?? null,
            importMonthlyUsdBn: imp?.value ?? null,
            currentAccountUsdBn: curAcct?.value ?? null,
            currentAccountAsOf:  curAcct?.asOf ?? null,
            brentUsdBarrel: brent?.value ?? null,
            brentHist:      brentSer.map(p => p.value),
            lngUsd:         lng?.value ?? null,
            lngAsOf:        lng?.asOf ?? null,
            wheatUsd:       wheat?.value ?? null,
            wheatAsOf:      wheat?.asOf ?? null,
            palmOilUsd:     palm?.value ?? null,
            palmOilAsOf:    palm?.asOf ?? null,
            reer:               reer?.value ?? null,
            reerAsOf:           reer?.asOf ?? null,
            importCoverMonths:  impCov?.value ?? null,
            importCoverAsOf:    impCov?.asOf ?? null,
            asOf,
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
