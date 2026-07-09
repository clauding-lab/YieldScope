/**
 * Pure helpers for the LIVE sovereign yield curve (F3 step 2, Option A —
 * Adnan's call 2026-07-09): the axis keeps all 11 tenors; the 7 EconDelta-live
 * tenors plot as measured points; the 4 non-live tenors (7D / 14D / 28D / 15Y)
 * render as visible, labelled gaps. A segment that spans a gap is drawn as a
 * dashed "bridge" so the reader can't mistake it for measured data, and the
 * scrub readout returns null (→ "—") on a gapped tenor — never a fabricated
 * value (landmines 15/18).
 */

/** The product's 11-tenor axis. Must stay in sync with FX.curve.tenors. */
export const CURVE_AXIS = ['7D', '14D', '28D', '91D', '182D', '364D', '2Y', '5Y', '10Y', '15Y', '20Y'] as const

/** Minimum live points before the live curve renders (a 1-point "curve" is a dot, not a curve). */
export const MIN_LIVE_POINTS = 2

export interface CurvePoint {
  tenor: string
  /** Index on the full axis (gaps preserved). */
  index: number
  value: number
}

export interface CurveSegment {
  from: CurvePoint
  to: CurvePoint
  /** True when the segment spans one or more non-live tenors — render dashed. */
  bridged: boolean
}

/**
 * Map live per-tenor yields onto the axis. Non-live / null tenors are simply
 * absent from the result (they stay gaps — no interpolation, ever).
 */
export function liveCurvePoints(
  axis: readonly string[],
  yields: Record<string, number | null> | null | undefined,
): CurvePoint[] {
  if (!yields) return []
  return axis
    .map((tenor, index) => {
      const value = yields[tenor]
      return value != null ? { tenor, index, value } : null
    })
    .filter((p): p is CurvePoint => p != null)
}

/** Consecutive-point segments; bridged when the pair skips at least one axis slot. */
export function liveCurveSegments(points: CurvePoint[]): CurveSegment[] {
  return points.slice(1).map((to, i) => {
    const from = points[i]
    return { from, to, bridged: to.index - from.index > 1 }
  })
}

/**
 * Scrub honesty: the live value at an axis index, or null when that tenor has
 * no live print. The caller renders null as "—", never a fabricated number.
 */
export function scrubValueAt(points: CurvePoint[], axisIndex: number): number | null {
  return points.find(p => p.index === axisIndex)?.value ?? null
}

/** Axis tenors with no live print, e.g. ['7D','14D','28D','15Y']. */
export function gapTenors(axis: readonly string[], points: CurvePoint[]): string[] {
  const live = new Set(points.map(p => p.tenor))
  return axis.filter(t => !live.has(t))
}
