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

  if (error || !data || data.length === 0) return null
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
  if (error || !data) return []

  return (data as { as_of: string; value: number }[])
    .map(r => ({ asOf: r.as_of, value: Number(r.value) }))
    .reverse() // PostgREST returned desc; flip to ascending for chart use
}

export { isLiveDataAvailable }
