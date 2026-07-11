// src/hooks/useYields.sdf.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('../lib/econdelta', () => ({ fetchLatest: vi.fn(), fetchSeries: vi.fn() }))

import { fetchLatest, fetchSeries } from '../lib/econdelta'
import { useYields } from './useYields'
import { METRIC } from '../lib/econdelta-metrics'

beforeEach(() => {
  vi.mocked(fetchSeries).mockResolvedValue([])
  vi.mocked(fetchLatest).mockImplementation(async (id: string) => {
    if (id === METRIC.TBILL_91) return { asOf: '2026-07-11', value: 9.33 }
    if (id === METRIC.POLICY_RATE_SDF) return { asOf: '2026-07-11', value: 7.5 }
    return null
  })
})

describe('useYields · 91d–SDF spread', () => {
  it('computes spread91D_SDF_bps from live 91D and SDF', async () => {
    const { result } = renderHook(() => useYields())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data?.spread91D_SDF_bps).toBe(183) // (9.33 − 7.50) × 100
  })

  it('is null when SDF is absent', async () => {
    vi.mocked(fetchLatest).mockImplementation(async (id: string) =>
      id === METRIC.TBILL_91 ? { asOf: '2026-07-11', value: 9.33 } : null)
    const { result } = renderHook(() => useYields())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data?.spread91D_SDF_bps).toBeNull()
  })
})
