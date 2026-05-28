# EconDelta scraper wishlist (from YieldScope)

Created 2026-05-28 after the YieldScope honesty pass surfaced every panel that still shows placeholder ("Demo") data. The honesty pass is purely a presentation fix — this document is the work queue to actually shrink the placeholder set by extending EconDelta + then wiring the new metrics into YieldScope.

Audience: future-Claude (or anyone) working in `~/Projects/clauding-lab/econdelta` or back in YieldScope. The Brief consumes the same data pipeline so most of these are also wins for The Brief.

Sorted by effort tier. Within each tier, prioritised by visibility on the YieldScope screen.

---

## Tier 1 — Already in EconDelta, just need YieldScope to call it

These metrics exist in EconDelta today. They're not wired into a YieldScope hook yet. Pure YieldScope-side work — no EconDelta change needed.

| Status | YieldScope panel | EconDelta metric_id | YieldScope hook to extend | Notes |
|---|---|---|---|---|
| ✅ shipped 2026-05-28 | Macro · USD/BDT historical chart | `usd_bdt_exchange_rate` | `useMacro` added `usdBdtHist` field via `fetchSeries(METRIC.USD_BDT, { limit: 8 })`. Hardcoded `[118.4, ..., 119.62]` array removed. |
| ✅ shipped 2026-05-28 | Macro · Brent oil in commodities mini-list | `brent_crude_usd_barrel` | `useMacro` added `brentUsdBarrel` + `brentHist` fields. Replaces fixture "Brent 84.20" tile + sparkline. |
| ✅ shipped 2026-05-28 (partial) | Macro · CPI heatmap (8-month, 4-series) | `point_to_point_inflation` + `food_inflation` + `non_food_inflation` (+ TODO core) | 3 of 4 rows wired live (Food, Non-food, Headline). Core row stays fixture pending EconDelta core CPI scraper (Tier 2). Col labels now derived from CPI series as_of dates via new `cpiMonths` field. |
| ✅ shipped 2026-05-28 | Yields · History tab (5 tenors × 11-period series) | `bill_bond_rates` + `tbill_182d_yield` + `tbill_364d_yield` + `tbond_5y_yield` + `tbond_10y_yield` | `useYields` added `series` field via 5 `fetchSeries` calls at limit 11. HISTORY_SERIES fixture removed. 2Y dropped from picker (not in EconDelta). |
| ⏳ blocked on Tier 2 | Yields · 5y-2y spread tile | `bill_bond_rates` (2Y tenor) | EconDelta currently scrapes 91D, 182D, 364D, 5Y, 10Y — no 2Y. Once added, compute 5Y - 2Y. Stays Demo-chipped today. |

---

## Tier 2 — Add to EconDelta (public BB/BBS/NBR source exists)

These need a new scraper. The source is published on a public Bangladesh government website. Order roughly by "ease of scraping" then "value to YieldScope."

### Money market & liquidity

- **Policy corridor (split into 3 metrics)** — currently EconDelta has one ambiguous `policy_rate_slf_sdf` metric that scrapes the BB website footer ticker and stores a single number (10.0 today — could be SDF, Repo, or SLF depending on ticker rotation). YieldScope needs **three separate metrics**: `policy_rate_repo`, `policy_rate_sdf`, `policy_rate_slf`. Source: BB monetary policy committee announcements (`bb.org.bd` policy section), or the rate-change press releases. Cadence: quarterly. Used by YieldScope's CorridorViz (hardcoded as SDF 6.50 / Repo 9.00 / SLF 10.50 today).
- **M2 broad money supply (level + YoY)** — BB monthly monetary statistics. `M2_LEVEL` is already in YieldScope's metric catalog as `m2_broad_money` but EconDelta doesn't populate it. Needs scraper. YoY derivation can happen client-side.
- **CRR utilisation, SLR utilisation** — BB monthly banking statistics. Industry-aggregate %, not per-bank. Used by YieldScope's Liquidity "Reserve utilisation" panel.
- **SLF draw vs limit, BB repo borrowing total** — BB liquidity operations report. Daily/weekly cadence. Used by YieldScope's Liquidity desktop reserve util bars + the "Repo borrow · from BB" tile (currently hardcoded 124.6 k Cr).
- **Call money intraday hourly rates** — *MAY NOT BE PUBLIC.* DFIM (BB's debt management department) tracks it; public release is daily summary only. Wishlist item but de-prioritise.

### Fiscal & sovereign

- **Debt / GDP ratio + history** — Ministry of Finance quarterly debt management report. Used by YieldScope's Fiscal hero metric + chart.
- **Net domestic borrowing YTD vs target** — BB debt management bulletin. Used by Fiscal page.
- **Ways & Means usage vs limit** — BB monetary financing weekly bulletin. Used by Fiscal page.
- **NBR revenue composition (NBR tax / Non-NBR / Non-tax YTD)** — NBR monthly bulletin. Used by Fiscal revenue donut.
- **Domestic / External / IMF EFF debt breakdown** — Ministry of Finance + IMF tracker. Used by Fiscal page.
- **BB issuance calendar (next 12 weeks T-bill + BGTB)** — BB DFIM publishes upcoming auction calendars. Used by Yields auctions tab + Fiscal issuance calendar (12-week strip).
- **Recent auctions cleared (per-print bid/cover/WAM/cutoff)** — BB DFIM auction results. Already exists as `gsec_auction` in YieldScope catalog but schema unclear; needs `gsec_auction` structured-payload audit. Used by Yields recent results table + Dashboard auction list.

### Banking sector

- **Credit / Deposit ratio (industry)** — BB monthly banking statistics. Used by Banking page hero metric.
- **Private sector credit YoY** — BB monetary survey. Used by Banking ListRow.
- **NPL by ownership segment (SOCB / Pvt Commercial / Foreign / Specialised)** — BB Financial Stability Report (FSR), published quarterly. Used by Banking NPL-by-segment panel + slope chart.
- **System deposits by ownership** — BB monthly banking statistics aggregate. Used by Banking deposits donut.
- **Industry-wide LCR, NSFR** — BB FSR quarterly. Used by Banking Basel-III panel (CAR is already live; LCR/NSFR are not).

### Macro & external sector

- **Core CPI** — BBS publishes monthly. Already in YieldScope catalog if EconDelta starts ingesting; just needs the metric added to EconDelta scraper.
- **Current account balance** — BB external sector statistics. Used by Macro BoP "Current acct" mini-tile.
- **REER (Real Effective Exchange Rate)** — BB external sector statistics monthly. Used by Macro USD/BDT caption "REER 108.4 · overvalued ~6%".
- **Other commodities (LNG, Wheat, Palm oil) for BD import bill** — international commodity feeds (S&P Platts, World Bank Pink Sheet, FAO). Not BD-specific. May need a different provider integration than BB/BBS sources.

---

## Tier 3 — No public source

These are not on the wishlist for EconDelta scraping because no public Bangladesh source publishes them. Either build a manual data-entry surface, integrate a paid provider, or accept that these stay Demo permanently.

- **Top-10 banks Basel-III + asset quality per-bank** — BB doesn't publish per-bank prudential data publicly. Each bank's annual report contains it but not in a scrapable consolidated format.
- **Intraday call money hourly rates (5 days × 8 hours)** — BB publishes daily summary only; intraday is DFIM internal.
- **ALCO decisions log (Signed / Pending / Draft items)** — internal bank workflow; not a public data source. Needs an internal store + UI.

---

## Tier 4 — AI / narrative content (separate concern from scraping)

These need an AI content engine, not a scraper. Out of scope for EconDelta. In scope for a future YieldScope "Intelligence" rebuild.

- Dashboard hero narrative line ("The short end is easing — but call money has now pierced the repo...")
- Dashboard "What's moving" alerts (4 entries)
- Dashboard weekly briefing snippet
- Intelligence page weekly briefing
- Intelligence page anomaly explainers
- Intelligence page ALCO decisions log

---

## Order of operations recommendation

When picking the next session's work:

1. **Tier 1 first** (highest ROI / lowest effort) — just YieldScope hook extensions, no EconDelta change. Maybe 1–2 hours total for all 5 items. Immediately shrinks the Demo set by ~5 panels.
2. **Tier 2 split into rounds**:
   - **Round A** — easiest BB scrapes: policy corridor split, M2, CRR/SLR. Single source (BB website), straightforward parsers.
   - **Round B** — fiscal scrapes: Debt/GDP, W&M, NBR revenue.
   - **Round C** — banking sector: Credit/Deposit, Pvt sector credit, NPL by segment, system deposits, LCR/NSFR.
   - **Round D** — auction infra: BB calendar + gsec_auction schema audit.
   - **Round E** — REER + core CPI + current account.
3. **Tier 3 + Tier 4** — defer indefinitely or build separately.

Each EconDelta scraper additions also needs:
- Entry in `econdelta/config/sources-v3.json`.
- Parser implementation (HTML / PDF / structured table).
- Metric_id constant added to YieldScope's `src/lib/econdelta-metrics.ts`.
- Hook extension on the YieldScope side to fetch + render the new metric.
- Optional: matching entry in The Brief's data layer if applicable.

---

## Status snapshot

- 2026-05-28 evening: Tier 1: 4 / 5 done (one blocked on Tier 2 — need EconDelta to add 2Y tenor). Tier 2: 0 / 22 queued — biggest pile. Tier 3: 3 items, no plan. Tier 4: 6 items, defer.
- 2026-05-28 (start of day): Tier 1: 0 / 5 done.

Current real-data coverage on YieldScope after Tier 1 wires: ~18 metrics live across 6 hooks (added Brent latest + USD/BDT series + Brent series + 5 tenor series + CPI months). Placeholder coverage: ~30 panels labeled `Demo` or rendering `—` (down from ~40).
