import type { Tenor, YieldDataPoint } from '../types'

export function calcSpread(longYield: number, shortYield: number): number {
  return Math.round((longYield - shortYield) * 100) // returns bps
}

export function getCurveSpread(yields: Record<Tenor, number>): number {
  return calcSpread(yields['10Y'], yields['91D'])
}

export function isInverted(yields: Record<Tenor, number>): boolean {
  return yields['10Y'] < yields['91D']
}

export function getCurveShape(yields: Record<Tenor, number>): 'normal' | 'flat' | 'inverted' | 'humped' {
  const spread = getCurveSpread(yields)
  if (spread < -10) return 'inverted'
  if (spread < 20) return 'flat'

  // Check for hump: if middle tenors are higher than both ends
  const midYield = yields['5Y']
  if (midYield > yields['91D'] && midYield > yields['20Y']) {
    return 'humped'
  }

  return 'normal'
}

export function getYieldChange(current: YieldDataPoint, previous: YieldDataPoint, tenor: Tenor): number | null {
  if (!current.yields[tenor] || !previous.yields[tenor]) return null
  return Math.round((current.yields[tenor] - previous.yields[tenor]) * 100) // bps
}

export function getSpreadDirection(currentSpread: number, previousSpread: number): 'steepening' | 'flattening' | 'stable' {
  const delta = currentSpread - previousSpread
  if (delta > 5) return 'steepening'
  if (delta < -5) return 'flattening'
  return 'stable'
}
