import { describe, it, expect, beforeEach, vi } from 'vitest'

// Tests assume the module exposes fetchLatest + fetchSeries.
// We mock @supabase/supabase-js entirely so no network is hit.
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()

vi.mock('./supabase', () => ({
  getSupabase: () => ({ from: mockFrom }),
  isLiveDataAvailable: () => true,
}))

beforeEach(() => {
  mockFrom.mockReset()
  mockSelect.mockReset()
  mockEq.mockReset()
  mockOrder.mockReset()
  mockLimit.mockReset()

  // Default: chain returns itself, .limit resolves with empty data
  const chain = { select: mockSelect, eq: mockEq, order: mockOrder, limit: mockLimit }
  mockFrom.mockReturnValue(chain)
  mockSelect.mockReturnValue(chain)
  mockEq.mockReturnValue(chain)
  mockOrder.mockReturnValue(chain)
  mockLimit.mockResolvedValue({ data: [], error: null })
})

describe('fetchLatest', () => {
  it('queries metric_history with the right metric_id and returns the most recent value', async () => {
    mockLimit.mockResolvedValueOnce({
      data: [{ metric_id: 'brent_crude_usd_barrel', as_of: '2026-05-27', value: 83.42 }],
      error: null,
    })

    const { fetchLatest } = await import('./econdelta')
    const result = await fetchLatest('brent_crude_usd_barrel')

    expect(mockFrom).toHaveBeenCalledWith('metric_history')
    expect(mockEq).toHaveBeenCalledWith('metric_id', 'brent_crude_usd_barrel')
    expect(mockOrder).toHaveBeenCalledWith('as_of', { ascending: false })
    expect(mockLimit).toHaveBeenCalledWith(1)
    expect(result).toEqual({ asOf: '2026-05-27', value: 83.42 })
  })

  it('returns null when no rows exist', async () => {
    const { fetchLatest } = await import('./econdelta')
    const result = await fetchLatest('brent_crude_usd_barrel')
    expect(result).toBeNull()
  })

  it('routes monthly metrics to metric_history_monthly table', async () => {
    mockLimit.mockResolvedValueOnce({
      data: [{ metric_id: 'cpi_12m_avg_monthly', as_of: '2026-04-01', value: 8.6 }],
      error: null,
    })
    const { fetchLatest } = await import('./econdelta')
    await fetchLatest('cpi_12m_avg_monthly')
    expect(mockFrom).toHaveBeenCalledWith('metric_history_monthly')
  })

  // error ≠ empty: a Supabase error must THROW (mirrors lib/auctions.ts) so the
  // hook's error branch fires, instead of being swallowed into a "no data" null
  // that silently renders fixture/empty UI on a live-data outage.
  it('throws on a Supabase error (does NOT masquerade as no rows)', async () => {
    mockLimit.mockResolvedValueOnce({ data: null, error: { message: 'boom' } })
    const { fetchLatest } = await import('./econdelta')
    await expect(fetchLatest('brent_crude_usd_barrel')).rejects.toThrow(/boom/)
  })

  it('still returns null on a successful query with no rows (empty is honest emptiness, not an error)', async () => {
    mockLimit.mockResolvedValueOnce({ data: [], error: null })
    const { fetchLatest } = await import('./econdelta')
    expect(await fetchLatest('brent_crude_usd_barrel')).toBeNull()
  })
})

describe('fetchRecentBriefings', () => {
  it('maps briefing rows newest-first and defaults null jsonb to []', async () => {
    mockLimit.mockResolvedValueOnce({
      data: [{
        week_of: '2026-06-01', generated_at: '2026-06-01T01:00:00Z',
        title: 'T', body: 'B',
        featured_anomalies: [{ candidate_id: 'x:change', label: 'L', stat: 's', value: 1, detail: 'd', severity: 'up', metric_id: 'x', why: 'w' }],
        open_threads: null, data_as_of: '2026-05-31', stale_series: null,
      }],
      error: null,
    })
    const { fetchRecentBriefings } = await import('./econdelta')
    const out = await fetchRecentBriefings(12)
    expect(mockFrom).toHaveBeenCalledWith('briefings')
    expect(mockOrder).toHaveBeenCalledWith('week_of', { ascending: false })
    expect(out[0].weekOf).toBe('2026-06-01')
    expect(out[0].featuredAnomalies[0].value).toBe(1)
    expect(out[0].openThreads).toEqual([])
    expect(out[0].staleSeries).toEqual([])
  })

  // error ≠ empty: a Supabase error must THROW so useBriefing's error branch can
  // fire, rather than being swallowed into an empty briefing list.
  it('throws on a Supabase error (does NOT masquerade as an empty briefing list)', async () => {
    mockLimit.mockResolvedValueOnce({ data: null, error: { message: 'oops' } })
    const { fetchRecentBriefings } = await import('./econdelta')
    await expect(fetchRecentBriefings()).rejects.toThrow(/oops/)
  })

  it('still returns [] on a successful query with no rows (honest emptiness, not an error)', async () => {
    mockLimit.mockResolvedValueOnce({ data: [], error: null })
    const { fetchRecentBriefings } = await import('./econdelta')
    expect(await fetchRecentBriefings()).toEqual([])
  })
})

describe('fetchSeries', () => {
  it('returns rows in chronological ascending order', async () => {
    mockLimit.mockResolvedValueOnce({
      data: [
        { metric_id: 'call_money_rate', as_of: '2026-05-27', value: 9.34 },
        { metric_id: 'call_money_rate', as_of: '2026-05-26', value: 9.22 },
      ],
      error: null,
    })
    const { fetchSeries } = await import('./econdelta')
    const series = await fetchSeries('call_money_rate', { limit: 8 })

    // Verify ordering on output (PostgREST returns desc; client flips to asc for chart use)
    expect(series.map(p => p.asOf)).toEqual(['2026-05-26', '2026-05-27'])
    expect(series.map(p => p.value)).toEqual([9.22, 9.34])
  })

  // error ≠ empty: a PostgREST error must THROW so the consuming hook's error
  // branch can fire, rather than being swallowed into a "no data" empty series.
  it('throws on a PostgREST error (does NOT masquerade as an empty series)', async () => {
    mockLimit.mockResolvedValueOnce({ data: null, error: { message: 'oops' } })
    const { fetchSeries } = await import('./econdelta')
    await expect(fetchSeries('brent_crude_usd_barrel', { limit: 8 })).rejects.toThrow(/oops/)
  })

  it('still returns [] on a successful query with no rows (honest emptiness, not an error)', async () => {
    mockLimit.mockResolvedValueOnce({ data: [], error: null })
    const { fetchSeries } = await import('./econdelta')
    expect(await fetchSeries('brent_crude_usd_barrel', { limit: 8 })).toEqual([])
  })

  it('returns empty array when supabase client is missing', async () => {
    vi.doMock('./supabase', () => ({
      getSupabase: () => null,
      isLiveDataAvailable: () => false,
    }))
    vi.resetModules()
    const { fetchSeries } = await import('./econdelta')
    const result = await fetchSeries('brent_crude_usd_barrel', { limit: 8 })
    expect(result).toEqual([])
  })
})

describe('fetchRecentBriefings (no credentials)', () => {
  it('returns empty array when supabase client is missing', async () => {
    vi.doMock('./supabase', () => ({
      getSupabase: () => null,
      isLiveDataAvailable: () => false,
    }))
    vi.resetModules()
    const { fetchRecentBriefings } = await import('./econdelta')
    expect(await fetchRecentBriefings()).toEqual([])
  })
})
