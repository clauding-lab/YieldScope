# Tier A Live-Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. Each implementer **reads the current file at the cited anchor before editing** (the codebase is the source of truth; anchors here are 2026-05-30 line numbers).

**Goal:** Turn the confirmed-flowing Tier A demo segments live across 5 pages, gating each `DemoBadge` on the live value and removing hardcoded captions with no data behind them.

**Architecture:** Extend the shared `METRIC` catalog (5 new monthly ids), extend per-page hooks to `fetchLatest`/`fetchSeries` the new metrics, render live values, null-gate `DemoBadge` per segment, compute deltas from series, drop unbacked captions. Mirror the corridor/`useLiquidity` pattern. One branch (`feat-tier-a-wiring`) → one PR; every wired number verified against Supabase; final review before merge.

**Tech Stack:** React 19 + TS + Vite, `@supabase/supabase-js`, vitest. Verify: `npm run test:run`, `npm run build`, `npx eslint`.

**Spec:** `docs/superpowers/specs/2026-05-30-tier-a-live-wiring-design.md`.

**Scope corrections discovered during mapping (do NOT chase these):**
- **YieldCurve chart** — out of scope. `YieldCurve.tsx` takes no data prop, reads `FX.curve` (11 tenors incl. 7D/14D/28D/15Y + historical snapshots that have no live source). Wiring it is a component refactor — separate effort. Keep its `DemoBadge`.
- **Fiscal revenue / target** — stays demo. It's wired to `total_revenue_budget_vs_actual`, which is **dry** in Supabase, so `revenuePct` is null at runtime (the progress bar already null-gates correctly). `tax_revenue` flows but is an absolute, not a %-of-target — repurposing the UI is out of scope. Only **Net dom. borrow** wires on Fiscal.
- **Liquidity mobile CRR/SLR** — stay demo; the mobile card's single shared badge therefore remains (covers the still-demo rows) even after M2/Repo values go live.
- **CAR** (`banking_sector_crar`=1.56) — skipped (parse bug). Leave as-is.
- Flow sparklines (M2, C/D, repo, BoP flows) currently read FX fixtures; wiring the headline **values** is in scope, wiring every sparkline series is optional/secondary (note per task).

---

## File structure

| File | Change |
|---|---|
| `src/lib/econdelta-metrics.ts` | +5 monthly METRIC ids; add them to `MONTHLY_METRICS` |
| `src/hooks/useLiquidity.ts` (+`.test.ts`) | +`m2YoY` (real), +`repoBorrowKCr` |
| `src/hooks/useBanking.ts` (+`.test.ts`) | +`pvtCreditYoY`, `repoBorrowKCr`, `cdRatio` (derived) |
| `src/hooks/useMacro.ts` (+`.test.ts`) | +`reer`, `importCoverMonths`, `currentAcctBop` |
| `src/hooks/useYields.ts` (+`.test.ts`) | extend `TenorKey` (2Y, 20Y); fetch the two metrics |
| `src/pages/Dashboard.tsx` | wire `useBriefing` (hero, what's-moving, briefing block) |
| `src/pages/Liquidity.tsx` | M2 YoY value, repo value; drop captions |
| `src/pages/Banking.tsx` | pvt-credit YoY, repo, C/D; gate badges; drop sub |
| `src/pages/Macro.tsx` | REER, import-cover caption, current-acct; gate badges; drop captions; derive USD/BDT delta |
| `src/pages/Fiscal.tsx` | Net dom. borrow value; drop "Expected 83%" markers |
| `src/pages/Yields.tsx` | 2Y/20Y rungs auto-wire; drop hero deltas/captions, compute from series |

---

## Task 0: Metric catalog — 5 monthly ids

**Files:** Modify `src/lib/econdelta-metrics.ts`

- [ ] **Step 1: Add the ids + routing**

In the `METRIC` object, after the "Monthly long-horizon" block (the 3 CPI `*_monthly` entries):
```ts
  // Tier A monthly metrics (metric_history_monthly)
  M2_YOY_M:       'm2_growth_yoy_monthly',
  REER_M:         'reer_monthly',
  IMPORT_COVER_M: 'import_cover_months_monthly',
  YIELD_2Y_M:     'yield_2y_monthly',
  YIELD_20Y_M:    'yield_20y_monthly',
```
Extend `MONTHLY_METRICS` (so `tableFor()` routes them to `metric_history_monthly`):
```ts
export const MONTHLY_METRICS: ReadonlySet<MetricId> = new Set([
  METRIC.CPI_12M_AVG_M, METRIC.CPI_FOOD_M, METRIC.CPI_NONFOOD_M,
  METRIC.M2_YOY_M, METRIC.REER_M, METRIC.IMPORT_COVER_M, METRIC.YIELD_2Y_M, METRIC.YIELD_20Y_M,
])
```

- [ ] **Step 2: Typecheck** — `npx tsc -b` clean. **Commit:** `feat(tier-a): add 5 monthly metric ids + monthly routing`

---

## Task 1: Today — wire `useBriefing` (Dashboard.tsx)

The live briefing feed already exists (`useBriefing`). Reuse it for hero, "What's moving", and the briefing block. No new metric.

**Files:** Modify `src/pages/Dashboard.tsx`

- [ ] **Step 1: Add a severity mapper + import** (top of Dashboard.tsx, near `sevColor`)
```ts
import { useBriefing } from '../hooks/useBriefing'
// BriefingAnomaly.severity ('up'|'down'|'warn') -> MovingItem.sev ('warn'|'neg'|'pos')
function sevFromAnomaly(s: 'up' | 'down' | 'warn'): 'warn' | 'neg' | 'pos' {
  return s === 'up' ? 'neg' : s === 'down' ? 'pos' : 'warn'
}
```

- [ ] **Step 2: In each component (`DashboardMobile`, `DashboardDesktop`)** add `const { briefings } = useBriefing()`, derive `const brief = briefings[0] ?? null`, and build a local moving list:
```ts
const moving: MovingItem[] = brief
  ? brief.featuredAnomalies.map(a => ({ tag: a.label, text: a.why || a.detail, sev: sevFromAnomaly(a.severity) }))
  : MOVING  // demo fallback (keep the module const as fallback)
```
- Hero: render `brief ? brief.title : HERO_LINE`. (HERO_LINE/MOVING stay as module-level **fallback** consts.)
- Gate the hero `DemoBadge` (mobile :51-53, desktop :182-184) and the "What's moving" header badge (mobile :110-113, desktop :245-248) on `brief == null` (i.e. `{brief == null && <DemoBadge/>}`).
- Replace `MOVING.slice(0,3)`/`MOVING` renders with `moving.slice(0,3)`/`moving`. Desktop drops `a.when` (no source) — render without the time column when `brief != null`.
- Briefing block (mobile Collapse :146-161, desktop :296-301): `title`/`<h3>` ← `brief.title` (fallback "The short end is rotating, not relaxing"); prose ← `brief.body` (fallback `FX.intel.weekly`); gate the inline `DemoBadge` on `brief == null`. (Buttons + Collapse `summary` are static — leave.)

- [ ] **Step 3:** `npm run build` clean; manual: with the live briefing present, hero/what's-moving/briefing show live + no badge. **Commit:** `feat(tier-a): wire Today to live briefing (hero, what's-moving, briefing block)`

*(No hook test — useBriefing is already tested; this is page wiring. A render check is sufficient.)*

---

## Task 2: Liquidity — M2 YoY + Repo borrow

**Files:** `src/hooks/useLiquidity.ts` (+`.test.ts`), `src/pages/Liquidity.tsx`

- [ ] **Step 1 (test first):** in `useLiquidity.test.ts`, add to the existing `fetchLatest` mock: `if (id === 'm2_growth_yoy_monthly') return { asOf:'2026-02-01', value:10.52 }`, `if (id === 'interbank_repo_data') return { asOf:'2026-05-30', value:1577.77 }`. Assert `result.current.data!.m2YoY === 10.52` and `result.current.data!.repoBorrowKCr` is non-null. Run → FAIL.

- [ ] **Step 2:** extend `LiquidityData`: add `repoBorrowKCr: number | null` (keep `m2YoY`). In the `Promise.all`, add `fetchLatest(METRIC.M2_YOY_M)` and `fetchLatest(METRIC.INTERBANK_REPO)`; map `m2YoY: m2?.value ?? null` (remove the hardcoded `m2YoY: null` + its defer comment at :47/:57), `repoBorrowKCr: repo ? repo.value / CR_PER_KCR : null` **(see plan-time #1 on units)**.

- [ ] **Step 3:** run test → PASS.

- [ ] **Step 4 (page):** Liquidity.tsx — mobile list (:168-179): `Money supply · M2 YoY` value ← `data?.m2YoY != null ? `${data.m2YoY.toFixed(1)}%` : '8.4%'`, **drop** the `sub="vs target 10.5"`; `Repo from BB` value ← live `repoBorrowKCr`, **drop** `sub="↑ 42% in 8 weeks"`. The card's shared `DemoBadge` (:171) **stays** (CRR/SLR rows remain demo — note in PR). Desktop M2 block (:258-271): headline `8.4` ← `data?.m2YoY?.toFixed(1) ?? '—'`; drop `vs target 10.5` caption; gate the desktop M2 `DemoBadge` (:261) on `data?.m2YoY == null`; the `L.m2Hist` sparkline may stay fixture (note) or be wired via a new `fetchSeries(METRIC.M2_YOY_M)` field if cheap.

- [ ] **Step 5:** build + `npm run test:run`. **Commit:** `feat(tier-a): wire Liquidity M2 YoY + repo borrow live`

---

## Task 3: Banking — pvt-credit YoY, repo, C/D ratio

All 4 metric ids exist in `METRIC`. Add fields to `BankingData` + thread through both subcomponents (they take `liveData: BankingData | null`).

**Files:** `src/hooks/useBanking.ts` (+`.test.ts`), `src/pages/Banking.tsx`

- [ ] **Step 1 (test first):** in `useBanking.test.ts` mock `private_sector_credit_yoy_pct`→6.03, `interbank_repo_data`→1577.77, `private_sector_credit`→1785976, `deposits_of_the_system`→1995461.3. Assert `pvtCreditYoY===6.03`, `repoBorrowKCr` non-null, and `cdRatio` ≈ `1785976/1995461.3*100` (≈89.5, toBeCloseTo). Run → FAIL.

- [ ] **Step 2:** extend `BankingData`: `pvtCreditYoY: number|null; repoBorrowKCr: number|null; cdRatio: number|null`. Add to `Promise.all`: `fetchLatest(METRIC.PRIV_CREDIT_YOY)`, `fetchLatest(METRIC.INTERBANK_REPO)`, `fetchLatest(METRIC.PRIV_CREDIT)`, `fetchLatest(METRIC.TOTAL_DEPOSITS)`. Map:
```ts
pvtCreditYoY: pcy?.value ?? null,
repoBorrowKCr: repo ? repo.value / 100000 : null,  // crore -> k Cr (confirm unit, plan-time #1)
cdRatio: (pc?.value != null && dep?.value) ? (pc.value / dep.value) * 100 : null,
```

- [ ] **Step 3:** run test → PASS.

- [ ] **Step 4 (page):** add the 3 fields to both subcomponents' destructure. Mobile: pvt-credit YoY (:107-111) value ← `pvtCreditYoY`, **drop** `sub="vs deposits 7.4%"`, gate inline badge on `pvtCreditYoY==null`; repo (:112-116) value ← `repoBorrowKCr`, gate badge. C/D mobile (:90-102) headline `81.4` ← `cdRatio?.toFixed(1) ?? '—'`, gate badge on `cdRatio==null` (sparkline `B.cdHist` may stay fixture). Desktop: repo (:205-217) headline `124.6` ← `repoBorrowKCr`, gate badge; C/D (:180-192) headline ← `cdRatio`, gate badge. **Do NOT touch CAR or NPL.**

- [ ] **Step 5:** build + tests. **Commit:** `feat(tier-a): wire Banking pvt-credit YoY, repo borrow, C/D ratio`

---

## Task 4: Macro — REER, import cover, current account

**Files:** `src/hooks/useMacro.ts` (+`.test.ts`), `src/pages/Macro.tsx`

- [ ] **Step 1 (test first):** mock `reer_monthly`→102.78, `import_cover_months_monthly`→5.86, `bop_summary`→3.659. Assert `reer===102.78`, `importCoverMonths===5.86`, `currentAcctBop===3.659`. Run → FAIL.

- [ ] **Step 2:** extend `MacroData`: `reer: number|null; importCoverMonths: number|null; currentAcctBop: number|null`. Add to `Promise.all`: `fetchLatest(METRIC.REER_M)`, `fetchLatest(METRIC.IMPORT_COVER_M)`, `fetchLatest(METRIC.BOP)`; map each `?.value ?? null`.

- [ ] **Step 3:** run test → PASS.

- [ ] **Step 4 (page):**
  - USD/BDT REER caption (:319-322): replace hardcoded `REER 108.4` with `data?.reer != null ? `REER ${data.reer.toFixed(1)}` : null`; **drop** `+1.2% YTD` and `· overvalued ~6%`.
  - USD/BDT Delta (:317): replace `<Delta value={0.04}/>` with a delta computed from `data.usdBdtHist` (`last − prev`), or drop if `usdBdtHist.length < 2`.
  - USD/BDT block badge (:313): gate on `data?.usdBdt == null` (it's live — badge should be conditional).
  - Import cover: **add** a sub-caption under the FX-reserves value, desktop (:207-218) and mobile (:125-140): `{data?.importCoverMonths != null && <span className="caption">{data.importCoverMonths.toFixed(1)} mo import cover</span>}`.
  - Current acct: in `buildBopItems` (:52-59), replace the hardcoded `'Current acct'` `v: '−2.8'` with `fmtUsdBn(data?.currentAcctBop)` and drop its hardcoded `d`/spark (or keep spark as fixture). Gate the BoP block badges (mobile :145, desktop :226) on null (e.g. all four flow values present).

- [ ] **Step 5:** build + tests. **Commit:** `feat(tier-a): wire Macro REER, import cover, current account; drop unbacked captions`

---

## Task 5: Fiscal — Net domestic borrowing + drop "Expected 83%"

`useFiscal` already exposes `domesticBorrowingCr` (from `DOMESTIC_BORROW`, which flows) — just unused. No hook change.

**Files:** `src/pages/Fiscal.tsx`

- [ ] **Step 1:** Net dom. borrow row (:59) — value ← `data?.domesticBorrowingCr != null ? `${(data.domesticBorrowingCr/1000).toFixed(1)} k Cr` : `${F.netDomesticBorrowingYTD} k Cr`` **(confirm unit, plan-time #1)**; gate the inline badge (in `demoLabel`) on `domesticBorrowingCr == null` rather than always-on.
- [ ] **Step 2:** Drop the "Expected 83%" pace marker: the `left: '83%'` vertical-line `<div>` and the `<span className="caption">Expected 83%</span>` (mobile :65-98); and the desktop `· expected pace 83%` literal (:180-182). Leave the live `revenuePct` progress fill + its correct null-gate as-is.
- [ ] **Step 3:** build + `npm run test:run`. **Commit:** `feat(tier-a): wire Fiscal net domestic borrowing; drop unsourced 83% pace marker`

---

## Task 6: Yields — 2Y + 20Y rungs + compute hero deltas

**Files:** `src/hooks/useYields.ts` (+`.test.ts`), `src/pages/Yields.tsx`

- [ ] **Step 1 (test first):** in `useYields.test.ts` mock `yield_2y_monthly`→10.23, `yield_20y_monthly`→11.23. Assert `data!.yields['2Y']===10.23` and `data!.yields['20Y']===11.23`. Run → FAIL.

- [ ] **Step 2:** extend `TenorKey` to `'91D'|'182D'|'364D'|'2Y'|'5Y'|'10Y'|'20Y'` (NOT 15Y). Add `fetchLatest(METRIC.YIELD_2Y_M)`, `fetchLatest(METRIC.YIELD_20Y_M)` (+ `fetchSeries` for each, limit 11) to the `Promise.all`; add `'2Y'`/`'20Y'` to the `yields` and `series` records.

- [ ] **Step 3:** run test → PASS. The ladder override loop (Yields.tsx:34-37) auto-picks up the live 2Y/20Y rungs.

- [ ] **Step 4 (page):**
  - Tenor-ladder `DemoBadge` (:82-83) — re-gate: now only 15Y is placeholder, so gate on whether the 15Y rung is the only non-live one (or keep the badge but note 15Y is the sole demo rung). Simplest honest move: keep the badge with a tooltip/caption that 15Y is interpolated, OR gate on `data?.yields['2Y'] == null` (badge shows only if the live rungs aren't loaded).
  - Hero deltas: **drop** hardcoded `<Delta value={-0.08}/>`/`<Delta value={-0.02}/>` (desktop :291,:302) and captions "cleared 26 May", "fairly priced vs CPI path", "Flatter by 12 bps…" (desktop :282,:292,:303; mobile :59). Compute deltas from `data.series['91D']`/`['10Y']` (ascending → `s[n-1]-s[n-2]`); render the computed delta, omit captions that can't be derived.

- [ ] **Step 5:** build + tests. **Commit:** `feat(tier-a): wire Yields 2Y/20Y rungs; compute hero deltas from series`

---

## Task 7: Final verification + PR

- [ ] **Step 1:** `npm run test:run` (all green), `npm run build` (tsc + vite clean), `npx eslint .` clean.
- [ ] **Step 2:** Verify every wired number against Supabase (the values in this plan came from a 2026-05-30 query; re-confirm if a metric refreshed).
- [ ] **Step 3:** Final code review over the whole branch (badge-gating correct everywhere; no hardcoded caption left next to a live value; lagged monthly metrics labelled with `asOf` where shown).
- [ ] **Step 4:** PR `feat-tier-a-wiring` → main; squash; merge → Pages auto-deploys.

---

## Plan-time verifications (confirm, not placeholders)

1. **Unit normalisation** — `interbank_repo_data`=1577.77 and `domestic_borrowing_for_budget_deficit`=92342.65 are in **crore**; the UI shows "k Cr" (thousand crore). Confirm the divisor (÷1000 for k Cr, or ÷100000 if the fixtures' "124.6 k Cr" implies a different base). Check one value end-to-end before trusting the format.
2. **C/D numerator** — `private_sector_credit` excludes public credit; the derived ratio (≈89%) is pvt-credit ÷ deposits, not total-advances C/D. Either relabel "Pvt credit / deposits" or accept the approximation (the fixture said 81.4%).
3. **Lagged monthly metrics** — M2 YoY (Feb), REER/import-cover (Mar), 2Y/20Y (Apr). Surface each with its `asOf` where the UI has room; never imply it's today's figure.
4. **Anchors** — line numbers are 2026-05-30; each implementer reads the current file at the anchor before editing.

## Self-review

**Spec coverage:** every in-scope spec §5 row maps to a task (Today→T1, Liquidity→T2, Banking→T3, Macro→T4, Fiscal→T5, Yields→T6, metrics→T0); the spec's YieldCurve + Fiscal-revenue items are explicitly descoped here with reasons (header). **Placeholders:** none — net-new code is concrete; JSX edits are anchored with before/after intent for subagent execution; the 4 plan-time items are confirm-steps with specific values. **Type consistency:** new hook fields (`m2YoY`, `repoBorrowKCr`, `pvtCreditYoY`, `cdRatio`, `reer`, `importCoverMonths`, `currentAcctBop`, `TenorKey` 2Y/20Y) and METRIC ids (`M2_YOY_M`, `REER_M`, `IMPORT_COVER_M`, `YIELD_2Y_M`, `YIELD_20Y_M`) are used consistently across tasks.
