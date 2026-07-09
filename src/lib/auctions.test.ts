import { describe, it, expect } from 'vitest'
import {
  dayMon,
  weekdayShort,
  toAuctionDisplayRows,
  toUpcomingAuctions,
  type AuctionResult,
  type AuctionCalendarEntry,
} from './auctions'

describe('dayMon / weekdayShort', () => {
  it('formats an ISO date as day + uppercase month', () => {
    expect(dayMon('2026-05-24')).toBe('24 MAY')
    expect(dayMon('2026-05-06')).toBe('06 MAY')
  })
  it('formats title-case month when upper=false', () => {
    expect(dayMon('2026-06-07', false)).toBe('07 Jun')
  })
  it('returns the weekday abbreviation (UTC-stable)', () => {
    expect(weekdayShort('2026-06-07')).toBe('Sun')
  })
})

describe('toAuctionDisplayRows', () => {
  const results: AuctionResult[] = [
    { date: '2026-05-24', tenor: '91D', sizeCr: 3500, bidCr: 6904.22, cover: 1.97, wam: null, cutoff: 10.15 },
    { date: '2026-05-17', tenor: '91D', sizeCr: 3000, bidCr: 9000, cover: 3.0, wam: null, cutoff: 10.50 },
    { date: '2026-05-20', tenor: '15Y', sizeCr: 1000, bidCr: 4095.62, cover: 4.1, wam: 13.85, cutoff: 11.0198 },
    { date: '2026-05-13', tenor: '5Y', sizeCr: 3000, bidCr: 3200, cover: 1.07, wam: 4.96, cutoff: 10.78 },
  ]

  it('orders rows newest-first and formats fields', () => {
    const rows = toAuctionDisplayRows(results)
    expect(rows.map(r => `${r.date} ${r.tenor}`)).toEqual([
      '24 MAY 91D', '20 MAY 15Y', '17 MAY 91D', '13 MAY 5Y',
    ])
    const first = rows[0]
    expect(first.size).toBe('3.5 KCr')
    expect(first.bid).toBe('6.9 KCr')
    expect(first.cutoff).toBe('10.15')
    expect(first.cover).toBe(1.97)
  })

  it('shows WAM only for bonds (em-dash for bills)', () => {
    const rows = toAuctionDisplayRows(results)
    expect(rows.find(r => r.tenor === '91D' && r.date === '24 MAY')!.wam).toBe('—')
    expect(rows.find(r => r.tenor === '15Y')!.wam).toBe('13.85')
  })

  it('computes the cutoff delta from the prior same-tenor auction, null when none', () => {
    const rows = toAuctionDisplayRows(results)
    // newest 91D (24 May, 10.15) vs prior 91D (17 May, 10.50) => -0.35
    expect(rows.find(r => r.tenor === '91D' && r.date === '24 MAY')!.delta).toBe(-0.35)
    // single-occurrence tenors have no prior => delta null (NEVER fabricated — landmine 18)
    expect(rows.find(r => r.tenor === '15Y')!.delta).toBeNull()
    expect(rows.find(r => r.tenor === '5Y')!.delta).toBeNull()
    // the earliest 91D is also a first occurrence => null
    expect(rows.find(r => r.tenor === '91D' && r.date === '17 MAY')!.delta).toBeNull()
  })

  it('flags TIGHT only when cover < 1.2', () => {
    const rows = toAuctionDisplayRows(results)
    expect(rows.find(r => r.tenor === '5Y')!.flag).toBe('TIGHT')   // cover 1.07
    expect(rows.find(r => r.tenor === '91D' && r.date === '24 MAY')!.flag).toBeUndefined()
  })
})

describe('toUpcomingAuctions', () => {
  const cal: AuctionCalendarEntry[] = [
    { date: '2026-05-30', tenor: '91D', notionalCr: 4000 },  // past — excluded
    { date: '2026-06-07', tenor: '91D', notionalCr: 4000 },
    { date: '2026-06-07', tenor: '182D', notionalCr: 3000 },
    { date: '2026-06-07', tenor: '364D', notionalCr: 2500 },
    { date: '2026-06-09', tenor: '5Y', notionalCr: 3500 },
  ]
  const now = new Date('2026-06-02T00:00:00Z')

  it('groups future dates, joins tenors by duration, sums notional', () => {
    const up = toUpcomingAuctions(cal, now, 4)
    expect(up).toHaveLength(2)
    expect(up[0]).toEqual({ date: '07 Jun', day: 'Sun', tenor: '91D · 182D · 364D', size: '9.5 k Cr' })
    expect(up[1].tenor).toBe('5Y')
  })

  it('excludes past auction dates', () => {
    const up = toUpcomingAuctions(cal, now, 4)
    expect(up.some(u => u.date === '30 May')).toBe(false)
  })

  it('returns an empty list when every calendar date is in the past (drives the honest empty state, not stale fixture dates)', () => {
    const allPast: AuctionCalendarEntry[] = [
      { date: '2026-06-01', tenor: '91D', notionalCr: 4000 },
      { date: '2026-06-09', tenor: '5Y', notionalCr: 3500 },
    ]
    expect(toUpcomingAuctions(allPast, new Date('2026-07-09T00:00:00Z'), 4)).toEqual([])
  })
})
