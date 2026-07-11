import { describe, it, expect } from 'vitest'
import { toWeeklyIssuance } from './auctions'

const NOW = new Date('2026-07-11T10:00:00')

describe('toWeeklyIssuance', () => {
  it('buckets forward entries into 7-day windows, splitting bills (<365d) from bonds', () => {
    const out = toWeeklyIssuance([
      { date: '2026-07-10', tenor: '91D', notionalCr: 99999 },  // past — dropped
      { date: '2026-07-13', tenor: '91D', notionalCr: 4000 },
      { date: '2026-07-14', tenor: '364D', notionalCr: 3000 },
      { date: '2026-07-15', tenor: '10Y', notionalCr: 2500 },
      { date: '2026-07-21', tenor: '2Y', notionalCr: 2000 },
    ], NOW, 12)
    expect(out[0]).toEqual({ weekLabel: '11 Jul', tbillCr: 7000, tbondCr: 2500 })
    expect(out[1]).toEqual({ weekLabel: '18 Jul', tbillCr: 0, tbondCr: 2000 })
    expect(out).toHaveLength(2) // trailing all-zero weeks trimmed
  })

  it('returns [] when nothing is forward-dated', () => {
    expect(toWeeklyIssuance([{ date: '2026-07-01', tenor: '91D', notionalCr: 4000 }], NOW)).toEqual([])
  })
})
