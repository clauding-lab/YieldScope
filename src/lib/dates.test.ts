import { describe, it, expect } from 'vitest'
import { monthLabel, todayLabel, weekdayName } from './dates'

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

  it('returns null for partial dates rather than fabricating a vintage', () => {
    expect(monthLabel('2026')).toBeNull()
    expect(monthLabel('2026-03')).toBeNull()
  })
})

describe('weekdayName', () => {
  it('returns the long weekday name for a given date', () => {
    // Dates constructed from local parts so getDay() is timezone-stable.
    expect(weekdayName(new Date(2026, 4, 31))).toBe('Sunday')    // 31 May 2026
    expect(weekdayName(new Date(2026, 4, 27))).toBe('Wednesday') // the old hardcoded day
  })
})

describe('todayLabel', () => {
  it('formats a date as "Weekday, D Mon"', () => {
    expect(todayLabel(new Date(2026, 4, 31))).toBe('Sunday, 31 May')
    expect(todayLabel(new Date(2026, 4, 27))).toBe('Wednesday, 27 May')
    expect(todayLabel(new Date(2026, 0, 1))).toBe('Thursday, 1 Jan')
  })
})
