# Weekly ALCO Briefing — Display (YieldScope) Implementation Plan — "Plan B"

> Executes the display half of `docs/superpowers/specs/2026-05-30-weekly-alco-briefing-design.md` (§4, §9). Plan A (EconDelta generation) shipped as clauding-lab/econdelta#39. This plan wires YieldScope's "Briefings" page (`/intelligence`) to the live `briefings` Supabase table.

**Goal:** Replace the fixture-only Briefings mockup with live data: the weekly read + real curated anomalies from the `briefings` table, a prior-weeks history view, `DemoBadge` that hides once a real briefing exists, and an honest stale-data banner. Remove the non-functional Regenerate / Edit-tone / Share controls.

**Architecture:** Mirror the existing data layer exactly — add `briefings` fetchers to `src/lib/econdelta.ts` (using the `@supabase/supabase-js` client via `getSupabase()`), a `useBriefing()` hook modeled on `useLiquidity.ts`, and rewire `src/pages/Intelligence.tsx` (desktop + mobile). When no live briefing exists (or no credentials), fall back to the honest demo state with `DemoBadge` — same null-gating pattern as `Liquidity.tsx:141`.

**Tech:** React 19 + TS + Vite, `@supabase/supabase-js`, vitest + @testing-library/react. Verify: `npm run build` (tsc -b + vite) and `npm run test:run`.

**Branch:** `feat-briefings-display` (already has the spec + Plan A doc committed).

---

## File structure

| File | New/Edit | Responsibility |
|---|---|---|
| `src/lib/econdelta.ts` | Edit | Add `Briefing`/`BriefingAnomaly`/`BriefingThread` types + `fetchRecentBriefings()` |
| `src/lib/econdelta.test.ts` | Edit | Test the new briefing fetch (mapping + empty/no-client) |
| `src/hooks/useBriefing.ts` | New | Hook: `{ briefings, loading, error }` (newest-first) |
| `src/hooks/useBriefing.test.ts` | New | Loading / maps rows / empty / error |
| `src/pages/Intelligence.tsx` | Edit | Live wiring, remove regenerate/tone/share, history view, badge gating, stale banner |

---

## Task 1: `briefings` fetchers in `src/lib/econdelta.ts`

Append types + one fetch function (full rows, newest-first; the history view picks from the loaded array — no per-click fetch needed for ~12 rows).

```ts
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

export async function fetchRecentBriefings(limit = 12): Promise<Briefing[]> {
  const client = getSupabase()
  if (!client) return []
  const { data, error } = await client
    .from('briefings')
    .select('week_of, generated_at, title, body, featured_anomalies, open_threads, data_as_of, stale_series')
    .order('week_of', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return (data as BriefingRow[]).map(mapBriefing)
}
```

Test (append to `src/lib/econdelta.test.ts`, matching its existing `getSupabase` mock style): returns `[]` when client is null; maps `week_of→weekOf` etc. and defaults null jsonb to `[]`.

## Task 2: `useBriefing` hook

`src/hooks/useBriefing.ts` — mirror `useLiquidity.ts`:

```ts
import { useEffect, useState } from 'react'
import { fetchRecentBriefings, type Briefing } from '../lib/econdelta'

interface UseBriefingResult {
  briefings: Briefing[]
  loading: boolean
  error: Error | null
}

export function useBriefing(): UseBriefingResult {
  const [state, setState] = useState<UseBriefingResult>({ briefings: [], loading: true, error: null })
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const briefings = await fetchRecentBriefings(12)
        if (cancelled) return
        setState({ briefings, loading: false, error: null })
      } catch (e) {
        if (cancelled) return
        setState({ briefings: [], loading: false, error: e as Error })
      }
    })()
    return () => { cancelled = true }
  }, [])
  return state
}
```

Test `src/hooks/useBriefing.test.ts` — mock `../lib/econdelta`, mirror `useLiquidity.test.ts`: starts loading; maps a returned briefing; empty array when none; captures error.

## Task 3: Rewire `src/pages/Intelligence.tsx`

Both `IntelDesktop` and `IntelMobile`:
- `const { briefings } = useBriefing()`; `const latest = briefings[0] ?? null`.
- **Headline/body:** `latest ? latest.title : "The short end is rotating, not relaxing."` and `latest ? latest.body : FX.intel.weekly`.
- **Anomalies sidebar:** `latest ? latest.featuredAnomalies.map(...) : <demo from FX.intel.anomalies>`. Map `severity` ('up'|'down'|'warn') through the existing `SEV_DOT_COLOR`; show `a.label` + `a.detail`; age from `latest.generatedAt`.
- **DemoBadge:** render only when `latest == null` (mirror `Liquidity.tsx:141`). Remove the unconditional `<DemoBadge />`.
- **Stale banner:** when `latest && latest.staleSeries.length > 0`, render a small chip/line: `Data as of {latest.dataAsOf} · {n} series stale`.
- **Remove:** the `Regenerate`, `Edit tone`, and `Share` buttons (spec: no regenerate/tone). Keep a single **Read history** control that toggles a history panel.
- **History view:** a panel listing `briefings.slice(1)` (or all) as `{weekOf · title}` rows; clicking sets a `selectedWeek` state; the headline/body render the selected briefing instead of latest. Implement with `useState<string | null>(selectedWeek)`; `const shown = briefings.find(b => b.weekOf === selectedWeek) ?? latest`.
- **Header "Updated …":** the `DesktopHeader`/`HeaderActions` "Updated 06:00 BST" stays as-is (out of scope) OR pass `latest.generatedAt`; leave as-is for v1.
- Keep the `What happened` timeline + `ALCO decision log` sections exactly as-is (still demo — out of scope per spec non-goals).

Add a light render test or rely on the hook test + a manual visual check at 320/768/1024/1440 (web testing rules). Given the page is highly visual, a full render test is low-signal; a smoke `renderHook`-style test on `useBriefing` + manual check is sufficient for v1.

---

## Verification

- `npm run test:run` — new + existing vitest green.
- `npm run build` — `tsc -b` typecheck clean + vite build succeeds.
- Manual: with no live row (current state — table empty until Plan A deploys), the page shows the demo fallback + `DemoBadge`. Once a real row exists, badge hides and live content shows. (Can't fully verify live until Plan A deploys to Supabase.)

## Self-review checklist
- Types match Plan A's stored row (`featured_anomalies` objects have `label/stat/value/detail/severity/metric_id/why`; threads have `id/thread/status/since_week/note`). ✔ (matches `briefing/__main__.py` assembled row + `0008_briefings.sql`).
- `DemoBadge` gating is `latest == null`, consistent with the honesty governance.
- No regenerate/tone/share controls remain.
