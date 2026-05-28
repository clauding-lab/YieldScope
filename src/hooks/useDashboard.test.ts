import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('../lib/econdelta', () => ({
  fetchLatest: vi.fn(),
  fetchSeries: vi.fn(),
  isLiveDataAvailable: () => true,
}))

import { fetchLatest } from '../lib/econdelta'
import { useDashboard } from './useDashboard'

beforeEach(() => {
  vi.mocked(fetchLatest).mockReset()
})

describe('useDashboard', () => {
  it('aggregates the 4 cornerstone metrics + slope', async () => {
    vi.mocked(fetchLatest).mockImplementation(async (id) => {
      switch (id) {
        case 'bill_bond_rates':           return { asOf: '2026-05-26', value: 11.42 }
        case 'tbond_10y_yield':           return { asOf: '2026-05-21', value: 12.18 }
        case 'call_money_rate':           return { asOf: '2026-05-27', value: 9.34 }
        case 'point_to_point_inflation':  return { asOf: '2026-04-01', value: 9.20 }
        default: return null
      }
    })

    const { result } = renderHook(() => useDashboard())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const d = result.current.data!
    expect(d.tbill91).toBe(11.42)
    expect(d.tbond10).toBe(12.18)
    expect(d.callMoney).toBe(9.34)
    expect(d.cpiHeadline).toBe(9.20)
    expect(d.spread10Y_91D_bps).toBe(76)
  })

  it('returns null spread when 91D missing', async () => {
    vi.mocked(fetchLatest).mockImplementation(async (id) => {
      if (id === 'tbond_10y_yield') return { asOf: '2026-05-21', value: 12.18 }
      return null
    })
    const { result } = renderHook(() => useDashboard())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data!.spread10Y_91D_bps).toBeNull()
  })

  it('captures error', async () => {
    vi.mocked(fetchLatest).mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useDashboard())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
  })
})
