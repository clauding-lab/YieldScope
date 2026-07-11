import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('../lib/econdelta', () => ({
  fetchLatest: vi.fn(),
  fetchSeries: vi.fn(),
  isLiveDataAvailable: () => true,
}))

import { fetchLatest, fetchSeries } from '../lib/econdelta'
import { useFiscal, selectDebtGdpActuals } from './useFiscal'

beforeEach(() => {
  vi.mocked(fetchLatest).mockReset()
  vi.mocked(fetchSeries).mockReset()
})

describe('selectDebtGdpActuals', () => {
  // debt_gdp_ratio conflates: IMF annual actuals (Dec-31), IMF projections (future Dec-31),
  // and one off-cycle MoF daily print. The honest "current" figure is the latest COMPLETE-YEAR
  // actual dated on/before today — projections and the off-cycle print must be excluded.
  const series = [
    { asOf: '2023-12-31', value: 39.7 },
    { asOf: '2024-12-31', value: 41.0 },
    { asOf: '2025-12-31', value: 42.0 },
    { asOf: '2026-06-02', value: 38.61 }, // off-cycle MoF daily print (not a year-end)
    { asOf: '2026-12-31', value: 41.8 },  // IMF projection (future)
    { asOf: '2031-12-31', value: 48.8 },  // IMF projection (future)
  ]
  const now = new Date('2026-06-02T00:00:00Z')

  it('picks the latest complete-year actual, ignoring the off-cycle print and projections', () => {
    expect(selectDebtGdpActuals(series, now).latest).toEqual({ asOf: '2025-12-31', value: 42.0 })
  })

  it('builds history from year-end actuals only (no off-cycle print, no projections)', () => {
    expect(selectDebtGdpActuals(series, now).hist).toEqual([39.7, 41.0, 42.0])
  })

  it('returns null/empty when no year-end actual exists yet', () => {
    const out = selectDebtGdpActuals([{ asOf: '2099-12-31', value: 60 }], now)
    expect(out.latest).toBeNull()
    expect(out.hist).toEqual([])
  })
})

describe('useFiscal', () => {
  it('maps fiscal indicators from EconDelta', async () => {
    vi.mocked(fetchLatest).mockImplementation(async (id) => {
      switch (id) {
        case 'tax_gdp_ratio':                                return { asOf: '2026-04-30', value: 7.5 }
        case 'domestic_borrowing_for_budget_deficit':        return { asOf: '2026-04-30', value: 8450000 }
        default: return null
      }
    })
    vi.mocked(fetchSeries).mockImplementation(async () => [])

    const { result } = renderHook(() => useFiscal())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const d = result.current.data!
    expect(d.taxToGdp).toBe(7.5)
    expect(d.domesticBorrowingCr).toBe(8450000)
  })

  it('exposes NBR FYTD collection from tax_revenue and no longer fetches retired ids', async () => {
    vi.mocked(fetchLatest).mockImplementation(async (id: string) =>
      id === 'tax_revenue' ? { asOf: '2026-06-30', value: 360642 } : null)
    vi.mocked(fetchSeries).mockImplementation(async () => [])
    const { result } = renderHook(() => useFiscal())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data?.nbrFytdCr).toBe(360642)
    const fetchedIds = vi.mocked(fetchLatest).mock.calls.map(c => c[0])
    expect(fetchedIds).not.toContain('total_revenue_budget_vs_actual')
    expect(fetchedIds).not.toContain('budget_adpex_of_the_fy_vs_utilization')
  })

  it('maps debt metrics: latest year-end Debt/GDP actual + stocks + IMF EFF', async () => {
    vi.mocked(fetchSeries).mockImplementation(async (id) =>
      id === 'debt_gdp_ratio'
        ? [
            { asOf: '2024-12-31', value: 41.0 },
            { asOf: '2025-12-31', value: 42.0 },
            { asOf: '2099-12-31', value: 60.0 }, // far-future projection — must be excluded
          ]
        : [],
    )
    vi.mocked(fetchLatest).mockImplementation(async (id) => {
      switch (id) {
        case 'debt_domestic_stock_cr':      return { asOf: '2026-06-02', value: 1247151 }
        case 'debt_external_stock_cr':      return { asOf: '2026-06-02', value: 959311 }
        case 'imf_eff_outstanding_sdr_mn':  return { asOf: '2026-04-30', value: 1373.26 }
        default: return null
      }
    })

    const { result } = renderHook(() => useFiscal())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const d = result.current.data!
    expect(d.debtGdpRatio).toBe(42.0)
    expect(d.debtGdpAsOf).toBe('2025-12-31')
    expect(d.debtGdpHist).toEqual([41.0, 42.0])
    expect(d.debtDomesticCr).toBe(1247151)
    expect(d.debtExternalCr).toBe(959311)
    expect(d.imfEffSdrMn).toBe(1373.26)
  })

  it('captures error', async () => {
    vi.mocked(fetchLatest).mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useFiscal())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
  })
})
