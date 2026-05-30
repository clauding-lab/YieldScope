import { describe, it, expect } from 'vitest'
import { monthLabel } from './dates'

describe('monthLabel', () => {
  it('formats an ISO date to a compact month-year vintage', () => {
    expect(monthLabel('2026-02-01')).toBe("Feb '26")
    expect(monthLabel('2026-03-15')).toBe("Mar '26")
  })

  it('returns null for missing or unparseable input', () => {
    expect(monthLabel(null)).toBeNull()
    expect(monthLabel(undefined)).toBeNull()
    expect(monthLabel('not-a-date')).toBeNull()
  })
})
