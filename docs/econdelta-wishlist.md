# EconDelta scraper wishlist (from YieldScope)

Created 2026-05-28 after the YieldScope honesty pass surfaced every panel that still shows placeholder ("Demo") data. This document is the work queue to shrink the placeholder set by extending EconDelta + then wiring the new metrics into YieldScope.

**Last refreshed: 2026-07-09** — the **auction tables shipped** (PR #14: `auction_results` + `auction_calendar` via `useAuctions`, consumed on Dashboard + Yields) and **CRR/SLR maintained ratios are live** (`crr_utilisation_pct` / `slr_utilisation_pct`, daily). Both were still marked "scraper needed" below — now reclassified. Prior refresh (2026-05-31) covered the corridor wire (PR #4), the "Tier A" flowing-scalar wire (PR #10/#11), and the weekly-briefing pipeline (econdelta PR #39). The YieldScope-side wiring is now essentially **complete for every metric EconDelta currently provides**. Almost everything still showing a `Demo data` pill is a **structured panel** (table / donut / heatmap / per-bank or per-segment breakdown) whose data EconDelta does not scrape yet — so the remaining work is mostly **EconDelta-side** (new scrapers), not YieldScope-side. A handful (per-bank matrix, intraday call money, ALCO log) have **no public BD source** and likely stay Demo permanently.

> **CRR/SLR are ratio VALUES, not 0–100 bars (landmine 26).** `crr_utilisation_pct` ≈ 5% and `slr_utilisation_pct` ≈ 19% are the *maintained* reserve ratios (% of deposits), NOT a 0–100 "utilisation of cap". They render as levels ("CRR maintained 5.12% · of deposits") on the Liquidity page — a 0–100 utilisation bar would be wrong. Do not "wire a CRR/SLR bar".

**▶ Execution blueprint:** [`docs/superpowers/plans/2026-05-31-tier2-closeout.md`](superpowers/plans/2026-05-31-tier2-closeout.md) — a 17-step, two-repo construction plan to close Tier 2 (drafted + adversarially reviewed 2026-05-31; 14 items built, 3 reclassified to Tier 3 / accept-Demo). Start there for the actual build.

Audience: future-Claude (or anyone) working in `~/Projects/clauding-lab/econdelta` or back in YieldScope. The Brief consumes the same data pipeline so most of these are also wins for The Brief.

Sorted by effort tier. Within each tier, prioritised by visibility on the YieldScope screen.

> **Terminology note.** "Tier A" (used in recent YieldScope sessions and `docs/superpowers/plans/2026-05-30-tier-a-live-wiring.md`) = the subset of panels backed by a **single flowing scalar** (value + optional sparkline), which became wireable as EconDelta grew. It is NOT the same as this doc's "Tier 1". Tier A cherry-picked the scalar metrics out of both Tier 1 and Tier 2 below; the *structured* panels are what remain.

---

## Coverage at a glance (2026-05-31)

**Live now (~25 metrics across the hooks):** 91d/10y/2y/20y yields + 5-tenor history + slope + 5y–2y spread · call money · M2 YoY · policy corridor (SDF/Repo/SLF) · **CRR + SLR maintained ratios** · CPI headline + food + non-food (heatmap 3/4 rows) · FX reserves + import cover · REER · USD/BDT (level + history) · Brent (level + history) · NPL industry (+ plausibility/vintage gate) · CAR (gated) · C/D (pvt-credit÷deposits) · pvt-sector-credit YoY · net domestic borrowing · **auction results + forward calendar** (`useAuctions`) · the weekly briefing + "what's moving" anomalies.

**Still Demo (~17 structured panels):** intraday call-money heatmap · BoP monthly flows + current account · CPI heatmap core row · LNG/Wheat/Palm-oil · fiscal pressure gauge + revenue donut + Debt/GDP chart + W&M + debt breakdown · top-10 bank matrix + NPL-by-segment + deposits donut + LCR/NSFR + repo-from-BB · ALCO decisions log. (SLF-draw / BB-repo bars remain Demo — BB CAPTCHA wall, EconDelta PR #62 retired.)

---

## Tier 1 — Already in EconDelta, just need YieldScope to call it  ✅ COMPLETE

Pure YieldScope-side work — no EconDelta change needed. All five now wired.

| Status | YieldScope panel | EconDelta metric_id | Notes |
|---|---|---|---|
| ✅ shipped 2026-05-28 | Macro · USD/BDT historical chart | `usd_bdt_exchange_rate` | `useMacro.usdBdtHist` via `fetchSeries(METRIC.USD_BDT, { limit: 8 })`. |
| ✅ shipped 2026-05-28 | Macro · Brent oil in commodities mini-list | `brent_crude_usd_barrel` | `useMacro.brentUsdBarrel` + `brentHist`. Delta rounded via `roundTo` (PR #11). |
| ✅ shipped 2026-05-28 (partial) | Macro · CPI heatmap (8-month, 4-series) | `point_to_point_inflation` + `food_inflation` + `non_food_inflation` (+ TODO core) | 3 of 4 rows live (Food, Non-food, Headline). **Core row stays fixture** pending EconDelta core-CPI scraper (Tier 2). Panel keeps a `Demo data` pill for the core row. |
| ✅ shipped 2026-05-28 | Yields · History tab (tenor series) | `bill_bond_rates` + `tbill_182d/364d` + `tbond_5y/10y` | `useYields.series` via `fetchSeries` at limit 11. |
| ✅ shipped 2026-05-31 (Tier A) | Yields · 5y–2y spread tile | `yield_2y_monthly` | **Previously blocked on a 2Y tenor.** EconDelta now exposes a monthly 2Y; 5y–2y computed live. (91d–SDF tile stays Demo — see Tier 2 corridor.) |

---

## Tier 2 — Add to EconDelta (public BB/BBS/NBR source exists)

These need a new scraper (or already got one). The source is published on a public Bangladesh government website. ✅ = now live in YieldScope; ⏳ = still Demo, scraper still needed.

### Money market & liquidity

- ✅ **Policy corridor (3 metrics)** — shipped via PR #4. EconDelta now provides separate `policy_rate_repo` / `policy_rate_sdf` / `policy_rate_slf`; YieldScope's CorridorViz renders them **live (SDF 7.50 / Repo 10.00 / SLF 11.50)**. (The old single ambiguous `policy_rate_slf_sdf` ticker and the hardcoded 6.50/9.00/10.50 are gone.)
- ✅ **M2 broad money supply (YoY)** — shipped via Tier A (PR #10). `useLiquidity.m2YoY` renders live ("10.5% · Feb '26") with a vintage label. (Level not separately surfaced; YoY is what the panel needs.)
- ✅ **CRR / SLR maintained ratios** — shipped (Tier-2 wire, PRs #13–16). `crr_utilisation_pct` ≈ 5% / `slr_utilisation_pct` ≈ 19%, daily, rendered as maintained-ratio LEVELS on the Liquidity page (mobile ListRows + desktop "Reserve ratios · maintained"). NOT 0–100 utilisation bars (landmine 26). SLF-draw / BB-repo bars remain Demo (BB CAPTCHA wall).
- ⏳ **SLF draw vs limit, BB repo borrowing total** — BB liquidity operations report. Daily/weekly. Used by the reserve-util bars + the "Repo borrow · from BB" tile (still hardcoded 124.6 k Cr). NOTE: `interbank_repo_data` exists in EconDelta but is **bank-to-bank interbank repo, NOT central-bank repo** — do not wire it here (AGENTS.md landmine 19).
- ⏳ **Call money intraday hourly rates** — *likely NOT public* (DFIM internal; public release is daily summary only). Powers the Liquidity intraday heatmap. De-prioritise / may stay Demo (also listed under Tier 3).

### Fiscal & sovereign

- ⏳ **Debt / GDP ratio + history** — MoF quarterly debt management report. Fiscal hero + chart.
- ✅ **Net domestic borrowing** — shipped via Tier A (PR #10). `useFiscal.domesticBorrowingCr` → "92.3 k Cr" (narrow layout). (A "vs target" comparison would still need the target figure.)
- ⏳ **Ways & Means usage vs limit** — BB monetary financing weekly bulletin. Fiscal page.
- ⏳ **NBR revenue composition (NBR tax / Non-NBR / Non-tax YTD)** — NBR monthly bulletin. Fiscal revenue donut.
- ⏳ **Domestic / External / IMF EFF debt breakdown** — MoF + IMF tracker. Fiscal page.
- ✅ **BB forward auction calendar** — shipped (PR #14). `auction_calendar` → `useAuctions().upcoming` via `toUpcomingAuctions` (filters `auction_date >= today`, honest "No scheduled auctions" empty state). Powers the Yields "Upcoming" list. (The Fiscal 12-week stacked issuance strip stays intentionally un-wired — the live calendar is a ~4-forward-week date list, which fits a date list, not a 12-week bar; landmine 27.)
- ✅ **Recent auctions cleared (per-print bid/cover/WAM/cutoff)** — shipped (PR #14). `auction_results` → `useAuctions().results` via `toAuctionDisplayRows` (honest same-tenor delta/trend, no fabrication; landmine 27). Powers the Yields recent-results table + Dashboard auction list.

### Banking sector

- ✅ **Credit / Deposit ratio** — shipped via Tier A (PR #10) as **"Pvt credit / deposits" (~89.5%)** — derived `private_sector_credit ÷ deposits_of_the_system`. NOTE: this is NOT the regulated total-advances ADR/CDR; labelled accordingly (AGENTS.md landmine 20). The history chart was dropped (flat carry-forward sources, landmine 18).
- ✅ **Private sector credit YoY** — shipped via Tier A (PR #10). Banking ListRow "6.0% · May '26".
- ⏳ **NPL by ownership segment (SOCB / Pvt Commercial / Foreign / Specialised)** — BB Financial Stability Report (FSR), quarterly. NPL-by-segment panel + slope chart. (Industry-wide NPL is already live; the segment split is not.)
- ⏳ **System deposits by ownership** — BB monthly banking statistics aggregate. Deposits donut.
- ⏳ **Industry-wide LCR, NSFR** — BB FSR quarterly. Basel-III panel (CAR already live; LCR/NSFR not).

### Macro & external sector

- ⏳ **Core CPI** — BBS monthly. Completes the CPI heatmap's 4th row (Core is the lone fixture row).
- ⏳ **Current account balance** — BB external sector statistics. Macro BoP "Current acct" mini-tile (currently the hardcoded −2.8). NOTE: do NOT wire `bop_summary` here — it's a whole-table LLM parse that most likely means Overall Balance, not Current Account (AGENTS.md landmine 19).
- ✅ **REER (Real Effective Exchange Rate)** — shipped via Tier A (PR #10). Macro USD/BDT caption "REER 102.8 · Mar '26". (The old "overvalued ~6%" claim was dropped — not derivable without a base-period reference.)
- ⏳ **Other commodities (LNG, Wheat, Palm oil) for BD import bill** — international feeds (S&P Platts, World Bank Pink Sheet, FAO), not BD-specific. May need a different provider than BB/BBS. (Brent is live; these three stay Demo.)

---

## Tier 3 — No public source  (unchanged)

No public Bangladesh source publishes these. Build a manual data-entry surface, integrate a paid provider, or accept they stay Demo permanently.

- **Top-10 banks Basel-III + asset quality per-bank** — BB doesn't publish per-bank prudential data publicly. (Banking "Where the stress sits" matrix.)
- **Intraday call money hourly rates (5 days × 8 hours)** — BB publishes daily summary only. (Liquidity intraday heatmap.)
- **ALCO decisions log (Signed / Pending / Draft items)** — internal bank workflow; needs an internal store + UI. (Intelligence page.)

---

## Tier 4 — AI / narrative content  ✅ MOSTLY DONE (briefing pipeline)

Now driven by the **weekly-briefing pipeline** (econdelta PR #39, 2026-05-30): a Claude opus[1m] Monday job writes to the `briefings` table; YieldScope reads it via `useBriefing` and renders the hero, "what's moving", and the Intelligence weekly read from `brief.title` / `brief.body` / `brief.featuredAnomalies`. When no briefing exists, the panels fall back to a `Demo data` pill.

- ✅ Dashboard hero narrative line — live from `brief.title`.
- ✅ Dashboard "What's moving" alerts — live from `brief.featuredAnomalies`.
- ✅ Dashboard weekly briefing snippet — live from `brief.body`.
- ✅ Intelligence page weekly briefing — live, rendered as segmented markdown (PR #8).
- ✅ Intelligence page anomaly explainers — live from the briefing's anomaly set.
- ⏳ Intelligence page ALCO decisions log — still Demo (Tier 3, no data source).

---

## Order of operations recommendation (updated 2026-05-31)

Tier 1 is complete; Tier 4 is complete except the ALCO log; the scalar slice of Tier 2 shipped via Tier A. **All remaining wins are EconDelta scrapers (Tier 2 structured) or have no source (Tier 3).** Recommended Tier 2 rounds for the next EconDelta sessions:

1. **Round A — money-market structured:** CRR/SLR utilisation, SLF draw vs limit, BB repo borrowing total (single BB liquidity-ops source). Unblocks the Liquidity reserve-util panel + the repo-from-BB tile.
2. **Round B — fiscal:** Debt/GDP, W&M usage, NBR revenue composition, domestic/external/IMF-EFF debt breakdown. Unblocks most of the Fiscal page (its heaviest Demo cluster).
3. **Round C — auction infra:** BB DFIM issuance calendar (12-week) + the `gsec_auction` structured-payload audit. Unblocks the Yields auctions table + Dashboard auction list + Fiscal issuance strip — one source, three panels.
4. **Round D — banking FSR (quarterly):** NPL by segment, system deposits by ownership, LCR/NSFR.
5. **Round E — macro tail:** Core CPI (completes the heatmap), current account, commodity feed (LNG/Wheat/Palm oil).
6. **Tier 3:** decide per-panel — manual entry (top-10 matrix, ALCO log) vs accept-as-Demo (intraday call money).

Each EconDelta scraper addition also needs: entry in `econdelta/config/sources-v3.json` · parser (HTML/PDF/table) · metric_id constant in YieldScope's `src/lib/econdelta-metrics.ts` · hook extension to fetch + render · optional matching entry in The Brief.

---

## Status snapshot

- **2026-07-09:** Tier 2: **~10 / 22 done** — auction results + forward calendar (PR #14) and CRR/SLR maintained ratios now live, added to the earlier 7 (corridor, M2, net-dom-borrow, C/D, pvt-credit YoY, REER, + Tier-1 wires). Real-data coverage **~25 metrics live**; placeholder coverage **~17 structured panels** still Demo (down from ~20). Remaining Tier-2 wins are the fiscal cluster (Debt/GDP chart, W&M, revenue split, debt breakdown), banking FSR (NPL-by-segment, deposits donut, LCR/NSFR), and the macro tail (core CPI, current account, LNG/Wheat/Palm-oil).
- **2026-05-31:** Tier 1: **5 / 5 done** (2Y unblocked via monthly metric). Tier 2: **~7 / 22 done** (corridor, M2, net-dom-borrow, C/D, pvt-credit YoY, REER, + the Tier-1 commodity/CPI/USD-BDT wires) — the remaining ~15 are all structured panels needing new scrapers. Tier 3: 3 items, no plan. Tier 4: **5 / 6 done** (briefing pipeline live; ALCO log pending). Real-data coverage: **~22 metrics live**; placeholder coverage: **~20 structured panels** still Demo (down from ~30 on 2026-05-28, ~40 pre-honesty-pass).
- 2026-05-28 evening: Tier 1: 4 / 5. Tier 2: 0 / 22. ~30 panels Demo.
- 2026-05-28 (start of day): Tier 1: 0 / 5. ~40 panels Demo.
