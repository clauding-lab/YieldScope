import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('../lib/econdelta', () => ({
  fetchLatest: vi.fn(),
  fetchSeries: vi.fn(),
  isLiveDataAvailable: () => true,
}))

import { fetchLatest, fetchSeries } from '../lib/econdelta'
import { useLiquidity } from './useLiquidity'

beforeEach(() => {
  vi.mocked(fetchLatest).mockReset()
  vi.mocked(fetchSeries).mockReset()
})

describe('useLiquidity', () => {
  it('maps call money + excess liquidity + M2 + policy corridor from EconDelta', async () => {
    vi.mocked(fetchLatest).mockImplementation(async (id) => {
      if (id === 'call_money_rate')                       return { asOf: '2026-05-27', value: 9.34 }
      // Real producer emits BDT crore (~3.86 lakh crore). Mirror it, not an idealized figure.
      if (id === 'excess_liquid_asset_total_minimum')     return { asOf: '2026-06-05', value: 385992.24 }
      if (id === 'broad_money')                            return { asOf: '2026-04-30', value: 12500000 }
      if (id === 'policy_rate_repo')                       return { asOf: '2026-04-30', value: 10.00 }
      if (id === 'policy_rate_sdf')                        return { asOf: '2026-04-30', value: 7.50 }
      if (id === 'policy_rate_slf')                        return { asOf: '2026-04-30', value: 11.50 }
      if (id === 'm2_growth_yoy_monthly')                  return { asOf: '2026-02-01', value: 10.52 }
      if (id === 'crr_utilisation_pct')                    return { asOf: '2026-06-02', value: 4.9781 }
      if (id === 'slr_utilisation_pct')                    return { asOf: '2026-06-02', value: 18.9903 }
      return null
    })
    vi.mocked(fetchSeries).mockImplementation(async (id) => {
      if (id === 'call_money_rate')                   return [{ asOf: '2026-05-20', value: 8.42 }, { asOf: '2026-05-27', value: 9.34 }]
      if (id === 'excess_liquid_asset_total_minimum') return [{ asOf: '2026-03-01', value: 402150.00 }, { asOf: '2026-06-05', value: 385992.24 }]
      if (id === 'm2_growth_yoy_monthly')             return [{ asOf: '2026-01-01', value: 9.46 }, { asOf: '2026-02-01', value: 10.40 }]
      return []
    })

    const { result } = renderHook(() => useLiquidity())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data!.callMoneyRate).toBe(9.34)
    expect(result.current.data!.callSpark.length).toBe(2)
    // Excess liquidity stored in BDT crore; hook converts to LAKH crore by dividing by 100000.
    // 385,992.24 crore ÷ 100,000 = 3.86 lakh crore — the label MUST read "lakh Cr", never "k Cr".
    expect(result.current.data!.excessLiquidityLakhCr).toBeCloseTo(3.86, 2)
    expect(result.current.data!.excessHistLakhCr).toEqual([4.0215, 3.8599224])
    // Policy corridor — values land from BB MEI bulletin page 10.
    expect(result.current.data!.policyRepo).toBe(10.00)
    expect(result.current.data!.policySdf).toBe(7.50)
    expect(result.current.data!.policySlf).toBe(11.50)
    // m2YoY comes from fetchLatest (10.52); m2Hist tail (10.40) is deliberately
    // different so a bug sourcing the headline from the series tail would surface.
    expect(result.current.data!.m2YoY).toBe(10.52)
    expect(result.current.data!.m2YoYAsOf).toBe('2026-02-01')
    expect(result.current.data!.m2Hist).toEqual([9.46, 10.40])
    // CRR/SLR maintained reserve ratios (% of deposits) — daily metric_history
    expect(result.current.data!.crrMaintainedPct).toBe(4.9781)
    expect(result.current.data!.slrMaintainedPct).toBe(18.9903)
    expect(result.current.data!.crrAsOf).toBe('2026-06-02')
    // Real corridor SDF 7.5 < repo 10 < SLF 11.5 is coherent
    expect(result.current.data!.corridorCoherent).toBe(true)
  })

  it('flags corridor incoherence when SDF is not below repo', async () => {
    vi.mocked(fetchLatest).mockImplementation(async (id) => {
      if (id === 'policy_rate_repo') return { asOf: '2026-07-09', value: 8.0 }
      if (id === 'policy_rate_sdf')  return { asOf: '2026-07-09', value: 9.0 }  // above repo — misparsed
      if (id === 'policy_rate_slf')  return { asOf: '2026-07-09', value: 11.5 }
      return null
    })
    vi.mocked(fetchSeries).mockResolvedValue([])
    const { result } = renderHook(() => useLiquidity())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data!.corridorCoherent).toBe(false)
  })

  it('band-gates an out-of-band policy rate (e.g. a basis-points parse) to null — ordering alone would pass it', async () => {
    vi.mocked(fetchLatest).mockImplementation(async (id) => {
      // Uniform bp-scale fault: 750 < 1000 < 1150 is corridor-ORDERED but
      // outside the 0–20% band — each rate must null out, not render clean.
      if (id === 'policy_rate_repo') return { asOf: '2026-07-09', value: 1000 }
      if (id === 'policy_rate_sdf')  return { asOf: '2026-07-09', value: 750 }
      if (id === 'policy_rate_slf')  return { asOf: '2026-07-09', value: 1150 }
      return null
    })
    vi.mocked(fetchSeries).mockResolvedValue([])
    const { result } = renderHook(() => useLiquidity())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data!.policyRepo).toBeNull()
    expect(result.current.data!.policySdf).toBeNull()
    expect(result.current.data!.policySlf).toBeNull()
    // All legs nulled -> coherence is unjudgeable, not falsely flagged
    expect(result.current.data!.corridorCoherent).toBe(true)
  })

  it('returns nulls for policy corridor when EconDelta has no rows', async () => {
    vi.mocked(fetchLatest).mockResolvedValue(null)
    vi.mocked(fetchSeries).mockResolvedValue([])
    const { result } = renderHook(() => useLiquidity())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data!.policyRepo).toBeNull()
    expect(result.current.data!.policySdf).toBeNull()
    expect(result.current.data!.policySlf).toBeNull()
  })

  it('starts in loading state', async () => {
    vi.mocked(fetchLatest).mockResolvedValue(null)
    vi.mocked(fetchSeries).mockResolvedValue([])
    const { result } = renderHook(() => useLiquidity())
    expect(result.current.loading).toBe(true)
    // Settle the pending async effect inside act() to avoid an update-after-test warning.
    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it('captures error', async () => {
    vi.mocked(fetchLatest).mockRejectedValue(new Error('network'))
    vi.mocked(fetchSeries).mockResolvedValue([])
    const { result } = renderHook(() => useLiquidity())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
  })
})
