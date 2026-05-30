import { useEffect, useState } from 'react'
import { fetchLatest, fetchSeries } from '../lib/econdelta'
import { METRIC } from '../lib/econdelta-metrics'

export interface LiquidityData {
  callMoneyRate: number | null
  callSpark: number[]
  excessLiquidityKCr: number | null  // in lakh crore (KCr = 100k crore)
  excessHistKCr: number[]
  m2YoY: number | null
  m2YoYAsOf: string | null  // M2 YoY is a lagged monthly print — surface its vintage
  m2Hist: number[]          // M2 YoY trajectory (monthly), ascending
  // BB policy rate corridor — three explicit monthly metrics sourced from
  // MEI bulletin page 10. Each may be null if EconDelta hasn't ingested the
  // first row yet (first aggregate fire scheduled 2026-05-29 13:00 BDT).
  policyRepo: number | null
  policySdf: number | null
  policySlf: number | null
  asOf: string | null
}

interface UseLiquidityResult {
  data: LiquidityData | null
  loading: boolean
  error: Error | null
}

// EconDelta stores excess liquidity in BDT crore; UI shows lakh crore (= ÷ 100000).
const CR_PER_KCR = 100000

export function useLiquidity(): UseLiquidityResult {
  const [state, setState] = useState<UseLiquidityResult>({
    data: null, loading: true, error: null,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [call, excess, callSer, excessSer, repo, sdf, slf, m2, m2Ser] = await Promise.all([
          fetchLatest(METRIC.CALL_MONEY),
          fetchLatest(METRIC.EXCESS_LIQ),
          fetchSeries(METRIC.CALL_MONEY, { limit: 8 }),
          fetchSeries(METRIC.EXCESS_LIQ, { limit: 8 }),
          fetchLatest(METRIC.POLICY_RATE_REPO),
          fetchLatest(METRIC.POLICY_RATE_SDF),
          fetchLatest(METRIC.POLICY_RATE_SLF),
          fetchLatest(METRIC.M2_YOY_M),
          fetchSeries(METRIC.M2_YOY_M, { limit: 8 }),
        ])
        // M2 YoY now sourced from m2_growth_yoy_monthly (monthly, lagged).
        if (cancelled) return
        setState({
          loading: false, error: null,
          data: {
            callMoneyRate: call?.value ?? null,
            callSpark: callSer.map(p => p.value),
            excessLiquidityKCr: excess ? excess.value / CR_PER_KCR : null,
            excessHistKCr: excessSer.map(p => p.value / CR_PER_KCR),
            m2YoY: m2?.value ?? null,
            m2YoYAsOf: m2?.asOf ?? null,
            m2Hist: m2Ser.map(p => p.value),
            policyRepo: repo?.value ?? null,
            policySdf: sdf?.value ?? null,
            policySlf: slf?.value ?? null,
            asOf: call?.asOf ?? null,
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
