import { useEffect, useState } from 'react'
import { fetchLatest, fetchSeries } from '../lib/econdelta'
import { METRIC } from '../lib/econdelta-metrics'

export interface MacroData {
  cpiHeadline: number | null
  cpiFood: number | null
  cpiNonFood: number | null
  cpiHist: number[]
  foodHist: number[]
  nonFoodHist: number[]

  usdBdt: number | null
  fxReservesUsdBn: number | null
  fxResHist: number[]

  remitMonthlyUsdBn: number | null
  exportMonthlyUsdBn: number | null
  importMonthlyUsdBn: number | null

  asOf: string | null
}

interface UseMacroResult {
  data: MacroData | null
  loading: boolean
  error: Error | null
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
          cpiH, cpiF, cpiNF, usd, fxr,
          cpiSer, foodSer, nfSer, fxSer,
          rem, exp, imp,
        ] = await Promise.all([
          fetchLatest(METRIC.CPI_HEADLINE),
          fetchLatest(METRIC.CPI_FOOD),
          fetchLatest(METRIC.CPI_NONFOOD),
          fetchLatest(METRIC.USD_BDT),
          fetchLatest(METRIC.FX_RESERVES),
          fetchSeries(METRIC.CPI_HEADLINE,  { limit: 8 }),
          fetchSeries(METRIC.CPI_FOOD,      { limit: 8 }),
          fetchSeries(METRIC.CPI_NONFOOD,   { limit: 8 }),
          fetchSeries(METRIC.FX_RESERVES,   { limit: 8 }),
          fetchLatest(METRIC.REMIT_MONTHLY),
          fetchLatest(METRIC.EXPORT_MONTHLY),
          fetchLatest(METRIC.IMPORT_MONTHLY),
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
            usdBdt:        usd?.value ?? null,
            fxReservesUsdBn: fxr?.value ?? null,
            fxResHist:     fxSer.map(p => p.value),
            remitMonthlyUsdBn:  rem?.value ?? null,
            exportMonthlyUsdBn: exp?.value ?? null,
            importMonthlyUsdBn: imp?.value ?? null,
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
