# Remove the always-demo panels — Design

**Date:** 2026-07-11 · **Owner:** Adnan · **Branch:** `feat/remove-demo-panels`

## Goal

Delete the 7 always-fake panels that survived the de-demo batch (they were kept as badged-demo pending an upstream data source that doesn't exist). Owner decision 2026-07-11: **remove them entirely** rather than keep them badged. Pages simply get shorter — no empty-state placeholders, no layout backfill.

## Scope

**In scope — delete entirely (panel JSX + its local fixture const + orphaned imports):**

| Page | Panel | Local data to delete |
|---|---|---|
| Banking | NPL by segment | `NPL_BY_SEG` |
| Banking | Top-10 banks heatmap (CAR/LCR/NSFR/NPL/CD) | `TOP_BANKS`, `RANGES`, `bankColor` |
| Banking | NPL trajectory · by segment | `SLOPE_ITEMS` |
| Banking | System deposits · by ownership | `DEPOSIT_SEGMENTS`, `DEPOSIT_LEGEND` |
| Fiscal | Fiscal pressure composite (mobile `Bar value={68}` + desktop `RadialGauge value={68}` + "Elevated." verdict) | inline `68` values |
| Macro | Core CPI row (the fabricated `Core` line — keep the live Food/Non-food/Headline rows) | `CORE_CPI_FIXTURE` |
| Macro | CPI components · 8-month heatmap (in full, incl. live-ish rows — owner's call) | `CPI_ROWS`, `CPI_COLS_FALLBACK`, `buildCpiHeatmapData`, `buildCpiHeatmapCols` |

**Also in scope (fabricated-label cleanup, same class as the removed Dashboard hints):**
- Macro `"CPI · headline · April"` caption → derive the vintage from the live CPI as-of if available, else drop the `· April`.

**Orphaned imports to remove after deletion (verify each with grep + lint):**
- Banking: `Donut`, `DonutLegend`, `Heatmap`, `SlopeChart` (from `../components/charts`), and `severityColor` if only used by NPL-by-segment. Keep `AreaChart` (interbank-repo chart) and `Bar` (prudential CAR bar — verify it's still used).
- Fiscal: `RadialGauge` (only the gauge used it); `Bar` if the mobile composite bar was its only use — verify.
- Macro: `Heatmap` (only the CPI heatmap used it).

**Out of scope — leave unchanged:**
- Conditional badges gated on a null live value (Banking CAR/NPL/pvt-credit/interbank-repo, Fiscal NBR/Debt-GDP, Liquidity corridor/CRR-SLR/M2, Macro BoP/commodities/USD-BDT) — honest "not landed yet" signals that self-clear.
- Offline fixture fallbacks (yield-curve fixture mode, auctions offline) — the R1 OutageChip already flags outages; the fallback keeps the page from blanking when Supabase is down.

## Layout consequence (accepted)

`BankingDesktop` loses 4 panels — it will keep the CAR/NPL/pvt-credit/interbank-repo stat tiles + the interbank-repo AreaChart, and simply be shorter. The implementation MUST verify the surviving grid/flex layout still reads intentionally at 320 / 768 / 1440 (no orphaned grid cell, no dangling divider/section-rule). Same check for Fiscal (the pressure gauge sat in a 2-up grid — confirm the surviving cell reflows) and Macro (the removed heatmap leaves its section; confirm no empty section header/divider remains).

## Testing

- Per-page test: assert each removed panel's heading is ABSENT — `queryByText(/NPL by segment/i)`, `/Top 10 banks/i`, `/NPL trajectory/i`, `/deposits · by ownership/i`, `/Fiscal pressure/i`, `/Elevated\./`, `/CPI components/i`, and the Macro `Core` row gone while Food/Non-food/Headline remain. Run RED where practical (panel still renders) then green after removal.
- Full gate green: `npm run test:run && npm run lint && npm run build` (each bare, redirect + exit-code check).
- **Visual verification** (discipline #3 — layout changes need a real surface): screenshot Banking, Fiscal, Macro at 320/768/1440 after the change; confirm no gutted/broken layout. Bypass the PWA service worker when checking prod (see `reference_playwright_fullpage_demo_artifact` memory).

## Docs

- **AGENTS.md landmine 29** — move the removed panels from the "stays demo BY DESIGN" list to "removed 2026-07-11". What genuinely remains demo afterward: offline curve/auctions fallbacks only (everything else is now live-or-honestly-empty).
- **AGENTS.md landmine 19** — if it still references NPL/deposits/heatmap as demo-badged, reconcile.
- **CHANGELOG.md** entry + `package.json` minor version bump.

## Delivery

One PR (`feat/remove-demo-panels` → main). Cohesive change (removals across 3 pages). Deploy watched to completion; prod spot-checked with the SW bypassed.
