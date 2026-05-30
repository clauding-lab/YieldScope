import { describe, it, expect } from 'vitest'
import { spreadBps, roundTo } from './yieldMath'

describe('spreadBps', () => {
  it('returns the spread in basis points', () => {
    expect(spreadBps(12.18, 11.42)).toBe(76)
  })
  it('returns null when either input is null', () => {
    expect(spreadBps(12.18, null)).toBeNull()
    expect(spreadBps(null, 11.42)).toBeNull()
  })
})

describe('roundTo', () => {
  it('removes IEEE-754 subtraction artifacts at the given precision', () => {
    expect(roundTo(11.42 - 11.50, 2)).toBe(-0.08)
    expect(roundTo(12.18 - 12.20, 2)).toBe(-0.02)
    expect(roundTo(119.62 - 119.58, 2)).toBe(0.04)
  })
  it('passes null through', () => {
    expect(roundTo(null, 2)).toBeNull()
    expect(roundTo(undefined, 2)).toBeNull()
  })
})
