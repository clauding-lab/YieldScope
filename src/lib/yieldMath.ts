/**
 * Yield curve math helpers. Pure functions, no I/O.
 */

/**
 * Returns the spread between two yields in basis points (1 bp = 0.01%).
 * Inputs are percent values (e.g. 12.18 for 12.18%). Returns null when either
 * input is null/undefined — useful for partial-data scenarios.
 *
 *   spreadBps(12.18, 11.42) // → 76
 *   spreadBps(12.18, null)  // → null
 */
export function spreadBps(longYieldPct: number | null | undefined, shortYieldPct: number | null | undefined): number | null {
  if (longYieldPct == null || shortYieldPct == null) return null
  return Math.round((longYieldPct - shortYieldPct) * 100)
}
