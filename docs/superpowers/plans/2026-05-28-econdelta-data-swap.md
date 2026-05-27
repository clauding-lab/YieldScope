# YieldScope · EconDelta Data Swap — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `src/data/fixtures.ts` with a live data layer that reads Bangladesh macro/market data from the EconDelta Supabase project, while leaving the design system, layout, and chart primitives untouched.

**Architecture:** Direct PostgREST reads from a Supabase anon role (read-only RLS on `metric_history` + `metric_history_monthly`). One typed client + one hook per page domain. Pages keep their current shape — they just consume hooks instead of the `FX` constant.

**Tech Stack:** Existing — React 19, Vite 6, TypeScript, React Router 7. Add: `@supabase/supabase-js` (^2.46.1), `vitest` (test infra). No new runtime hosting — YieldScope stays on GitHub Pages.

---

## Phase 0 — Architectural decisions (confirmed)

These decisions shape every downstream task. Already locked in with the user before this plan was written; recorded here so a fresh agent has the same context.

### D-1. Access pattern: Anon RLS on `metric_history`

Adnan opens read-only access to `metric_history` and `metric_history_monthly` via a Supabase RLS policy. YieldScope's anon key reads PostgREST directly. The anon key sits in the client bundle — read-only, RLS-scoped, intentional. Same trust model as The Brief uses for published-brief content.

**Why:** Simplest, no new hosting (stays on GitHub Pages), data is public anyway (sourced from Bangladesh Bank / BBS public releases). No service-role secrets in browser.

### D-2. Gap policy

Where EconDelta has a metric → fully wired, real data. Where EconDelta is missing data → the panel keeps the current fixture content **and** gets a small `Demo data` chip label, with a follow-up task queued for either: (a) backfill the metric in EconDelta, or (b) add a supplementary source.

**Real data domains** (fully migrate):
- Inflation (CPI headline / food / non-food)
- FX (USD/BDT, reserves)
- Money market (call money rate, repo, excess liquidity, M2)
- Yields (91D / 182D / 364D / 5Y / 10Y)
- Fiscal (revenue, ADP, debt/GDP via aggregates)
- External sector (remittance, exports, imports)
- Banking system-wide (NPL ratio, CAR)
- Commodities (Brent, gold)
- Equities (DSE indices)

**Demo-data flagged** (fixture stays, `Demo data` chip shows):
- 2Y / 15Y / 20Y yield curve points (not in EconDelta)
- Auction detail breakdown — notified, bid, cover, devolvement (only `gsec_auction` aggregate in EconDelta; schema unclear)
- Peer benchmarks (India, Pakistan)
- Top 10 banks Basel-III + NPL heatmap
- NPL by segment (SOB / PCB / FCB / Specialised)
- Intraday call-money heatmap (only daily rate available)
- LNG (JKM), Wheat, Palm oil
- Quarterly public debt history breakdown

### D-3. History depth policy

Time-series charts render whatever `metric_history` returns, no padding with synthetic data. Each chart caption includes "N points since YYYY-MM-DD" when fewer than 8 points are available. Empty state for charts with fewer than 2 points.

### D-4. Refresh strategy

Pull on mount, manual refresh button (already in HeaderActions), 5-minute in-memory cache. No background polling. No SWR / TanStack Query — keep dependencies minimal.

### D-5. Loading + error states

Each hook returns `{ data, loading, error }`. Pages show skeleton chrome during initial load. On error: keep last good data (if any), show a `Stale · retry` chip in the section title, no full-page error.

---

## File structure (after swap)

```
src/
├── lib/
│   ├── supabase.ts              [NEW]  Singleton supabase-js client
│   ├── econdelta.ts             [NEW]  Typed query helpers (fetchMetric, fetchSeries, fetchLatest)
│   ├── econdelta.test.ts        [NEW]  Unit tests for query helpers
│   ├── econdelta-metrics.ts     [NEW]  All known metric_ids as a const enum + types
│   ├── econdelta-mappings.ts    [NEW]  Per-domain mapping logic (raw row → page-shape)
│   ├── econdelta-mappings.test.ts [NEW]
│   ├── hooks.ts                 [keep] (already has useMediaQuery, useIsDesktop)
│   └── routes.ts                [keep]
├── hooks/
│   ├── useMacro.ts              [NEW]  CPI + FX + BoP
│   ├── useMacro.test.ts         [NEW]
│   ├── useLiquidity.ts          [NEW]  Call money + corridor + excess liq + M2
│   ├── useLiquidity.test.ts     [NEW]
│   ├── useYields.ts             [NEW]  Yield curve, tenor ladder
│   ├── useYields.test.ts        [NEW]
│   ├── useFiscal.ts             [NEW]  Revenue, debt, ADP, borrowing
│   ├── useFiscal.test.ts        [NEW]
│   ├── useBanking.ts            [NEW]  NPL, CAR, repo borrow
│   ├── useBanking.test.ts       [NEW]
│   ├── useDashboard.ts          [NEW]  Aggregator — pulls from the other hooks
│   └── index.ts                 [NEW]  Barrel
├── data/
│   └── fixtures.ts              [DELETE in Phase 4]
└── pages/  (no file structure changes — only swap FX import for hook)
```

---

## Phase 1 — Supabase + env setup

### Task 1.0: User runs SQL migration in Supabase Dashboard

**Owner:** Adnan (manual, in Supabase SQL Editor — not a coding agent task)

- [ ] **Step 1: Open Supabase SQL editor for project `ssbliukchgibjcjohibi`**
- [ ] **Step 2: Run this SQL**

```sql
-- Enable RLS (idempotent — safe to re-run)
ALTER TABLE metric_history          ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_history_monthly  ENABLE ROW LEVEL SECURITY;

-- Anon read-only policies. The data is sourced from public BB/BBS releases,
-- so read-only public access is intentional and safe.
DROP POLICY IF EXISTS anon_read_metric_history          ON metric_history;
CREATE POLICY anon_read_metric_history
  ON metric_history
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS anon_read_metric_history_monthly  ON metric_history_monthly;
CREATE POLICY anon_read_metric_history_monthly
  ON metric_history_monthly
  FOR SELECT
  TO anon
  USING (true);
```

- [ ] **Step 3: Verify with curl from a regular shell (NOT logged in to Supabase)**

```bash
ANON_KEY='<your-anon-key>'
curl -s \
  "https://ssbliukchgibjcjohibi.supabase.co/rest/v1/metric_history?metric_id=eq.brent_crude_usd_barrel&order=as_of.desc&limit=3&select=metric_id,as_of,value" \
  -H "apikey: $ANON_KEY"
```

Expected: JSON array with 3 rows of brent prices. If you get `{"code":"42501"…}` or an empty array when rows clearly exist, RLS isn't right yet.

### Task 1.1: Add env file scaffolding

**Files:**
- Create: `.env.example`
- Create: `.env.local` (NOT committed — already in .gitignore via vite defaults)
- Modify: `.gitignore`

- [ ] **Step 1: Write `.env.example`**

```bash
# YieldScope — env vars
# Copy to .env.local for dev, set in production (GitHub Pages secrets / Vercel env, etc.)

# Supabase project hosting EconDelta data
VITE_SUPABASE_URL=https://ssbliukchgibjcjohibi.supabase.co

# Anon key — read-only RLS-scoped access to metric_history + metric_history_monthly.
# Safe to embed in client bundle.
VITE_SUPABASE_ANON_KEY=<your-anon-key-here>
```

- [ ] **Step 2: Write `.env.local`** (copy from `.env.example`, fill in real anon key)

- [ ] **Step 3: Confirm `.gitignore` has `.env.local`**

```bash
grep -q '^\.env\.local$' .gitignore || echo '.env.local' >> .gitignore
```

- [ ] **Step 4: Commit**

```bash
git add .env.example .gitignore
git commit -m "feat: add env scaffolding for Supabase anon access"
```

### Task 1.2: Install `@supabase/supabase-js`

- [ ] **Step 1: Install**

```bash
npm install @supabase/supabase-js@^2.46.1
```

Expected: 1 package added.

- [ ] **Step 2: Verify version**

```bash
npm ls @supabase/supabase-js
```

Expected: `yieldscope@3.0.0 └── @supabase/supabase-js@2.46.x`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add @supabase/supabase-js for EconDelta reads"
```

---

## Phase 2 — Test infra + EconDelta client

### Task 2.1: Install Vitest

- [ ] **Step 1: Install**

```bash
npm install --save-dev vitest@^2 @vitest/coverage-v8@^2 jsdom@^25 @testing-library/react@^16 @testing-library/jest-dom@^6
```

- [ ] **Step 2: Add test scripts to `package.json`** (edit, don't replace whole file)

Modify the `"scripts"` block to add:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/**', 'dist/**', '**/*.test.ts', '**/*.test.tsx'],
    },
  },
})
```

- [ ] **Step 4: Create `src/test-setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 5: Add `types` array to `tsconfig.app.json`**

Read `tsconfig.app.json`, find the `compilerOptions` block, add `"types": ["vitest/globals"]` if not present. Don't replace the whole file — only edit that block.

- [ ] **Step 6: Smoke test**

Create `src/lib/__smoke__.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('vitest smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

Run: `npm run test:run`
Expected: 1 passed.

- [ ] **Step 7: Delete the smoke test, commit infra**

```bash
rm src/lib/__smoke__.test.ts
git add package.json package-lock.json vitest.config.ts src/test-setup.ts tsconfig.app.json
git commit -m "feat: add vitest test infra"
```

### Task 2.2: Create `src/lib/supabase.ts` — singleton client

**Files:**
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: Write the singleton**

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[YieldScope] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing. ' +
    'Live data disabled — falling back to fixtures. Copy .env.example to .env.local.',
  )
}

let cached: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  if (!cached) {
    cached = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    })
  }
  return cached
}

export function isLiveDataAvailable(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase.ts
git commit -m "feat: add singleton Supabase client"
```

### Task 2.3: Define metric_id catalog

**Files:**
- Create: `src/lib/econdelta-metrics.ts`

- [ ] **Step 1: Write the catalog**

```ts
// EconDelta metric_id catalog. Sourced from
// econdelta/config/sources-v3.json and indicator-catalog.md (2026-05-27 inventory).
// Add new metric_ids here as they ship.

export const METRIC = {
  // Inflation
  CPI_HEADLINE:    'point_to_point_inflation',
  CPI_FOOD:        'food_inflation',
  CPI_NONFOOD:     'non_food_inflation',
  CPI_GENERAL:     'general_inflation',

  // FX
  USD_BDT:         'usd_bdt_exchange_rate',
  FX_RESERVES:     'fx_reserve_gross_and_bpm6',

  // Money market & yields
  CALL_MONEY:      'call_money_rate',
  POLICY_RATE:     'policy_rate_slf_sdf',
  TBILL_91:        'bill_bond_rates',
  TBILL_182:       'tbill_182d_yield',
  TBILL_364:       'tbill_364d_yield',
  TBOND_5Y:        'tbond_5y_yield',
  TBOND_10Y:       'tbond_10y_yield',
  GSEC_AUCTION:    'gsec_auction',
  INTERBANK_REPO:  'interbank_repo_data',
  TBILL_OUT:       'treasury_bill_outstanding',
  TBOND_OUT:       'treasury_bond_outstanding',

  // Monetary aggregates
  M2:              'broad_money',
  RESERVE_MONEY:   'reserve_money',
  EXCESS_LIQ:      'excess_liquid_asset_total_minimum',
  PRIV_CREDIT:     'private_sector_credit',
  PRIV_CREDIT_YOY: 'private_sector_credit_yoy_pct',
  TOTAL_DEPOSITS:  'deposits_of_the_system',
  NPL_RATIO:       'gross_npl_ratio',
  CRAR:            'banking_sector_crar',

  // External sector
  REMIT_MONTHLY:   'monthly_remittance',
  EXPORT_MONTHLY:  'monthly_export',
  IMPORT_MONTHLY:  'monthly_import',
  BOP:             'bop_summary',

  // Fiscal
  TAX_REV:         'tax_revenue',
  TOTAL_REV:       'total_revenue_budget_vs_actual',
  BUDGET_OPEX:     'budget_opex_of_the_fy_vs_utilization',
  BUDGET_ADPEX:    'budget_adpex_of_the_fy_vs_utilization',
  TAX_GDP:         'tax_gdp_ratio',
  REV_GDP:         'rev_gdp_ratio',
  DOMESTIC_BORROW: 'domestic_borrowing_for_budget_deficit',
  BANK_BORROW:     'bank_borrowing_for_deficit_financing',
  NSC_OUT:         'nsc_outstanding',

  // Commodities
  BRENT:           'brent_crude_usd_barrel',
  WTI:             'wti_crude_usd_barrel',
  GOLD:            'gold_usd_oz',

  // Equities
  DSEX:            'dsex',
  DSEX_CHG:        'dsex_change_pct',
  DS30:            'ds30',
  DSES:            'dses',
  DSE_TURNOVER:    'turnover_crore',

  // Monthly long-horizon (separate table)
  CPI_12M_AVG_M:   'cpi_12m_avg_monthly',
  CPI_FOOD_M:      'cpi_p2p_food_monthly',
  CPI_NONFOOD_M:   'cpi_p2p_nonfood_monthly',
} as const

export type MetricId = typeof METRIC[keyof typeof METRIC]

// Long-horizon metrics live in metric_history_monthly, not metric_history.
export const MONTHLY_METRICS: ReadonlySet<MetricId> = new Set([
  METRIC.CPI_12M_AVG_M,
  METRIC.CPI_FOOD_M,
  METRIC.CPI_NONFOOD_M,
])
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/econdelta-metrics.ts
git commit -m "feat: catalog EconDelta metric_ids"
```

### Task 2.4: Write failing tests for the EconDelta client

**Files:**
- Create: `src/lib/econdelta.test.ts`

- [ ] **Step 1: Write the test file**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Tests assume the module exposes fetchLatest + fetchSeries.
// We mock @supabase/supabase-js entirely so no network is hit.
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()

vi.mock('./supabase', () => ({
  getSupabase: () => ({ from: mockFrom }),
  isLiveDataAvailable: () => true,
}))

beforeEach(() => {
  mockFrom.mockReset()
  mockSelect.mockReset()
  mockEq.mockReset()
  mockOrder.mockReset()
  mockLimit.mockReset()

  // Default: chain returns itself, .limit resolves with empty data
  const chain = { select: mockSelect, eq: mockEq, order: mockOrder, limit: mockLimit }
  mockFrom.mockReturnValue(chain)
  mockSelect.mockReturnValue(chain)
  mockEq.mockReturnValue(chain)
  mockOrder.mockReturnValue(chain)
  mockLimit.mockResolvedValue({ data: [], error: null })
})

describe('fetchLatest', () => {
  it('queries metric_history with the right metric_id and returns the most recent value', async () => {
    mockLimit.mockResolvedValueOnce({
      data: [{ metric_id: 'brent_crude_usd_barrel', as_of: '2026-05-27', value: 83.42 }],
      error: null,
    })

    const { fetchLatest } = await import('./econdelta')
    const result = await fetchLatest('brent_crude_usd_barrel')

    expect(mockFrom).toHaveBeenCalledWith('metric_history')
    expect(mockEq).toHaveBeenCalledWith('metric_id', 'brent_crude_usd_barrel')
    expect(mockOrder).toHaveBeenCalledWith('as_of', { ascending: false })
    expect(mockLimit).toHaveBeenCalledWith(1)
    expect(result).toEqual({ asOf: '2026-05-27', value: 83.42 })
  })

  it('returns null when no rows exist', async () => {
    const { fetchLatest } = await import('./econdelta')
    const result = await fetchLatest('brent_crude_usd_barrel')
    expect(result).toBeNull()
  })

  it('routes monthly metrics to metric_history_monthly table', async () => {
    mockLimit.mockResolvedValueOnce({
      data: [{ metric_id: 'cpi_12m_avg_monthly', as_of: '2026-04-01', value: 8.6 }],
      error: null,
    })
    const { fetchLatest } = await import('./econdelta')
    await fetchLatest('cpi_12m_avg_monthly')
    expect(mockFrom).toHaveBeenCalledWith('metric_history_monthly')
  })
})

describe('fetchSeries', () => {
  it('returns rows in chronological ascending order', async () => {
    mockLimit.mockResolvedValueOnce({
      data: [
        { metric_id: 'call_money_rate', as_of: '2026-05-27', value: 9.34 },
        { metric_id: 'call_money_rate', as_of: '2026-05-26', value: 9.22 },
      ],
      error: null,
    })
    const { fetchSeries } = await import('./econdelta')
    const series = await fetchSeries('call_money_rate', { limit: 8 })

    // Verify ordering on output (PostgREST returns desc; client flips to asc for chart use)
    expect(series.map(p => p.asOf)).toEqual(['2026-05-26', '2026-05-27'])
    expect(series.map(p => p.value)).toEqual([9.22, 9.34])
  })

  it('returns empty array on PostgREST error', async () => {
    mockLimit.mockResolvedValueOnce({ data: null, error: { message: 'oops' } })
    const { fetchSeries } = await import('./econdelta')
    const result = await fetchSeries('brent_crude_usd_barrel', { limit: 8 })
    expect(result).toEqual([])
  })

  it('returns empty array when supabase client is missing', async () => {
    vi.doMock('./supabase', () => ({
      getSupabase: () => null,
      isLiveDataAvailable: () => false,
    }))
    vi.resetModules()
    const { fetchSeries } = await import('./econdelta')
    const result = await fetchSeries('brent_crude_usd_barrel', { limit: 8 })
    expect(result).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test — expect FAIL**

```bash
npm run test:run -- src/lib/econdelta.test.ts
```

Expected: FAIL — module `./econdelta` does not exist.

### Task 2.5: Implement the EconDelta client

**Files:**
- Create: `src/lib/econdelta.ts`

- [ ] **Step 1: Write the client**

```ts
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
    .order('as_of', { ascending: false })
    .limit(limit)

  if (sinceISO) {
    query = client
      .from(tableFor(metricId))
      .select('metric_id, as_of, value')
      .eq('metric_id', metricId)
      .gte('as_of', sinceISO)
      .order('as_of', { ascending: false })
      .limit(limit)
  }

  const { data, error } = await query
  if (error || !data) return []

  return (data as { as_of: string; value: number }[])
    .map(r => ({ asOf: r.as_of, value: Number(r.value) }))
    .reverse() // PostgREST returned desc; flip to ascending for chart use
}

export { isLiveDataAvailable }
```

- [ ] **Step 2: Run tests — expect PASS**

```bash
npm run test:run -- src/lib/econdelta.test.ts
```

Expected: 5 tests passed.

- [ ] **Step 3: Commit**

```bash
git add src/lib/econdelta.ts src/lib/econdelta.test.ts
git commit -m "feat: add EconDelta PostgREST client with fetchLatest + fetchSeries"
```

### Task 2.6: Manual smoke test against live Supabase

- [ ] **Step 1: Start dev server**

```bash
tmux kill-session -t dev 2>/dev/null
tmux new-session -d -s dev "npm run dev 2>&1 | tee /tmp/yieldscope-dev.log"
sleep 4
cat /tmp/yieldscope-dev.log | tail -10
```

Expected: Vite ready at http://localhost:5173/YieldScope/

- [ ] **Step 2: In browser DevTools console, run a smoke read**

```js
// Paste into the live page's console:
const { fetchLatest } = await import('/src/lib/econdelta.ts')
console.log(await fetchLatest('brent_crude_usd_barrel'))
```

Expected: `{ asOf: '2026-05-...', value: 8x.xx }` — a real recent Brent price. If `null`, RLS or env wiring is off; debug before continuing.

---

## Phase 3 — Domain hooks (one PR per phase)

For each section: write hook test → write hook → wire into page → commit.

Each hook returns the same shape pages already consume from `FX`, so page edits are minimal (one import swap + a loading state check).

### Phase 3a — `useMacro` (Macro page)

**EconDelta coverage:** CPI headline / food / non-food, USD/BDT, FX reserves, remittance, exports, imports.

**Gaps flagged Demo data:** None for this page — all real.

**Files:**
- Create: `src/hooks/useMacro.ts`
- Create: `src/hooks/useMacro.test.ts`
- Modify: `src/pages/Macro.tsx` (swap `FX.macro` for `useMacro()`)

#### Task 3a.1: Write failing test for useMacro

- [ ] **Step 1: Test file**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('../lib/econdelta', () => ({
  fetchLatest: vi.fn(),
  fetchSeries: vi.fn(),
  isLiveDataAvailable: () => true,
}))

import { fetchLatest, fetchSeries } from '../lib/econdelta'
import { useMacro } from './useMacro'

const mockFetchLatest = vi.mocked(fetchLatest)
const mockFetchSeries = vi.mocked(fetchSeries)

beforeEach(() => {
  mockFetchLatest.mockReset()
  mockFetchSeries.mockReset()
})

describe('useMacro', () => {
  it('starts in loading state', () => {
    mockFetchLatest.mockResolvedValue({ asOf: '2026-04-01', value: 9.2 })
    mockFetchSeries.mockResolvedValue([])
    const { result } = renderHook(() => useMacro())
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
  })

  it('resolves with mapped data', async () => {
    mockFetchLatest.mockImplementation(async (id) => {
      if (id === 'point_to_point_inflation') return { asOf: '2026-04-01', value: 9.20 }
      if (id === 'usd_bdt_exchange_rate')    return { asOf: '2026-05-27', value: 119.62 }
      if (id === 'fx_reserve_gross_and_bpm6') return { asOf: '2026-05-25', value: 20.84 }
      return null
    })
    mockFetchSeries.mockImplementation(async (id) => {
      if (id === 'point_to_point_inflation') {
        return [
          { asOf: '2025-09-01', value: 9.94 },
          { asOf: '2026-04-01', value: 9.20 },
        ]
      }
      return []
    })

    const { result } = renderHook(() => useMacro())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).not.toBeNull()
    expect(result.current.data!.cpiHeadline).toBe(9.20)
    expect(result.current.data!.usdBdt).toBe(119.62)
    expect(result.current.data!.fxReservesUsdBn).toBe(20.84)
    expect(result.current.data!.cpiHist[0]).toBe(9.94)
    expect(result.current.data!.cpiHist[1]).toBe(9.20)
  })

  it('captures error from the client', async () => {
    mockFetchLatest.mockRejectedValue(new Error('network'))
    mockFetchSeries.mockResolvedValue([])
    const { result } = renderHook(() => useMacro())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run — expect FAIL** (module doesn't exist yet)

```bash
npm run test:run -- src/hooks/useMacro.test.ts
```

#### Task 3a.2: Implement useMacro

- [ ] **Step 1: Hook file**

```ts
import { useEffect, useState } from 'react'
import { fetchLatest, fetchSeries } from '../lib/econdelta'
import { METRIC } from '../lib/econdelta-metrics'

export interface MacroData {
  cpiHeadline: number | null
  cpiFood: number | null
  cpiNonFood: number | null
  cpiHist: number[]
  foodHist: number[]
  nonFoodHist: number[]

  usdBdt: number | null
  fxReservesUsdBn: number | null
  fxResHist: number[]

  remitMonthlyUsdBn: number | null
  exportMonthlyUsdBn: number | null
  importMonthlyUsdBn: number | null

  asOf: string | null
}

interface UseMacroResult {
  data: MacroData | null
  loading: boolean
  error: Error | null
}

export function useMacro(): UseMacroResult {
  const [state, setState] = useState<UseMacroResult>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [
          cpiH, cpiF, cpiNF, usd, fxr,
          cpiSer, foodSer, nfSer, fxSer,
          rem, exp, imp,
        ] = await Promise.all([
          fetchLatest(METRIC.CPI_HEADLINE),
          fetchLatest(METRIC.CPI_FOOD),
          fetchLatest(METRIC.CPI_NONFOOD),
          fetchLatest(METRIC.USD_BDT),
          fetchLatest(METRIC.FX_RESERVES),
          fetchSeries(METRIC.CPI_HEADLINE,  { limit: 8 }),
          fetchSeries(METRIC.CPI_FOOD,      { limit: 8 }),
          fetchSeries(METRIC.CPI_NONFOOD,   { limit: 8 }),
          fetchSeries(METRIC.FX_RESERVES,   { limit: 8 }),
          fetchLatest(METRIC.REMIT_MONTHLY),
          fetchLatest(METRIC.EXPORT_MONTHLY),
          fetchLatest(METRIC.IMPORT_MONTHLY),
        ])

        if (cancelled) return

        const asOf = cpiH?.asOf ?? null
        setState({
          loading: false,
          error: null,
          data: {
            cpiHeadline:   cpiH?.value ?? null,
            cpiFood:       cpiF?.value ?? null,
            cpiNonFood:    cpiNF?.value ?? null,
            cpiHist:       cpiSer.map(p => p.value),
            foodHist:      foodSer.map(p => p.value),
            nonFoodHist:   nfSer.map(p => p.value),
            usdBdt:        usd?.value ?? null,
            fxReservesUsdBn: fxr?.value ?? null,
            fxResHist:     fxSer.map(p => p.value),
            remitMonthlyUsdBn:  rem?.value ?? null,
            exportMonthlyUsdBn: exp?.value ?? null,
            importMonthlyUsdBn: imp?.value ?? null,
            asOf,
          },
        })
      } catch (e) {
        if (cancelled) return
        setState({ data: null, loading: false, error: e as Error })
      }
    })()
    return () => { cancelled = true }
  }, [])

  return state
}
```

- [ ] **Step 2: Run tests — expect PASS**

```bash
npm run test:run -- src/hooks/useMacro.test.ts
```

#### Task 3a.3: Wire into Macro page

- [ ] **Step 1: Edit `src/pages/Macro.tsx`**

Find every reference to `FX.macro` and replace with `data` from the hook. Top of each layout function:

```tsx
import { useMacro } from '../hooks/useMacro'
import { FX } from '../data/fixtures'  // KEEP — used as fallback for fields EconDelta doesn't cover

function MacroMobile() {
  const { data, loading, error } = useMacro()
  const M = FX.macro  // fallback for sparkline arrays during loading

  // ... rest unchanged, but replace single-value references:
  //   "9.20"               → data?.cpiHeadline?.toFixed(2) ?? '—'
  //   "20.84"              → data?.fxReservesUsdBn?.toFixed(2) ?? '—'
  //   "119.62"             → data?.usdBdt?.toFixed(2) ?? '—'
  //   M.cpiHist            → data?.cpiHist.length ? data.cpiHist : M.cpiHist
  //   M.foodHist           → similarly
  //   etc.
  //
  // If loading and no cached data, show the placeholder; otherwise show data.
}
```

Apply the same edits to `MacroDesktop()`.

- [ ] **Step 2: Smoke test — start dev, open Macro page, observe real CPI / FX numbers**

```bash
tmux kill-session -t dev 2>/dev/null
tmux new-session -d -s dev "npm run dev 2>&1 | tee /tmp/yieldscope-dev.log"
sleep 4
```

Open http://localhost:5173/YieldScope/macro and verify CPI headline shows the latest real BB figure, not the fixture's `9.20`.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useMacro.ts src/hooks/useMacro.test.ts src/pages/Macro.tsx
git commit -m "feat(macro): swap CPI + FX + BoP to EconDelta"
```

### Phase 3b — `useLiquidity`

**EconDelta coverage:** call money rate, excess liquidity, M2.

**Gaps:** Intraday hourly heatmap → flag panel as Demo data. Reserve utilisation bars (CRR/SLR/SLF) — keep fixture, flag.

**Files:**
- Create: `src/hooks/useLiquidity.ts` + `.test.ts`
- Modify: `src/pages/Liquidity.tsx`

#### Task 3b.1: Test

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('../lib/econdelta', () => ({
  fetchLatest: vi.fn(),
  fetchSeries: vi.fn(),
  isLiveDataAvailable: () => true,
}))

import { fetchLatest, fetchSeries } from '../lib/econdelta'
import { useLiquidity } from './useLiquidity'

beforeEach(() => {
  vi.mocked(fetchLatest).mockReset()
  vi.mocked(fetchSeries).mockReset()
})

describe('useLiquidity', () => {
  it('maps call money + excess liquidity + M2 from EconDelta', async () => {
    vi.mocked(fetchLatest).mockImplementation(async (id) => {
      if (id === 'call_money_rate')                       return { asOf: '2026-05-27', value: 9.34 }
      if (id === 'excess_liquid_asset_total_minimum')     return { asOf: '2026-05-26', value: 18420000 }
      if (id === 'broad_money')                            return { asOf: '2026-04-30', value: 12500000 }
      return null
    })
    vi.mocked(fetchSeries).mockImplementation(async (id) => {
      if (id === 'call_money_rate')                   return [{ asOf: '2026-05-20', value: 8.42 }, { asOf: '2026-05-27', value: 9.34 }]
      if (id === 'excess_liquid_asset_total_minimum') return [{ asOf: '2026-03-01', value: 28400000 }, { asOf: '2026-05-26', value: 18420000 }]
      return []
    })

    const { result } = renderHook(() => useLiquidity())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data!.callMoneyRate).toBe(9.34)
    expect(result.current.data!.callSpark.length).toBe(2)
    // Excess liquidity in crore (EconDelta likely stores in BDT — confirm unit at smoke step,
    // adjust .scale if necessary)
    expect(result.current.data!.excessLiquidityKCr).toBeGreaterThan(0)
  })
})
```

#### Task 3b.2: Implement

```ts
import { useEffect, useState } from 'react'
import { fetchLatest, fetchSeries } from '../lib/econdelta'
import { METRIC } from '../lib/econdelta-metrics'

export interface LiquidityData {
  callMoneyRate: number | null
  callSpark: number[]
  excessLiquidityKCr: number | null  // in lakh crore (KCr = 100k crore)
  excessHistKCr: number[]
  m2YoY: number | null
  asOf: string | null
}

// Unit assumption: EconDelta stores excess liquidity in BDT crore.
// YieldScope displays it in lakh crore (KCr = ÷ 100,000). Convert at the seam.
const CR_PER_KCR = 100000

export function useLiquidity() {
  const [state, setState] = useState<{ data: LiquidityData | null; loading: boolean; error: Error | null }>({
    data: null, loading: true, error: null,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [call, excess, m2, callSer, excessSer] = await Promise.all([
          fetchLatest(METRIC.CALL_MONEY),
          fetchLatest(METRIC.EXCESS_LIQ),
          fetchLatest(METRIC.M2),
          fetchSeries(METRIC.CALL_MONEY, { limit: 8 }),
          fetchSeries(METRIC.EXCESS_LIQ, { limit: 8 }),
        ])
        if (cancelled) return
        setState({
          loading: false, error: null,
          data: {
            callMoneyRate: call?.value ?? null,
            callSpark: callSer.map(p => p.value),
            excessLiquidityKCr: excess ? excess.value / CR_PER_KCR : null,
            excessHistKCr: excessSer.map(p => p.value / CR_PER_KCR),
            m2YoY: null, // EconDelta has broad_money level, not YoY %. Compute or leave null.
            asOf: call?.asOf ?? null,
          },
        })
      } catch (e) {
        if (cancelled) return
        setState({ data: null, loading: false, error: e as Error })
      }
    })()
    return () => { cancelled = true }
  }, [])

  return state
}
```

#### Task 3b.3: Wire into Liquidity page

Edit `src/pages/Liquidity.tsx` — replace `FX.liquidity.callRange`, `.callAvg`, `.callSpark`, `.excessKCr`, `.excessHistKCr`, `.m2YoY` with hook data. Keep fixture for: `crrUtil`, `slrUtil`, `repo`, `sdf`, `slf` (those are static / policy values). For intraday heatmap section, add a `Demo data` chip.

Commit: `git commit -m "feat(liquidity): swap call money + excess liq to EconDelta; flag heatmap as demo"`

### Phase 3c — `useYields`

**EconDelta coverage:** 91D, 182D, 364D, 5Y, 10Y individual yields. Auction outstanding amounts.

**Gaps:** 7D, 14D, 28D, 2Y, 15Y, 20Y curve points → use fixture, flag the curve as "partial · 5 tenors live". Auction details (notified/bid/cover/devolvement) → flag table as Demo data.

Same task structure: test → implement → wire. Commit.

Hook contract:
```ts
export interface YieldsData {
  curveTenors: string[]              // ordered list of live tenors only
  curveLatest: number[]
  spread10Y_91D_bps: number | null
  asOf: string | null
}
```

### Phase 3d — `useFiscal`

**EconDelta coverage:** revenue (NBR + total), ADP utilisation, tax/revenue/GDP ratios, domestic borrowing.

**Gaps:** Quarterly public debt breakdown → flag panel; Ways&Means → check if `bank_borrowing_for_deficit_financing` is a proxy.

Hook contract:
```ts
export interface FiscalData {
  revenuePct: number | null         // total_revenue_budget_vs_actual
  adpPct: number | null             // budget_adpex_of_the_fy_vs_utilization
  taxToGdp: number | null
  domesticBorrowingCr: number | null
  asOf: string | null
}
```

### Phase 3e — `useDashboard` (aggregator)

Combines latest values from macro + liquidity + yields hooks for the 4-cornerstone-metrics row + the "What's moving" alerts (computed client-side from the same data).

Hook contract:
```ts
export interface DashboardData {
  tbill91: number | null
  tbond10: number | null
  callMoney: number | null
  cpiHeadline: number | null
  spread10Y_91D_bps: number | null
  asOf: string | null
}
```

### Phase 3f — `useBanking`

**EconDelta coverage:** `gross_npl_ratio` (system-wide), `banking_sector_crar` (system-wide).

**Gaps (all flagged Demo data):** Top 10 banks heatmap, NPL by segment, deposit donut, repo borrowing absolute.

Hook contract:
```ts
export interface BankingData {
  nplRatio: number | null
  crar: number | null              // CAR / Basel-III
  nplHist: number[]
  asOf: string | null
}
```

### Phase 3g — `useIntelligence` (best-effort)

This page is mostly AI-generated commentary. EconDelta has no narrative data. For now: defer entire page swap. Just show fixture as Demo data. Future: when the AI brief layer is rebuilt, it'll write to a separate table (out of scope for this plan).

---

## Phase 4 — Cleanup + verification

### Task 4.1: Add `Demo data` chip primitive

**Files:**
- Create: `src/components/primitives/DemoBadge.tsx`
- Modify: `src/components/primitives/index.ts`

- [ ] **Step 1: Write the badge**

```tsx
export function DemoBadge() {
  return (
    <span
      className="chip"
      style={{
        background: 'rgba(140, 146, 161, 0.10)',
        color: 'var(--ink-3)',
        fontSize: 10,
      }}
      title="This panel shows placeholder data — EconDelta source not yet available."
    >
      Demo data
    </span>
  )
}
```

- [ ] **Step 2: Add to barrel + commit**

### Task 4.2: Apply DemoBadge across deferred panels

Walk each page, attach `<DemoBadge />` next to the eyebrow on any panel that's still on fixture data. Sections covered earlier:
- Yields desktop: tenor ladder for non-EconDelta tenors; auctions table
- Liquidity: reserve utilisation bars; intraday heatmap
- Fiscal: public debt quarterly; ways & means dot matrix
- Banking: everything except hero (NPL + CAR + repo borrow)
- Intelligence: entire page
- Macro: commodity exposure (LNG, wheat, palm) — Brent + gold are real, others fixture

Commit per page.

### Task 4.3: Final smoke test

- [ ] **Step 1: Build + typecheck**

```bash
npx tsc -b
npm run lint
npm run build
```

All clean.

- [ ] **Step 2: Run unit tests**

```bash
npm run test:run
```

Expected: all green.

- [ ] **Step 3: Manual browser smoke**

Open each route, confirm:
- Real data on Macro page (CPI matches BB Apr release)
- Real data on Liquidity (call money matches BB dealer poll)
- Real data on Yields (cleared cutoffs match BB auction page)
- Demo badges visible on deferred panels
- Theme toggle still flips slate ↔ ivory
- Mobile + desktop layouts both render

### Task 4.4: Keep `fixtures.ts` as fallback OR delete

Decision point — make the call at this phase, not upfront:
- **Option A:** Delete `src/data/fixtures.ts`. Demo-data panels render literal data inline (cleaner — no live/static ambiguity).
- **Option B:** Keep `fixtures.ts`. Demo-data panels keep importing from it. Cleaner diff at this stage, removes later if/when each gap closes.

**Recommended:** Option B — keep through this PR. Delete in a follow-up PR after each gap has been addressed.

### Task 4.5: Update PR description / AGENT_LEARNINGS.md

Per the global rulebook, write an entry summarizing:
- What shipped (data swap, 5/7 pages mostly live)
- What gaps remain (tenors, auctions detail, peer benchmarks, banking heatmap)
- Lesson re: EconDelta access pattern (anon RLS approach worked, mention metric history shallowness as known limitation)

Commit.

---

## Self-review checklist (done after writing this plan)

- [x] **Spec coverage:** Every fixture domain in `src/data/fixtures.ts` is either swapped (macro, liquidity, yields hero, fiscal core, banking hero) or explicitly deferred with a Demo data flag (banking heatmap, intraday heatmap, peer benchmarks, intelligence).
- [x] **Placeholder scan:** No "TBD" or "implement later" in actionable tasks. The Phase 3c-3g sections are tighter than 3a-3b — Phase 3a-3b are the worked examples; later phases repeat the same pattern with their domain-specific schemas. If an executing agent finds 3c-3g too thin, it should adopt the structure of 3a-3b verbatim.
- [x] **Type consistency:** Hook return types use the same property names across hooks (`asOf` everywhere, `loading`/`error`/`data`). `MetricPoint` is the single low-level shape.
- [x] **Test coverage:** Every hook has a test file. The client has a test file. Vitest infra is set up in Phase 2.
- [x] **Files mapped:** `econdelta.ts`, `econdelta-metrics.ts`, `supabase.ts` defined upfront; per-hook files listed in each Phase 3 section.
- [x] **Bite-sized steps:** Each task is one action — write test, run test, write code, run code, commit.

---

## Out of scope (queued follow-ups)

These are explicitly NOT in this plan. Each becomes its own spec when prioritized:

1. **EconDelta backfill** — add 7D / 14D / 28D / 2Y / 15Y / 20Y tenors; add structured auction details; add peer benchmark scrapers for India + Pakistan.
2. **Banking sector enrichment** — per-bank Basel-III data, NPL by segment, deposit market share.
3. **Public debt quarterly** — scrape MoF Debt Bulletin or pull from a public source.
4. **Intraday call money** — needs higher-frequency scraping than EconDelta currently does.
5. **AI Intelligence page rebuild** — separate concern; ties to The Brief's content layer + Claude API integration.
6. **History deepening** — most `metric_history` series only go back to May 2026. As the table accumulates data, charts auto-extend.
