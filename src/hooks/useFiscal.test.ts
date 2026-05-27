import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('../lib/econdelta', () => ({
  fetchLatest: vi.fn(),
  fetchSeries: vi.fn(),
  isLiveDataAvailable: () => true,
}))

import { fetchLatest } from '../lib/econdelta'
import { useFiscal } from './useFiscal'

beforeEach(() => {
  vi.mocked(fetchLatest).mockReset()
})

describe('useFiscal', () => {
  it('maps fiscal indicators from EconDelta', async () => {
    vi.mocked(fetchLatest).mockImplementation(async (id) => {
      switch (id) {
        case 'total_revenue_budget_vs_actual':              return { asOf: '2026-04-30', value: 74.4 }
        case 'budget_adpex_of_the_fy_vs_utilization':       return { asOf: '2026-04-30', value: 58.4 }
        case 'tax_gdp_ratio':                                return { asOf: '2026-04-30', value: 7.5 }
        case 'domestic_borrowing_for_budget_deficit':        return { asOf: '2026-04-30', value: 8450000 }
        default: return null
      }
    })

    const { result } = renderHook(() => useFiscal())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const d = result.current.data!
    expect(d.revenuePct).toBe(74.4)
    expect(d.adpPct).toBe(58.4)
    expect(d.taxToGdp).toBe(7.5)
    expect(d.domesticBorrowingCr).toBe(8450000)
  })

  it('captures error', async () => {
    vi.mocked(fetchLatest).mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useFiscal())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
  })
})
