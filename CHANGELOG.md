# Changelog

All notable changes to YieldScope are documented in this file.

Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Dates in BDT.

## [3.2.0] — 2026-07-11

Removed the last always-demo panels — Banking NPL-by-segment / top-10 heatmap / NPL trajectory / deposits-by-ownership donut, the Fiscal-pressure composite gauge, and Macro Core CPI + CPI-components heatmap — and their fixture consts; dropped the hardcoded Macro "April" vintages (mobile + desktop) and the dead "All 60 banks"/"Export" buttons. Only the offline curve/auctions fallbacks remain fixture-backed.

## [3.1.0] — 2026-07-11

De-demo batch: closed out the remaining Tier-2 wiring gaps, removed panels with no realistic live source, and tightened the honesty/CI rails around what ships as "live" vs "demo."

### Wired live

- **Yields** — 91-day vs. SDF spread and the live tenor ladder (PR #29).
- **Banking** — Interbank repo volume, replacing the old "Repo borrow from BB" demo tile (relabeled + wired to `interbank_repo_data`, consistent with landmine 19) (PR #30).
- **Fiscal** — NBR revenue FYTD and the gross issuance calendar (dynamic "next N weeks" bar via `toWeeklyIssuance`/`useIssuance`, trimmed of trailing all-zero weeks) (PR #31).
- **Intelligence + Dashboard** — live anomalies and a 7-week timeline; honest empty states when no briefing exists yet (PR #32).

### Removed (not demo — dropped from the UI entirely)

- LCR/NSFR tiles (Banking).
- Ways & Means + ADP (Fiscal) — `non_nbr_tax_revenue` / `ways_means_usage_cr` never populate.
- The call-money intraday heatmap (Liquidity).
- The ALCO decision log (Intelligence).
- The Fiscal revenue-split donut.
- The dead `Liquidity`/`Fiscal`/`Banking`/`Intel` fixture blocks in `src/data/fixtures.ts` (interfaces + data) — the file now retains curve + auctions offline fallbacks only.

### Added

- `OutageChip` fetch-error indicator across 6 pages (Dashboard, Yields, Banking, Fiscal, Liquidity, Macro).
- CI deploy gate — lint + tests now run before the Pages build (PR #28).

### Docs

- Reconciled `AGENTS.md` landmines 27 and 29 with the shipped wiring; added landmine 31 pinning `fixtures.ts` scope.
- Reconciled `VISION.md` — Vitest/`@supabase/supabase-js` are installed (not "once added"), the EconDelta swap has shipped, and the GitHub Pages base path is `/` (custom domain), not `/YieldScope/`.
