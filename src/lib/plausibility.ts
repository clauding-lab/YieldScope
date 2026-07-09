/**
 * Per-metric plausibility + vintage gate at the hook seam.
 *
 * The existing honesty gate is `value ?? null → DemoBadge` everywhere — great
 * for MISSING data, defenceless against present-but-WRONG data (e.g. a
 * fabricated `banking_sector_crar = 1.56%`, or a quarterly print that went
 * months stale while its `as_of` kept re-stamping today — landmine 16). This
 * module adds a lightweight second line: a plausibility band per metric and a
 * max-age-by-cadence check. A breach nulls the value so the page renders
 * `—` / DemoBadge / a stale chip — never a clean but wrong number.
 *
 * The bands below are FINANCIAL-JUDGMENT constants. They are deliberately wide
 * (catch fabrications and unit errors, not legitimately unusual prints) and are
 * flagged for Adnan's confirmation before being trusted as hard gates.
 */

import { monthLabel } from './dates'

// ---- Plausibility bands (percent) — confirm with Adnan before hardening ----
// Basel-III CAR: real BD system CRAR runs ~10–13%; a sub-5% or >30% print is
// almost certainly a data fault, not a real capital position.
export const CAR_BAND: Band = { min: 5, max: 30 }
// BB corridor / policy rates: repo, SDF, SLF, call — all live in single digits
// to low-teens; anything outside 0–20% is a parse/unit fault.
export const POLICY_RATE_BAND: Band = { min: 0, max: 20 }
// Industry gross NPL: BD is legitimately high (30%+ under current methodology —
// see AGENT_LEARNINGS 2026-05-28), so the band only rejects clear garbage.
export const NPL_BAND: Band = { min: 0, max: 60 }

// ---- Max age (days) before a metric of a given cadence reads as stale ----
// Quarterly 110d per the handoff; daily/monthly sized to catch a frozen feed
// without false-flagging a normal reporting lag.
export const MAX_AGE_DAYS = { daily: 14, monthly: 70, quarterly: 110 } as const
export type Cadence = keyof typeof MAX_AGE_DAYS

export interface Band {
  min: number
  max: number
}

export interface GateOptions {
  band?: Band
  cadence?: Cadence
  now?: Date
}

export interface GateResult {
  /** The value if plausible; null if it breaches the band (never a clean wrong number). */
  value: number | null
  /** Whole days between `asOf` and `now` (UTC calendar days); null if unknown. */
  ageDays: number | null
  /** True when `ageDays` exceeds the cadence's max age. */
  stale: boolean
  /** True when a non-null value falls outside the band. */
  implausible: boolean
  /** Compact vintage label from `asOf`, e.g. "Sep '25"; null if unparseable. */
  vintage: string | null
}

/** Whole UTC calendar days between a date-only ISO string and `now`. */
function ageDaysFrom(asOf: string, now: Date): number | null {
  if (!/^\d{4}-\d{2}-\d{2}/.test(asOf)) return null
  const [y, m, d] = asOf.slice(0, 10).split('-').map(Number)
  const from = Date.UTC(y, m - 1, d)
  if (Number.isNaN(from)) return null
  const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.floor((nowUTC - from) / 86_400_000)
}

/**
 * Gate a single metric point. Missing values pass through untouched (the
 * existing null→DemoBadge path handles them). An implausible value is nulled;
 * a stale value keeps its number but is flagged so the page can add a stale
 * chip + vintage.
 */
export function gateMetric(
  value: number | null | undefined,
  asOf: string | null | undefined,
  { band, cadence, now = new Date() }: GateOptions = {},
): GateResult {
  const vintage = monthLabel(asOf)
  const ageDays = asOf ? ageDaysFrom(asOf, now) : null
  const stale = cadence != null && ageDays != null && ageDays > MAX_AGE_DAYS[cadence]
  const implausible =
    value != null && band != null && (value < band.min || value > band.max)
  return {
    value: value == null || implausible ? null : value,
    ageDays,
    stale,
    implausible,
    vintage,
  }
}

/**
 * Corridor coherence: SDF (deposit floor) < repo (policy) < SLF (lending
 * ceiling). Returns true when the ordering holds, or when any leg is null
 * (can't judge → don't false-flag). A false result means at least one rate is
 * misparsed/misassigned and the corridor viz should be badged, not trusted.
 */
export function corridorCoherent(
  sdf: number | null,
  repo: number | null,
  slf: number | null,
): boolean {
  if (sdf == null || repo == null || slf == null) return true
  return sdf < repo && repo < slf
}
