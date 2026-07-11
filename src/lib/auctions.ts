import { getSupabase } from './supabase'
import { roundTo } from './yieldMath'

// ---------------------------------------------------------------------------
// Structured auction tables (auction_results / auction_calendar) — NOT scalar
// metric_history. Anon-read RLS, same shared Brief anon key as the metric reads.
// ---------------------------------------------------------------------------

export interface AuctionResult {
  date: string              // ISO 'YYYY-MM-DD' (settlement / issue date)
  tenor: string             // normalized, e.g. '91D' / '5Y'
  sizeCr: number | null     // notified amount (BDT crore)
  bidCr: number | null      // total bids received (BDT crore)
  cover: number | null      // bid-to-cover
  wam: number | null        // weighted-avg maturity (years) — null for bills
  cutoff: number | null     // cut-off yield (%)
}

export interface AuctionCalendarEntry {
  date: string              // ISO 'YYYY-MM-DD' (scheduled auction date)
  tenor: string             // normalized
  notionalCr: number | null // planned notional (BDT crore)
}

interface AuctionResultRow {
  auction_date: string
  tenor: string
  size: number | null
  bid: number | null
  cover: number | null
  wam: number | null
  cutoff: number | null
}

interface AuctionCalendarRow {
  auction_date: string
  tenor: string
  notional: number | null
}

const numOrNull = (v: unknown): number | null =>
  v == null || Number.isNaN(Number(v)) ? null : Number(v)

function normalizeTenor(t: string): string {
  return (t ?? '').trim().toUpperCase()
}

export async function fetchAuctionResults(limit = 12): Promise<AuctionResult[]> {
  const client = getSupabase()
  if (!client) return []
  const { data, error } = await client
    .from('auction_results')
    .select('auction_date, tenor, size, bid, cover, wam, cutoff')
    .order('auction_date', { ascending: false })
    .limit(limit)
  // A PostgREST error must NOT masquerade as "zero auctions" — throw so the
  // hook's error state can render an honest error line instead of a definitive
  // empty-state claim built on a failed fetch.
  if (error) throw new Error(`auction_results fetch failed: ${error.message}`)
  if (!data) return []
  return (data as AuctionResultRow[]).map(r => ({
    date: r.auction_date,
    tenor: normalizeTenor(r.tenor),
    sizeCr: numOrNull(r.size),
    bidCr: numOrNull(r.bid),
    cover: numOrNull(r.cover),
    wam: numOrNull(r.wam),
    cutoff: numOrNull(r.cutoff),
  }))
}

export async function fetchAuctionCalendar(limit = 24): Promise<AuctionCalendarEntry[]> {
  const client = getSupabase()
  if (!client) return []
  const { data, error } = await client
    .from('auction_calendar')
    .select('auction_date, tenor, notional')
    .order('auction_date', { ascending: true })
    .limit(limit)
  if (error) throw new Error(`auction_calendar fetch failed: ${error.message}`)
  if (!data) return []
  return (data as AuctionCalendarRow[]).map(r => ({
    date: r.auction_date,
    tenor: normalizeTenor(r.tenor),
    notionalCr: numOrNull(r.notional),
  }))
}

// ---------------------------------------------------------------------------
// Pure display mappers (unit-tested) — date formatting, tenor ranking, and
// honest delta/flag derivation (no fabricated trends — landmine 18).
// ---------------------------------------------------------------------------

const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** '2026-05-24' -> '24 MAY' (upper) | '07 Jun' (title). UTC-stable. */
export function dayMon(iso: string, upper = true): string {
  const [, m, d] = iso.split('-').map(Number)
  const mon = MON[m - 1]
  return `${String(d).padStart(2, '0')} ${upper ? mon : mon[0] + mon.slice(1).toLowerCase()}`
}

/** Weekday abbreviation for a date-only ISO string, computed in UTC (no TZ drift). */
export function weekdayShort(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
}

/** Rank a tenor by duration so '91D · 182D · 364D · 2Y …' sorts naturally. */
export function tenorRankDays(tenor: string): number {
  const m = tenor.match(/^(\d+(?:\.\d+)?)\s*([DYM])/i)
  if (!m) return Number.MAX_SAFE_INTEGER
  const n = Number(m[1])
  const unit = m[2].toUpperCase()
  return unit === 'D' ? n : unit === 'M' ? n * 30 : n * 365
}

export interface AuctionDisplayRow {
  date: string
  tenor: string
  size: string
  bid: string
  cutoff: string
  wam: string
  cover: number | null
  delta: number | null      // vs prior same-tenor auction; null when no prior (NEVER fabricated)
  flag?: string             // 'TIGHT' when cover < 1.2
  cutoffHist: number[]      // same-tenor cutoffs up to this row (for a real trend; sparkline only if ≥ 2)
}

const kcr = (cr: number): string => `${roundTo(cr / 1000, 1)} KCr`

export function toAuctionDisplayRows(results: AuctionResult[]): AuctionDisplayRow[] {
  // Build per-tenor ascending history for honest delta + trend.
  const asc = results.slice().sort((a, b) => a.date.localeCompare(b.date))
  const byTenor = new Map<string, AuctionResult[]>()
  for (const r of asc) {
    const list = byTenor.get(r.tenor) ?? []
    list.push(r)
    byTenor.set(r.tenor, list)
  }

  return results
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(r => {
      const hist = byTenor.get(r.tenor) ?? []
      const idx = hist.findIndex(h => h.date === r.date && h.cutoff === r.cutoff)
      const prior = idx > 0 ? hist[idx - 1] : null
      const delta = r.cutoff != null && prior?.cutoff != null
        ? roundTo(r.cutoff - prior.cutoff, 2)
        : null
      const cutoffHist = hist
        .slice(0, idx + 1)
        .map(h => h.cutoff)
        .filter((v): v is number => v != null)
      return {
        date: dayMon(r.date, true),
        tenor: r.tenor,
        size: r.sizeCr != null ? kcr(r.sizeCr) : '—',
        bid: r.bidCr != null ? kcr(r.bidCr) : '—',
        cutoff: r.cutoff != null ? r.cutoff.toFixed(2) : '—',
        wam: r.wam != null ? r.wam.toFixed(2) : '—',
        cover: r.cover != null ? roundTo(r.cover, 2) : null,
        delta,
        flag: r.cover != null && r.cover < 1.2 ? 'TIGHT' : undefined,
        cutoffHist,
      }
    })
}

/** Fixture rows (src/data/fixtures.ts AuctionRow) adapted to the display shape for the
 *  offline/Supabase-unavailable fallback. cutoffHist is empty so no trend sparkline renders. */
export interface FixtureAuctionRow {
  date: string; tenor: string; size: string; bid: string; cutoff: string
  wam: string; cover: number; delta: number; flag?: string
}

export function fixtureToDisplay(rows: FixtureAuctionRow[]): AuctionDisplayRow[] {
  return rows.map(a => ({
    date: a.date, tenor: a.tenor, size: a.size, bid: a.bid, cutoff: a.cutoff,
    wam: a.wam, cover: a.cover, delta: a.delta, flag: a.flag, cutoffHist: [],
  }))
}

export interface UpcomingAuction {
  date: string   // '07 Jun'
  day: string    // 'Sun'
  tenor: string  // '91D · 182D · 364D'
  size: string   // '9.5 k Cr'
}

function isoLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function toUpcomingAuctions(
  cal: AuctionCalendarEntry[],
  now: Date,
  maxDates = 4,
): UpcomingAuction[] {
  const todayISO = isoLocal(now)
  const byDate = new Map<string, AuctionCalendarEntry[]>()
  for (const e of cal) {
    if (e.date < todayISO) continue
    const list = byDate.get(e.date) ?? []
    list.push(e)
    byDate.set(e.date, list)
  }
  return [...byDate.keys()]
    .sort()
    .slice(0, maxDates)
    .map(date => {
      const entries = byDate.get(date)!.slice().sort((a, b) => tenorRankDays(a.tenor) - tenorRankDays(b.tenor))
      const sum = entries.reduce((s, e) => s + (e.notionalCr ?? 0), 0)
      return {
        date: dayMon(date, false),
        day: weekdayShort(date),
        tenor: entries.map(e => e.tenor).join(' · '),
        size: `${roundTo(sum / 1000, 1)} k Cr`,
      }
    })
}

export interface WeeklyIssuance {
  weekLabel: string  // 'w/c' start date of the 7-day window, e.g. '11 Jul'
  tbillCr: number
  tbondCr: number
}

const DAY_MS = 86_400_000

/** Bucket forward calendar entries into 7-day windows from `now` (today inclusive).
 *  Bills = tenor < 365 days; bonds = the rest. Trailing all-zero weeks are trimmed
 *  so the chart only claims the horizon the BB calendar actually covers. */
export function toWeeklyIssuance(
  cal: AuctionCalendarEntry[],
  now: Date,
  weeks = 12,
): WeeklyIssuance[] {
  const todayISO = isoLocal(now)
  const t0 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const buckets: WeeklyIssuance[] = Array.from({ length: weeks }, (_, i) => {
    const start = new Date(t0 + i * 7 * DAY_MS)
    return { weekLabel: dayMon(start.toISOString().slice(0, 10), false), tbillCr: 0, tbondCr: 0 }
  })
  for (const e of cal) {
    if (e.date < todayISO || e.notionalCr == null) continue
    const [y, m, d] = e.date.split('-').map(Number)
    const idx = Math.floor((Date.UTC(y, m - 1, d) - t0) / (7 * DAY_MS))
    if (idx < 0 || idx >= weeks) continue
    if (tenorRankDays(e.tenor) < 365) buckets[idx] = { ...buckets[idx], tbillCr: buckets[idx].tbillCr + e.notionalCr }
    else buckets[idx] = { ...buckets[idx], tbondCr: buckets[idx].tbondCr + e.notionalCr }
  }
  let last = -1
  buckets.forEach((b, i) => { if (b.tbillCr > 0 || b.tbondCr > 0) last = i })
  return buckets.slice(0, last + 1)
}
