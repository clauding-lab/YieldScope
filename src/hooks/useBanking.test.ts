import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('../lib/econdelta', () => ({
  fetchLatest: vi.fn(),
  fetchSeries: vi.fn(),
  isLiveDataAvailable: () => true,
}))

import { fetchLatest, fetchSeries } from '../lib/econdelta'
import { useBanking } from './useBanking'

beforeEach(() => {
  vi.mocked(fetchLatest).mockReset()
  vi.mocked(fetchSeries).mockReset()
})

describe('useBanking', () => {
  it('maps NPL + CAR from EconDelta', async () => {
    vi.mocked(fetchLatest).mockImplementation(async (id) => {
      if (id === 'gross_npl_ratio')      return { asOf: '2026-03-31', value: 11.8 }
      if (id === 'banking_sector_crar')  return { asOf: '2026-03-31', value: 11.6 }
      if (id === 'private_sector_credit_yoy_pct') return { asOf: '2026-05-30', value: 6.03 }
      if (id === 'private_sector_credit')         return { asOf: '2026-05-30', value: 1785976 }
      if (id === 'deposits_of_the_system')        return { asOf: '2026-05-30', value: 1995461.3 }
      return null
    })
    vi.mocked(fetchSeries).mockImplementation(async (id) => {
      if (id === 'gross_npl_ratio') {
        return [
          { asOf: '2024-09-30', value: 9.4 },
          { asOf: '2026-03-31', value: 11.8 },
        ]
      }
      return []
    })

    const { result } = renderHook(() => useBanking())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data!.nplRatio).toBe(11.8)
    expect(result.current.data!.crar).toBe(11.6)
    expect(result.current.data!.nplHist.length).toBe(2)
    expect(result.current.data!.nplHist[0]).toBe(9.4)
    expect(result.current.data!.nplHist[1]).toBe(11.8)
    expect(result.current.data!.pvtCreditYoY).toBe(6.03)
    expect(result.current.data!.pvtCreditYoYAsOf).toBe('2026-05-30')
    expect(result.current.data!.cdRatio).toBeCloseTo(89.5, 1)
  })

  it('renders the REAL distress CRAR (1.56%, BB QFSAR pre-shock) with vintage + stale flag — never suppressed', async () => {
    vi.mocked(fetchLatest).mockImplementation(async (id) => {
      if (id === 'banking_sector_crar') return { asOf: '2025-09-30', value: 1.56 }  // REAL pre-shock system CAR (QFSAR p13)
      if (id === 'gross_npl_ratio')     return { asOf: '2026-03-31', value: 32.26 } // legitimately high in BD
      return null
    })
    vi.mocked(fetchSeries).mockResolvedValue([])
    const { result } = renderHook(() => useBanking())
    await waitFor(() => expect(result.current.loading).toBe(false))
    // Owner decision 2026-07-09: 1.56 is inside the producer band (-50..30) ->
    // renders WITH its provenance ("BB QFSAR pre-shock · Sep '25") + stale flag.
    expect(result.current.data!.crar).toBe(1.56)
    expect(result.current.data!.crarImplausible).toBe(false)
    expect(result.current.data!.crarVintage).toBe("Sep '25")
    expect(result.current.data!.crarStale).toBe(true)
    // The qualifier is keyed to THIS print's as_of (2025-09-30) — the one
    // date the "BB QFSAR pre-shock" claim was verified against.
    expect(result.current.data!.crarQualifier).toBe('BB QFSAR pre-shock')
    // NPL 32.26 passes the wide band and carries its quarterly vintage
    expect(result.current.data!.nplRatio).toBe(32.26)
    expect(result.current.data!.nplVintage).toBe("Mar '26")
  })

  it('does NOT attach the pre-shock qualifier to a NEWER quarterly print (false-provenance guard)', async () => {
    vi.mocked(fetchLatest).mockImplementation(async (id) => {
      // The next quarter arrives via a routine data refresh: an ordinary value,
      // inside the wide band. It must render with vintage ONLY — inheriting
      // "BB QFSAR pre-shock" would be a false claim about a print nobody verified.
      if (id === 'banking_sector_crar') return { asOf: '2025-12-31', value: 9.8 }
      return null
    })
    vi.mocked(fetchSeries).mockResolvedValue([])
    const { result } = renderHook(() => useBanking())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data!.crar).toBe(9.8)
    expect(result.current.data!.crarQualifier).toBeNull()
    expect(result.current.data!.crarVintage).toBe("Dec '25")
  })

  it('nulls a truly absurd CRAR (unit/parse fault, e.g. 500) — a data fault never renders clean', async () => {
    vi.mocked(fetchLatest).mockImplementation(async (id) => {
      if (id === 'banking_sector_crar') return { asOf: '2026-03-31', value: 500 }
      return null
    })
    vi.mocked(fetchSeries).mockResolvedValue([])
    const { result } = renderHook(() => useBanking())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data!.crar).toBeNull()
    expect(result.current.data!.crarImplausible).toBe(true)
  })

  it('drops out-of-band points from the NPL series so a bad point cannot render in the trend chart', async () => {
    vi.mocked(fetchLatest).mockResolvedValue(null)
    vi.mocked(fetchSeries).mockImplementation(async (id) => {
      if (id === 'gross_npl_ratio') {
        return [
          { asOf: '2025-09-30', value: 30.1 },
          { asOf: '2025-12-31', value: 999 },  // parse fault — must NOT chart
          { asOf: '2026-03-31', value: 32.26 },
        ]
      }
      return []
    })
    const { result } = renderHook(() => useBanking())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data!.nplHist).toEqual([30.1, 32.26])
  })

  it('returns null cdRatio when deposits are missing (no divide-by-null)', async () => {
    vi.mocked(fetchLatest).mockImplementation(async (id) => {
      if (id === 'private_sector_credit') return { asOf: '2026-05-30', value: 1785976 }
      // deposits_of_the_system intentionally absent
      return null
    })
    vi.mocked(fetchSeries).mockResolvedValue([])
    const { result } = renderHook(() => useBanking())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data!.cdRatio).toBeNull()
  })

  it('captures error', async () => {
    vi.mocked(fetchLatest).mockRejectedValue(new Error('network'))
    vi.mocked(fetchSeries).mockResolvedValue([])
    const { result } = renderHook(() => useBanking())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
  })
})
