/**
 * Pure helpers for the LIVE sovereign yield curve — Option B (Adnan's revised
 * axis decision, 2026-07-09, superseding the same-day Option A that PR #25
 * shipped): the live axis IS the 7 EconDelta tenors. The four never-live
 * tenors (7D / 14D / 28D / 15Y) leave the axis entirely — no permanent dimmed
 * gap slots.
 *
 * The gap machinery below is KEPT for genuinely missing prints WITHIN the 7:
 * if a tenor has no row one day (e.g. 2Y), it renders as an honest labelled
 * gap and any span across it draws as a dashed bridge — never interpolated,
 * never presented as measured data (landmines 15/18). Option B removed the
 * four never-live axis slots, not the honesty logic.
 */

/** The live axis: exactly the 7 EconDelta tenors, short to long. */
export const LIVE_CURVE_AXIS = ['91D', '182D', '364D', '2Y', '5Y', '10Y', '20Y'] as const

/** Minimum live points before the live curve renders (a 1-point "curve" is a dot, not a curve). */
export const MIN_LIVE_POINTS = 2

export interface CurvePoint {
  tenor: string
  /** Index on the axis (indices of missing prints stay unoccupied — gaps preserved). */
  index: number
  value: number
}

export interface CurveSegment {
  from: CurvePoint
  to: CurvePoint
  /** True when the segment spans one or more missing prints — render dashed. */
  bridged: boolean
}

/**
 * Map live per-tenor yields onto the axis. Tenors with no print are simply
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

/** Axis tenors with no live print — empty at full coverage. */
export function gapTenors(axis: readonly string[], points: CurvePoint[]): string[] {
  const live = new Set(points.map(p => p.tenor))
  return axis.filter(t => !live.has(t))
}
