import { getSupabase, isLiveDataAvailable } from './supabase'
import { MONTHLY_METRICS, type MetricId } from './econdelta-metrics'

export interface MetricPoint {
  asOf: string
  value: number
}

interface FetchSeriesOptions {
  limit?: number
  sinceISO?: string
}

function tableFor(metricId: MetricId | string): string {
  return MONTHLY_METRICS.has(metricId as MetricId)
    ? 'metric_history_monthly'
    : 'metric_history'
}

export async function fetchLatest(metricId: MetricId | string): Promise<MetricPoint | null> {
  const client = getSupabase()
  if (!client) return null

  const { data, error } = await client
    .from(tableFor(metricId))
    .select('metric_id, as_of, value')
    .eq('metric_id', metricId)
    .order('as_of', { ascending: false })
    .limit(1)

  // A Supabase error must NOT masquerade as "no rows" — throw so the consuming
  // hook's error branch can render an honest outage instead of silently falling
  // back to fixture/empty UI (mirrors src/lib/auctions.ts). A successful query
  // with zero rows is honest emptiness → still null.
  if (error) throw new Error(`${tableFor(metricId)} fetch failed (${metricId}): ${error.message}`)
  if (!data || data.length === 0) return null
  const row = data[0] as { as_of: string; value: number }
  return { asOf: row.as_of, value: Number(row.value) }
}

export async function fetchSeries(
  metricId: MetricId | string,
  { limit = 24, sinceISO }: FetchSeriesOptions = {},
): Promise<MetricPoint[]> {
  const client = getSupabase()
  if (!client) return []

  let query = client
    .from(tableFor(metricId))
    .select('metric_id, as_of, value')
    .eq('metric_id', metricId)

  if (sinceISO) {
    query = query.gte('as_of', sinceISO)
  }

  const { data, error } = await query
    .order('as_of', { ascending: false })
    .limit(limit)
  // Throw on a Supabase error (see fetchLatest) — a failed fetch must reach the
  // hook's error state, not be swallowed into an empty series. No rows = [].
  if (error) throw new Error(`${tableFor(metricId)} fetch failed (${metricId}): ${error.message}`)
  if (!data) return []

  return (data as { as_of: string; value: number }[])
    .map(r => ({ asOf: r.as_of, value: Number(r.value) }))
    .reverse() // PostgREST returned desc; flip to ascending for chart use
}

// ---------------------------------------------------------------------------
// Weekly ALCO briefings (the `briefings` table — row-shaped, not metric_history)
// ---------------------------------------------------------------------------

export interface BriefingAnomaly {
  candidate_id: string
  label: string
  stat: string
  value: number
  detail: string
  severity: 'up' | 'down' | 'warn'
  metric_id: string
  why: string
}

export interface BriefingThread {
  id: string
  thread: string
  status: 'open' | 'resolved'
  since_week?: string
  note?: string
}

export interface Briefing {
  weekOf: string
  generatedAt: string
  title: string
  body: string
  featuredAnomalies: BriefingAnomaly[]
  openThreads: BriefingThread[]
  dataAsOf: string
  staleSeries: string[]
}

interface BriefingRow {
  week_of: string
  generated_at: string
  title: string
  body: string
  featured_anomalies: BriefingAnomaly[] | null
  open_threads: BriefingThread[] | null
  data_as_of: string
  stale_series: string[] | null
}

function mapBriefing(row: BriefingRow): Briefing {
  return {
    weekOf: row.week_of,
    generatedAt: row.generated_at,
    title: row.title,
    body: row.body,
    featuredAnomalies: row.featured_anomalies ?? [],
    openThreads: row.open_threads ?? [],
    dataAsOf: row.data_as_of,
    staleSeries: row.stale_series ?? [],
  }
}

// Full rows, newest-first. The history view picks from the loaded array, so no
// per-week fetch is needed for the ~12 most recent briefings.
export async function fetchRecentBriefings(limit = 12): Promise<Briefing[]> {
  const client = getSupabase()
  if (!client) return []

  const { data, error } = await client
    .from('briefings')
    .select('week_of, generated_at, title, body, featured_anomalies, open_threads, data_as_of, stale_series')
    .order('week_of', { ascending: false })
    .limit(limit)

  // Throw on a Supabase error (see fetchLatest) — a failed briefings fetch must
  // reach useBriefing's error state, not be swallowed into an empty list. No
  // rows = [].
  if (error) throw new Error(`briefings fetch failed: ${error.message}`)
  if (!data) return []
  return (data as BriefingRow[]).map(mapBriefing)
}

export { isLiveDataAvailable }
