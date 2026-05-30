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

/**
 * Rounds a number to `dp` decimal places, killing IEEE-754 subtraction artifacts
 * (e.g. 11.42 - 11.50 === -0.08000000000000007). Use before passing a computed
 * delta to a component that renders the value verbatim. Returns null passthrough.
 *
 *   roundTo(-0.08000000000000007, 2) // → -0.08
 *   roundTo(null, 2)                 // → null
 */
export function roundTo(value: number | null | undefined, dp: number): number | null {
  if (value == null) return null
  const f = 10 ** dp
  return Math.round(value * f) / f
}
