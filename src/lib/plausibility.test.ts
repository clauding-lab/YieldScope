import { describe, it, expect } from 'vitest'
import {
  gateMetric,
  corridorCoherent,
  CAR_BAND,
  NPL_BAND,
  POLICY_RATE_BAND,
  MAX_AGE_DAYS,
} from './plausibility'

const NOW = new Date('2026-07-09T06:00:00Z')

describe('gateMetric — plausibility band', () => {
  it('passes a value inside the band untouched', () => {
    const g = gateMetric(11.6, '2026-03-31', { band: CAR_BAND, cadence: 'quarterly', now: NOW })
    expect(g.value).toBe(11.6)
    expect(g.implausible).toBe(false)
  })

  it('nulls the fabricated CRAR (1.56%) below the CAR band — never a clean wrong number', () => {
    const g = gateMetric(1.56, '2025-09-30', { band: CAR_BAND, cadence: 'quarterly', now: NOW })
    expect(g.value).toBeNull()
    expect(g.implausible).toBe(true)
  })

  it('nulls a value above the band (e.g. a 100x unit error)', () => {
    const g = gateMetric(156, '2025-09-30', { band: CAR_BAND, now: NOW })
    expect(g.value).toBeNull()
    expect(g.implausible).toBe(true)
  })

  it('lets a legitimately-high BD NPL (32.26%) through the wide NPL band', () => {
    const g = gateMetric(32.26, '2026-03-31', { band: NPL_BAND, cadence: 'quarterly', now: NOW })
    expect(g.value).toBe(32.26)
    expect(g.implausible).toBe(false)
  })

  it('treats a missing value as pass-through null, not implausible', () => {
    const g = gateMetric(null, '2026-03-31', { band: CAR_BAND, now: NOW })
    expect(g.value).toBeNull()
    expect(g.implausible).toBe(false)
  })

  it('accepts the real policy corridor rates (7.5 / 10 / 11.5) inside the 0–20 band', () => {
    for (const v of [7.5, 10, 11.5]) {
      expect(gateMetric(v, '2026-07-09', { band: POLICY_RATE_BAND, now: NOW }).implausible).toBe(false)
    }
  })
})

describe('gateMetric — max-age by cadence', () => {
  it('flags a quarterly print older than 110 days as stale', () => {
    // 2025-09-30 -> 2026-07-09 is ~282 days
    const g = gateMetric(1.56, '2025-09-30', { band: CAR_BAND, cadence: 'quarterly', now: NOW })
    expect(g.stale).toBe(true)
    expect(g.ageDays).toBeGreaterThan(MAX_AGE_DAYS.quarterly)
  })

  it('does NOT flag a ~100-day-old quarterly print (within 110)', () => {
    const g = gateMetric(11.8, '2026-03-31', { cadence: 'quarterly', now: NOW })
    expect(g.stale).toBe(false)
    expect(g.ageDays).toBeLessThanOrEqual(MAX_AGE_DAYS.quarterly)
  })

  it('does not flag staleness when no cadence is given', () => {
    const g = gateMetric(1.56, '2020-01-01', { band: CAR_BAND, now: NOW })
    expect(g.stale).toBe(false)
  })

  it('produces a compact vintage label from as_of', () => {
    expect(gateMetric(1.56, '2025-09-30', { now: NOW }).vintage).toBe("Sep '25")
    expect(gateMetric(32.26, '2026-03-31', { now: NOW }).vintage).toBe("Mar '26")
    expect(gateMetric(1, null, { now: NOW }).vintage).toBeNull()
  })
})

describe('corridorCoherent', () => {
  it('true when SDF < repo < SLF (real BB corridor)', () => {
    expect(corridorCoherent(7.5, 10, 11.5)).toBe(true)
  })
  it('false when SDF is at or above repo', () => {
    expect(corridorCoherent(9, 8, 11.5)).toBe(false)
  })
  it('false when SLF is at or below repo', () => {
    expect(corridorCoherent(7.5, 10, 9)).toBe(false)
  })
  it('true (cannot judge) when any leg is null', () => {
    expect(corridorCoherent(null, 10, 11.5)).toBe(true)
    expect(corridorCoherent(7.5, null, 11.5)).toBe(true)
    expect(corridorCoherent(7.5, 10, null)).toBe(true)
  })
})
