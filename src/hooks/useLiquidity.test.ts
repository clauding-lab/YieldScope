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
      if (id === 'excess_liquid_asset_total_minimum')     return { asOf: '2026-05-26', value: 18420000 }
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
      if (id === 'excess_liquid_asset_total_minimum') return [{ asOf: '2026-03-01', value: 28400000 }, { asOf: '2026-05-26', value: 18420000 }]
      if (id === 'm2_growth_yoy_monthly')             return [{ asOf: '2026-01-01', value: 9.46 }, { asOf: '2026-02-01', value: 10.40 }]
      return []
    })

    const { result } = renderHook(() => useLiquidity())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data!.callMoneyRate).toBe(9.34)
    expect(result.current.data!.callSpark.length).toBe(2)
    // Excess liquidity stored in BDT crore; hook converts to lakh crore (k Cr) by dividing by 100000
    expect(result.current.data!.excessLiquidityKCr).toBeCloseTo(184.2, 1)
    expect(result.current.data!.excessHistKCr.length).toBe(2)
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

  it('starts in loading state', () => {
    vi.mocked(fetchLatest).mockResolvedValue(null)
    vi.mocked(fetchSeries).mockResolvedValue([])
    const { result } = renderHook(() => useLiquidity())
    expect(result.current.loading).toBe(true)
  })

  it('captures error', async () => {
    vi.mocked(fetchLatest).mockRejectedValue(new Error('network'))
    vi.mocked(fetchSeries).mockResolvedValue([])
    const { result } = renderHook(() => useLiquidity())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
  })
})
