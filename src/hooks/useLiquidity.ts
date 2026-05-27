import { useEffect, useState } from 'react'
import { fetchLatest, fetchSeries } from '../lib/econdelta'
import { METRIC } from '../lib/econdelta-metrics'

export interface LiquidityData {
  callMoneyRate: number | null
  callSpark: number[]
  excessLiquidityKCr: number | null  // in lakh crore (KCr = 100k crore)
  excessHistKCr: number[]
  m2YoY: number | null
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
        const [call, excess, _m2, callSer, excessSer] = await Promise.all([
          fetchLatest(METRIC.CALL_MONEY),
          fetchLatest(METRIC.EXCESS_LIQ),
          fetchLatest(METRIC.M2),
          fetchSeries(METRIC.CALL_MONEY, { limit: 8 }),
          fetchSeries(METRIC.EXCESS_LIQ, { limit: 8 }),
        ])
        void _m2 // M2 YoY not computed in this swap; deferred
        if (cancelled) return
        setState({
          loading: false, error: null,
          data: {
            callMoneyRate: call?.value ?? null,
            callSpark: callSer.map(p => p.value),
            excessLiquidityKCr: excess ? excess.value / CR_PER_KCR : null,
            excessHistKCr: excessSer.map(p => p.value / CR_PER_KCR),
            m2YoY: null, // EconDelta has broad_money level, not YoY %. Compute or leave null.
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
