import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// Mock only the network fetchers; let the real pure mappers run.
vi.mock('../lib/auctions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/auctions')>()
  return { ...actual, fetchAuctionResults: vi.fn(), fetchAuctionCalendar: vi.fn() }
})

import { fetchAuctionResults, fetchAuctionCalendar } from '../lib/auctions'
import { useAuctions } from './useAuctions'

beforeEach(() => {
  vi.mocked(fetchAuctionResults).mockReset()
  vi.mocked(fetchAuctionCalendar).mockReset()
})

describe('useAuctions', () => {
  it('maps fetched rows into display results + upcoming groups', async () => {
    vi.mocked(fetchAuctionResults).mockResolvedValue([
      { date: '2026-05-24', tenor: '91D', sizeCr: 3500, bidCr: 6904.22, cover: 1.97, wam: null, cutoff: 10.15 },
    ])
    vi.mocked(fetchAuctionCalendar).mockResolvedValue([
      { date: '2099-12-31', tenor: '91D', notionalCr: 4000 },
      { date: '2099-12-31', tenor: '182D', notionalCr: 3000 },
    ])

    const { result } = renderHook(() => useAuctions())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const d = result.current.data!
    expect(d.results).toHaveLength(1)
    expect(d.results[0].tenor).toBe('91D')
    expect(d.results[0].cutoff).toBe('10.15')
    expect(d.upcoming).toHaveLength(1)
    expect(d.upcoming[0].tenor).toBe('91D · 182D')
    expect(d.upcoming[0].size).toBe('7 k Cr')
  })

  it('captures error', async () => {
    vi.mocked(fetchAuctionResults).mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useAuctions())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
  })
})
