const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Compact month-year label for a metric's `as_of`, e.g. "2026-02-01" -> "Feb '26".
 * Used to mark lagged monthly metrics so a stale print is never read as today's figure.
 * Returns null for missing or unparseable input.
 */
export function monthLabel(iso: string | null | undefined): string | null {
  if (!iso) return null
  // Require a full YYYY-MM-DD prefix so a partial value (e.g. "2026" or "2026-03")
  // can't silently produce a fabricated vintage via Date()'s lenient parsing.
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return `${MONTHS[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(2)}`
}
