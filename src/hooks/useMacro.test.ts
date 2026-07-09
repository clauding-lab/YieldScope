import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('../lib/econdelta', () => ({
  fetchLatest: vi.fn(),
  fetchSeries: vi.fn(),
  isLiveDataAvailable: () => true,
}))

import { fetchLatest, fetchSeries } from '../lib/econdelta'
import { useMacro } from './useMacro'

const mockFetchLatest = vi.mocked(fetchLatest)
const mockFetchSeries = vi.mocked(fetchSeries)

beforeEach(() => {
  mockFetchLatest.mockReset()
  mockFetchSeries.mockReset()
})

describe('useMacro', () => {
  it('starts in loading state', async () => {
    mockFetchLatest.mockResolvedValue({ asOf: '2026-04-01', value: 9.2 })
    mockFetchSeries.mockResolvedValue([])
    const { result } = renderHook(() => useMacro())
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
    // Settle the pending async effect inside act() to avoid an update-after-test warning.
    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it('resolves with mapped data', async () => {
    mockFetchLatest.mockImplementation(async (id) => {
      if (id === 'point_to_point_inflation') return { asOf: '2026-04-01', value: 9.20 }
      if (id === 'usd_bdt_exchange_rate')    return { asOf: '2026-05-27', value: 119.62 }
      if (id === 'fx_reserve_gross_and_bpm6') return { asOf: '2026-05-25', value: 20.84 }
      if (id === 'reer_monthly')             return { asOf: '2026-03-01', value: 102.78 }
      if (id === 'import_cover_months_monthly') return { asOf: '2026-03-01', value: 5.86 }
      if (id === 'current_account_balance')  return { asOf: '2026-06-02', value: -0.397 }
      if (id === 'lng_price_usd_mmbtu')      return { asOf: '2025-12-31', value: 11.06 }
      if (id === 'wheat_price_usd_mt')       return { asOf: '2025-12-31', value: 223.17 }
      if (id === 'palm_oil_price_usd_mt')    return { asOf: '2025-12-31', value: 980.51 }
      return null
    })
    mockFetchSeries.mockImplementation(async (id) => {
      if (id === 'point_to_point_inflation') {
        return [
          { asOf: '2025-09-01', value: 9.94 },
          { asOf: '2026-04-01', value: 9.20 },
        ]
      }
      return []
    })

    const { result } = renderHook(() => useMacro())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).not.toBeNull()
    expect(result.current.data!.cpiHeadline).toBe(9.20)
    expect(result.current.data!.usdBdt).toBe(119.62)
    expect(result.current.data!.fxReservesUsdBn).toBe(20.84)
    expect(result.current.data!.cpiHist[0]).toBe(9.94)
    expect(result.current.data!.cpiHist[1]).toBe(9.20)
    expect(result.current.data!.reer).toBe(102.78)
    expect(result.current.data!.reerAsOf).toBe('2026-03-01')
    expect(result.current.data!.importCoverMonths).toBe(5.86)
    expect(result.current.data!.importCoverAsOf).toBe('2026-03-01')
    // current account (negative = deficit, valid) — NOT bop_summary
    expect(result.current.data!.currentAccountUsdBn).toBe(-0.397)
    expect(result.current.data!.currentAccountAsOf).toBe('2026-06-02')
    // commodities (World Bank pink sheet, USD)
    expect(result.current.data!.lngUsd).toBe(11.06)
    expect(result.current.data!.wheatUsd).toBe(223.17)
    expect(result.current.data!.palmOilUsd).toBe(980.51)
  })

  it('captures error from the client', async () => {
    mockFetchLatest.mockRejectedValue(new Error('network'))
    mockFetchSeries.mockResolvedValue([])
    const { result } = renderHook(() => useMacro())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
  })
})
