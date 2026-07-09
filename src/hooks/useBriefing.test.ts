import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('../lib/econdelta', () => ({
  fetchRecentBriefings: vi.fn(),
}))

import { fetchRecentBriefings } from '../lib/econdelta'
import { useBriefing } from './useBriefing'

beforeEach(() => {
  vi.mocked(fetchRecentBriefings).mockReset()
})

const SAMPLE = {
  weekOf: '2026-06-01',
  generatedAt: '2026-06-01T01:00:00Z',
  title: 'The short end is rotating',
  body: 'Three forces...',
  featuredAnomalies: [{
    candidate_id: 'call_money_rate:change', label: 'Call money rate',
    stat: 'change vs prior', value: 9.34, detail: '+2.24 vs prior 7.10',
    severity: 'up' as const, metric_id: 'call_money_rate', why: 'VAT outflow',
  }],
  openThreads: [],
  dataAsOf: '2026-05-31',
  staleSeries: [],
}

describe('useBriefing', () => {
  it('starts in loading state', async () => {
    vi.mocked(fetchRecentBriefings).mockResolvedValue([])
    const { result } = renderHook(() => useBriefing())
    expect(result.current.loading).toBe(true)
    // Settle the pending async effect inside act() to avoid an update-after-test warning.
    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it('maps briefings (newest first) from EconDelta', async () => {
    vi.mocked(fetchRecentBriefings).mockResolvedValue([SAMPLE])
    const { result } = renderHook(() => useBriefing())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.briefings[0].title).toBe('The short end is rotating')
    expect(result.current.briefings[0].featuredAnomalies[0].value).toBe(9.34)
    expect(result.current.error).toBeNull()
  })

  it('returns empty array when no briefings exist', async () => {
    vi.mocked(fetchRecentBriefings).mockResolvedValue([])
    const { result } = renderHook(() => useBriefing())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.briefings).toEqual([])
  })

  it('captures error', async () => {
    vi.mocked(fetchRecentBriefings).mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useBriefing())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
  })
})
