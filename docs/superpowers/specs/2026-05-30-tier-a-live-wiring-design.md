# Tier A Live-Wiring — Design Spec

**Date:** 2026-05-30
**Status:** Approved design (pre-implementation-plan)
**Repo:** YieldScope (`~/Projects/YieldScope`); reads EconDelta data via Supabase (anon RLS, client-side PostgREST)
**Branch:** `feat-tier-a-wiring` → one PR (user choice)

---

## 1. Problem & context

A demo-segment audit (2026-05-30) found 41 YieldScope segments: 8 live, 13 partial, 20 demo. Many demos are **not blocked by missing data** — EconDelta already produces the metric, it's just not wired into the frontend. "Tier A" = those segments.

A freshness check against Supabase refined Tier A two ways:
1. **Scalar vs structured.** `metric_history` stores scalar time-series (metric_id → one number per date). Segments that show a **single value + sparkline** are wireable; segments that show **tables / breakdowns / per-entity matrices** (auction rows, donuts, per-bank/per-segment) need structured data a scalar cannot provide → they are **not** in scope (true Tier B).
2. **Flowing vs dry.** Three candidate ids returned no rows (`non_tax_revenue`, `total_revenue_budget_vs_actual`, `budget_adpex_of_the_fy_vs_utilization` — "vs"-type composites) → dropped. `banking_sector_crar` returns **1.56** (implausible for a capital-adequacy ratio; EconDelta parse bug) → **skipped**.

## 2. Goals / Non-goals

**Goals**
- Wire the confirmed-flowing **scalar** metrics into their demo segments so the values are live and the `DemoBadge` clears.
- Compute deltas/changes from the live series; **remove hardcoded captions that have no data behind them** (honesty governance).
- One PR, every wired number verified against Supabase, final review before merge.

**Non-goals (stay demo / out of scope)**
- Structured/table panels: auction tables (Today + Yields), revenue donut, NPL-by-segment, top-10-banks heatmap, deposits-by-ownership donut, CRR/SLR utilisation bars.
- CAR (`banking_sector_crar` = 1.56 parse bug) — skipped; flag to EconDelta separately (it also taints the live briefing's capital thesis).
- Inherently-static mockups: ALCO decisions, 7-week timeline, fiscal pressure composite.
- Any new EconDelta scraping (a separate project).

## 3. Confirmed-flowing metric inventory (verified 2026-05-30 via Supabase)

**Daily (`metric_history`, as_of 2026-05-30):** `gsec_auction`=4500 (scalar notional only — NOT used here), `interbank_repo_data`=1577.77, `deposits_held_with_bb_crr`=106689.3 (not used — see §7), `private_sector_credit`=1785976.0, `private_sector_credit_yoy_pct`=6.03, `deposits_of_the_system`=1995461.3, `bop_summary`=3.659, `domestic_borrowing_for_budget_deficit`=92342.65, `tax_revenue`=287862.59, `broad_money`=2281865.4.

**Monthly (`metric_history_monthly`, lagged — normal):** `m2_growth_yoy_monthly`=10.52 (2026-02-01), `reer_monthly`=102.78 (2026-03-01), `import_cover_months_monthly`=5.86 (2026-03-01), `yield_2y_monthly`=10.23 (2026-04-01), `yield_20y_monthly`=11.23 (2026-04-01).

## 4. Architecture / approach

Same proven pattern as the corridor (PR #4) and briefing display: client-side reads through the existing data layer, surfaced via per-page hooks, with `DemoBadge` null-gated per segment.

- **`src/lib/econdelta-metrics.ts`** — add the new ids to the `METRIC` map; add the five `*_monthly` ids to the `MONTHLY_METRICS` set so `fetchLatest`/`fetchSeries` route to `metric_history_monthly` (the existing `tableFor()` switch).
- **Per-page hooks** (`useDashboard`, `useLiquidity`, `useMacro`, `useFiscal`, `useBanking`, `useYields`) — add `fetchLatest`/`fetchSeries` calls for the new metrics; extend each hook's result interface with the new nullable fields; map nulls through.
- **Page components** — replace hardcoded values with the hook fields; null-gate the segment's `DemoBadge` (`value == null && <DemoBadge/>`), mirroring `Liquidity.tsx:141`.
- **`Today`** — wire `useBriefing` (already built) for the hero headline, "What's moving" (from `featuredAnomalies`), and the briefing block; this reuses the live feed verbatim.

## 5. Per-segment wiring spec

| Page | Segment | Hook field → source | Live value / derivation |
|---|---|---|---|
| Today | hero headline | `useBriefing().briefings[0].title` | live (fallback DEMO_TITLE + badge) |
| Today | "What's moving" | `useBriefing().briefings[0].featuredAnomalies` | map label+detail+severity; fallback demo+badge |
| Today | weekly briefing block | `useBriefing().briefings[0].title/body` | reuse `BriefingBody`; drop Regenerate/Edit-tone |
| Liquidity | M2 YoY | `useLiquidity().m2YoY` ← `m2_growth_yoy_monthly` | 10.52% (replaces hardcoded 8.4; **remove** the `m2YoY:null` defer at useLiquidity.ts:57) |
| Liquidity / Banking | Repo borrow from BB | `interbank_repo_data` | live value (unit normalised — see §10) |
| Banking | Pvt-credit YoY | `useBanking().pvtCreditYoY` ← `private_sector_credit_yoy_pct` | 6.03% |
| Banking | Deposits | `deposits_of_the_system` | live |
| Banking | Credit/Deposit ratio | derive `private_sector_credit ÷ deposits_of_the_system` | ≈89% (caveat: pvt-credit numerator, not total advances — see §10) |
| Macro | REER | `reer_monthly` | 102.78 (replaces caption 108.4) |
| Macro | Import cover | `import_cover_months_monthly` | 5.86 mo |
| Macro | Current account / BoP | `bop_summary` | 3.66 |
| Fiscal | Net domestic borrowing | `domestic_borrowing_for_budget_deficit` | ~92,343 cr |
| Fiscal | Revenue collected | `tax_revenue` | ~287,863 cr (target = config constant; see §10) |
| Yields | Tenor ladder 2Y, 20Y rungs | `yield_2y_monthly`, `yield_20y_monthly` | 10.23, 11.23 (15Y stays absent → that rung keeps its demo/placeholder) |
| Yields / Today | YieldCurve "latest" curve | live `useYields` tenor series | latest point per tenor; historical overlays only where a tenor has daily/weekly history (else omit that overlay) |
| all partials | deltas / changes | computed from the metric's `fetchSeries` (latest − prior) | replaces hardcoded deltas |

## 6. Honesty rules

- **Badge gating:** each wired segment renders `<DemoBadge>` only when its value is `null` (metric not yet flowing). Never show a fixture next to a "live" frame without the badge.
- **Captions:** compute where derivable (deltas, % change). **Remove** captions with no data source — explicitly: REER "overvalued ~6%", USD/BDT "+1.2% YTD" (no YTD-anchor metric), Fiscal "Expected 83%" pace marker, Yields "cleared 26 May"/"flatter by 12 bps". Do not fabricate.
- **Lagged monthly data:** the five monthly metrics are weeks old (Feb–Apr as_of). Display each with its real `asOf` date (the hooks already return `asOf`); do not imply it's today's figure. A lagged-but-labelled value is honest; a lagged value shown as current is not.

## 7. Notes on dropped candidates

- `deposits_held_with_bb_crr` (106689.3) is the **CRR deposit balance**, not a utilisation %. The demo "CRR 92%" bar needs (balance ÷ required) — required-CRR isn't available — so the CRR/SLR utilisation bars stay demo.
- `gsec_auction` (4500) is a single latest-notional scalar, not per-auction rows → auction tables stay demo.

## 8. Error handling

Mirror the existing hooks exactly: `try/await Promise.all([...]) ` → on success map values (nulls allowed); on throw set `{data:null, loading:false, error}`. A missing/dry metric returns `null` from `fetchLatest` → the segment shows its demo fallback + badge. No new error paths.

## 9. Testing

- **Per-hook vitest** (mirror `useLiquidity.test.ts`): mock `../lib/econdelta`; assert each new field maps from its metric_id; assert null when the metric returns null; loading + error paths.
- **Derivation tests:** C/D ratio = credit ÷ deposits; delta = latest − prior; guard divide-by-zero/null.
- **Monthly routing test** (`econdelta.test.ts`): `fetchLatest('m2_growth_yoy_monthly')` queries `metric_history_monthly` (the `MONTHLY_METRICS` set).
- **Render sanity:** a wired segment hides `DemoBadge` when its value is present; shows it when null. Manual visual check at 320/768/1024/1440.
- Build green (`tsc -b` + vite), eslint clean, full `vitest run`.

## 10. Plan-time verifications (assumptions to confirm, not placeholders)

1. **`interbank_repo_data` unit** — value 1577.77 vs the demo's "124.6 kCr". Confirm the unit (crore vs kCr) and normalise in the hook (like `useLiquidity`'s `CR_PER_KCR`).
2. **Revenue target source** — the Fiscal revenue/target ratio needs the budget target; confirm whether it's a config constant in the page or a (dry) metric. Keep it a constant if no live source.
3. **C/D numerator** — `private_sector_credit` excludes public-sector credit; the derived ratio is pvt-credit ÷ deposits, slightly below a true total-advances C/D. Confirm the label reflects that (e.g. "Pvt credit / deposits") or accept the approximation.
4. **Exact page field names / line anchors** — the audit's file:line anchors are the starting points; confirm each component's current prop/variable when editing.
5. **YieldCurve overlays** — confirm which tenors have enough daily/weekly history for the week/month/quarter/year overlays; omit overlays that would mix cadences misleadingly.

## 11. Files to touch

- `src/lib/econdelta-metrics.ts` — new METRIC ids + MONTHLY_METRICS additions.
- `src/hooks/{useDashboard,useLiquidity,useMacro,useFiscal,useBanking,useYields}.ts` (+ their `.test.ts`).
- `src/pages/{Dashboard,Liquidity,Macro,Fiscal,Banking,Yields}.tsx` — wire fields, gate badges, drop unbacked captions.
- (No EconDelta changes; no new deps.)
