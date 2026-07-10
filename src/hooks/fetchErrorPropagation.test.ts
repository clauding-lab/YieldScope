import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// End-to-end proof of the "error ≠ empty for ALL hooks" fast-follow.
//
// Unlike the per-hook unit tests (which mock ../lib/econdelta and force a
// rejection directly), these tests mock ONLY the Supabase client seam and let
// the REAL fetchLatest/fetchSeries run. That exercises the full chain a live
// outage takes: Supabase returns { error } → the shared fetcher throws (instead
// of swallowing it into null/[]) → the hook's try/catch sets `error`. Before the
// throw-through fix these assertions fail, because the swallowed error left the
// hook in a clean `data`/`error: null` state that silently rendered fixture UI.
const { mockFrom, mockLimit } = vi.hoisted(() => {
  const mockLimit = vi.fn()
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: mockLimit,
  }
  return { mockFrom: vi.fn(() => chain), mockLimit }
})

vi.mock('../lib/supabase', () => ({
  getSupabase: () => ({ from: mockFrom }),
  isLiveDataAvailable: () => true,
}))

import { useYields } from './useYields'
import { useBanking } from './useBanking'

beforeEach(() => {
  mockFrom.mockClear()
  mockLimit.mockReset()
})

describe('Supabase-level errors propagate to hook error state (through the real fetchers)', () => {
  it('useYields surfaces an error when Supabase fails (feeds YieldCurve fetchErrored, not silent fixtures)', async () => {
    // Every fetchLatest/fetchSeries call resolves with a PostgREST error.
    mockLimit.mockResolvedValue({ data: null, error: { message: 'PostgREST 500' } })

    const { result } = renderHook(() => useYields())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).not.toBeNull()
    expect(result.current.data).toBeNull()
  })

  it('useBanking surfaces an error when Supabase fails (no clean CAR/NPL over a failed fetch)', async () => {
    mockLimit.mockResolvedValue({ data: null, error: { message: 'PostgREST 500' } })

    const { result } = renderHook(() => useBanking())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).not.toBeNull()
    expect(result.current.data).toBeNull()
  })

  it('a successful empty-rows query still settles into honest emptiness, never an error (useBanking)', async () => {
    // No error, zero rows: this is honest emptiness — the hook must resolve with
    // data (all nulls) and error === null, proving we did not over-rotate the
    // no-rows contract into a throw.
    mockLimit.mockResolvedValue({ data: [], error: null })

    const { result } = renderHook(() => useBanking())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeNull()
    expect(result.current.data).not.toBeNull()
    expect(result.current.data!.nplRatio).toBeNull()
    expect(result.current.data!.crar).toBeNull()
  })
})
