// src/hooks/useBanking.repo.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('../lib/econdelta', () => ({ fetchLatest: vi.fn(), fetchSeries: vi.fn() }))

import { fetchLatest, fetchSeries } from '../lib/econdelta'
import { useBanking } from './useBanking'
import { METRIC } from '../lib/econdelta-metrics'

beforeEach(() => {
  vi.mocked(fetchLatest).mockResolvedValue(null)
  vi.mocked(fetchSeries).mockImplementation(async (id: string) =>
    id === METRIC.INTERBANK_REPO
      ? [{ asOf: '2026-07-10', value: 118000 }, { asOf: '2026-07-11', value: 124600 }]
      : [])
  vi.mocked(fetchLatest).mockImplementation(async (id: string) =>
    id === METRIC.INTERBANK_REPO ? { asOf: '2026-07-11', value: 124600 } : null)
})

describe('useBanking · repo borrowing', () => {
  it('exposes latest repo borrowing and its history', async () => {
    const { result } = renderHook(() => useBanking())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data?.repoBorrowCr).toBe(124600)
    expect(result.current.data?.repoBorrowHist).toEqual([118000, 124600])
    expect(result.current.data?.repoBorrowAsOf).toBe('2026-07-11')
  })
})
