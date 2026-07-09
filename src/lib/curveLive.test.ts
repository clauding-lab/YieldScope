import { describe, it, expect } from 'vitest'
import {
  CURVE_AXIS,
  liveCurvePoints,
  liveCurveSegments,
  scrubValueAt,
  gapTenors,
} from './curveLive'

// The real live coverage: 7 EconDelta tenors, 4 gaps (7D/14D/28D/15Y).
const LIVE_YIELDS: Record<string, number | null> = {
  '91D': 9.33, '182D': 9.57, '364D': 9.63, '2Y': 10.23, '5Y': 10.37, '10Y': 10.24, '20Y': 11.23,
}

describe('liveCurvePoints', () => {
  it('maps the 7 live tenors onto the 11-tenor axis, preserving gap indices', () => {
    const pts = liveCurvePoints(CURVE_AXIS, LIVE_YIELDS)
    expect(pts).toHaveLength(7)
    expect(pts[0]).toEqual({ tenor: '91D', index: 3, value: 9.33 })   // 7D/14D/28D lead as gaps
    expect(pts[6]).toEqual({ tenor: '20Y', index: 10, value: 11.23 }) // 15Y (index 9) is a gap
  })

  it('drops null tenors — a null is a gap, never an interpolated point', () => {
    const pts = liveCurvePoints(CURVE_AXIS, { ...LIVE_YIELDS, '5Y': null })
    expect(pts).toHaveLength(6)
    expect(pts.some(p => p.tenor === '5Y')).toBe(false)
  })

  it('returns [] for missing yields (no data yet / no credentials)', () => {
    expect(liveCurvePoints(CURVE_AXIS, null)).toEqual([])
    expect(liveCurvePoints(CURVE_AXIS, undefined)).toEqual([])
  })
})

describe('liveCurveSegments', () => {
  it('marks only the gap-spanning segment as bridged (10Y→20Y across the 15Y gap)', () => {
    const segs = liveCurveSegments(liveCurvePoints(CURVE_AXIS, LIVE_YIELDS))
    expect(segs).toHaveLength(6)
    const bridged = segs.filter(s => s.bridged)
    expect(bridged).toHaveLength(1)
    expect(bridged[0].from.tenor).toBe('10Y')
    expect(bridged[0].to.tenor).toBe('20Y')
    // Adjacent live tenors draw solid
    expect(segs.find(s => s.from.tenor === '91D')!.bridged).toBe(false)
  })

  it('bridges across a mid-curve missing tenor too', () => {
    const segs = liveCurveSegments(liveCurvePoints(CURVE_AXIS, { ...LIVE_YIELDS, '5Y': null }))
    const bridged = segs.filter(s => s.bridged)
    expect(bridged.map(s => `${s.from.tenor}->${s.to.tenor}`)).toEqual(['2Y->10Y', '10Y->20Y'])
  })
})

describe('scrubValueAt — the scrub readout must never fabricate a value on a gapped tenor', () => {
  const pts = liveCurvePoints(CURVE_AXIS, LIVE_YIELDS)

  it('returns the live value on a live tenor index', () => {
    expect(scrubValueAt(pts, 3)).toBe(9.33)   // 91D
    expect(scrubValueAt(pts, 10)).toBe(11.23) // 20Y
  })

  it('returns null on every gapped tenor index (7D/14D/28D/15Y)', () => {
    for (const idx of [0, 1, 2, 9]) {
      expect(scrubValueAt(pts, idx)).toBeNull()
    }
  })
})

describe('gapTenors', () => {
  it('names exactly the non-live tenors', () => {
    expect(gapTenors(CURVE_AXIS, liveCurvePoints(CURVE_AXIS, LIVE_YIELDS))).toEqual(['7D', '14D', '28D', '15Y'])
  })
})
