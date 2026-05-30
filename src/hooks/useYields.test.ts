import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('../lib/econdelta', () => ({
  fetchLatest: vi.fn(),
  fetchSeries: vi.fn(),
  isLiveDataAvailable: () => true,
}))

import { fetchLatest, fetchSeries } from '../lib/econdelta'
import { useYields } from './useYields'

beforeEach(() => {
  vi.mocked(fetchLatest).mockReset()
  vi.mocked(fetchSeries).mockReset()
  vi.mocked(fetchSeries).mockResolvedValue([])
})

describe('useYields', () => {
  it('maps 7 live tenors from EconDelta', async () => {
    vi.mocked(fetchLatest).mockImplementation(async (id) => {
      switch (id) {
        case 'bill_bond_rates':  return { asOf: '2026-05-26', value: 11.42 } // 91D
        case 'tbill_182d_yield': return { asOf: '2026-05-26', value: 11.60 }
        case 'tbill_364d_yield': return { asOf: '2026-05-26', value: 11.71 }
        case 'yield_2y_monthly': return { asOf: '2026-03-01', value: 10.23 }
        case 'tbond_5y_yield':   return { asOf: '2026-05-21', value: 12.04 }
        case 'tbond_10y_yield':  return { asOf: '2026-05-21', value: 12.18 }
        case 'yield_20y_monthly': return { asOf: '2026-03-01', value: 11.23 }
        default: return null
      }
    })

    const { result } = renderHook(() => useYields())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const d = result.current.data!
    expect(d.yields['91D']).toBe(11.42)
    expect(d.yields['182D']).toBe(11.60)
    expect(d.yields['364D']).toBe(11.71)
    expect(d.yields['2Y']).toBe(10.23)
    expect(d.yields['5Y']).toBe(12.04)
    expect(d.yields['10Y']).toBe(12.18)
    expect(d.yields['20Y']).toBe(11.23)
    expect(d.spread10Y_91D_bps).toBe(76) // (12.18 - 11.42) * 100 = 76 bps
  })

  it('returns null spread when either end is missing', async () => {
    vi.mocked(fetchLatest).mockImplementation(async (id) => {
      if (id === 'bill_bond_rates') return { asOf: '2026-05-26', value: 11.42 }
      return null
    })
    const { result } = renderHook(() => useYields())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data!.spread10Y_91D_bps).toBeNull()
  })

  it('captures error', async () => {
    vi.mocked(fetchLatest).mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useYields())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
  })

  it('exposes per-tenor historical series', async () => {
    vi.mocked(fetchLatest).mockResolvedValue(null)
    vi.mocked(fetchSeries).mockImplementation(async (id) => {
      if (id === 'bill_bond_rates')   return [{ asOf: '2026-05-25', value: 11.40 }, { asOf: '2026-05-26', value: 11.42 }]
      if (id === 'tbond_10y_yield')   return [{ asOf: '2026-05-20', value: 12.16 }, { asOf: '2026-05-21', value: 12.18 }]
      return []
    })

    const { result } = renderHook(() => useYields())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const d = result.current.data!
    expect(d.series['91D']).toEqual([11.40, 11.42])
    expect(d.series['10Y']).toEqual([12.16, 12.18])
    expect(d.series['182D']).toEqual([])
  })
})
