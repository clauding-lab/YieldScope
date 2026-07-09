import { describe, it, expect } from 'vitest'
import {
  LIVE_CURVE_AXIS,
  liveCurvePoints,
  liveCurveSegments,
  scrubValueAt,
  gapTenors,
} from './curveLive'

// Option B: the live axis IS the 7 EconDelta tenors. Full coverage has no
// gaps; the gap machinery below is exercised by a genuinely missing print.
const LIVE_YIELDS: Record<string, number | null> = {
  '91D': 9.33, '182D': 9.57, '364D': 9.63, '2Y': 10.23, '5Y': 10.37, '10Y': 10.24, '20Y': 11.23,
}

describe('LIVE_CURVE_AXIS (Option B)', () => {
  it('is exactly the 7 EconDelta tenors — no 7D/14D/28D/15Y slots', () => {
    expect([...LIVE_CURVE_AXIS]).toEqual(['91D', '182D', '364D', '2Y', '5Y', '10Y', '20Y'])
  })
})

describe('liveCurvePoints', () => {
  it('maps full coverage onto the 7-tenor axis with 91D at index 0 and 20Y at index 6', () => {
    const pts = liveCurvePoints(LIVE_CURVE_AXIS, LIVE_YIELDS)
    expect(pts).toHaveLength(7)
    expect(pts[0]).toEqual({ tenor: '91D', index: 0, value: 9.33 })
    expect(pts[6]).toEqual({ tenor: '20Y', index: 6, value: 11.23 })
  })

  it('drops a missing print — a null is a gap, never an interpolated point', () => {
    const pts = liveCurvePoints(LIVE_CURVE_AXIS, { ...LIVE_YIELDS, '5Y': null })
    expect(pts).toHaveLength(6)
    expect(pts.some(p => p.tenor === '5Y')).toBe(false)
    // Indices around the gap stay anchored to the axis (2Y=3, 10Y=5)
    expect(pts.find(p => p.tenor === '2Y')!.index).toBe(3)
    expect(pts.find(p => p.tenor === '10Y')!.index).toBe(5)
  })

  it('returns [] for missing yields (no data yet / no credentials)', () => {
    expect(liveCurvePoints(LIVE_CURVE_AXIS, null)).toEqual([])
    expect(liveCurvePoints(LIVE_CURVE_AXIS, undefined)).toEqual([])
  })
})

describe('liveCurveSegments', () => {
  it('full coverage draws 6 solid segments — zero bridges', () => {
    const segs = liveCurveSegments(liveCurvePoints(LIVE_CURVE_AXIS, LIVE_YIELDS))
    expect(segs).toHaveLength(6)
    expect(segs.every(s => !s.bridged)).toBe(true)
  })

  it('a missing 5Y print bridges 2Y→10Y (dashed), the rest stay solid', () => {
    const segs = liveCurveSegments(liveCurvePoints(LIVE_CURVE_AXIS, { ...LIVE_YIELDS, '5Y': null }))
    expect(segs).toHaveLength(5)
    const bridged = segs.filter(s => s.bridged)
    expect(bridged.map(s => `${s.from.tenor}->${s.to.tenor}`)).toEqual(['2Y->10Y'])
  })

  it('a missing EDGE print (20Y) shortens the curve without any bridge', () => {
    const segs = liveCurveSegments(liveCurvePoints(LIVE_CURVE_AXIS, { ...LIVE_YIELDS, '20Y': null }))
    expect(segs).toHaveLength(5)
    expect(segs.every(s => !s.bridged)).toBe(true)
    expect(segs[segs.length - 1].to.tenor).toBe('10Y')
  })
})

describe('scrubValueAt — the readout must never fabricate a value on a missing print', () => {
  it('returns the live value on a live tenor index', () => {
    const pts = liveCurvePoints(LIVE_CURVE_AXIS, LIVE_YIELDS)
    expect(scrubValueAt(pts, 0)).toBe(9.33)  // 91D
    expect(scrubValueAt(pts, 6)).toBe(11.23) // 20Y
  })

  it('returns null on a missing print index (5Y = index 4)', () => {
    const pts = liveCurvePoints(LIVE_CURVE_AXIS, { ...LIVE_YIELDS, '5Y': null })
    expect(scrubValueAt(pts, 4)).toBeNull()
  })
})

describe('gapTenors', () => {
  it('is empty at full coverage', () => {
    expect(gapTenors(LIVE_CURVE_AXIS, liveCurvePoints(LIVE_CURVE_AXIS, LIVE_YIELDS))).toEqual([])
  })

  it('names exactly the missing prints', () => {
    const pts = liveCurvePoints(LIVE_CURVE_AXIS, { ...LIVE_YIELDS, '5Y': null, '2Y': null })
    expect(gapTenors(LIVE_CURVE_AXIS, pts)).toEqual(['2Y', '5Y'])
  })
})
