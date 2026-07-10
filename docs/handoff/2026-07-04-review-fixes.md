# Handoff — YieldScope fixes from the 2026-07-04 ecosystem review

**Created:** 2026-07-04 (BDT) by a Fable 5 orchestrator session.
**Execute with:** Claude Opus 4.8 (`/model opus`), fresh session in THIS repo (`~/Projects/clauding-lab/YieldScope`). Self-contained — the executing session has no memory of the review. Read AGENTS.md / VISION.md / AGENT_LEARNINGS.md first — **but see F5: AGENTS.md itself is stale and part of the work.**
**Provenance:** two independent Opus 4.8 review passes (repo + live site with Playwright screenshots at 375/1440px + direct Supabase reads); P1 claims verified by adversarial re-checks, then a cold-reader pass corrected F4's premise. Repo state: fresh clone at this path (cloned 2026-07-04 from `clauding-lab/YieldScope`, HEAD `81850b8` 2026-06-05; live deploy matches HEAD). `npm ci` / `npm run lint` / `npm run test:run` all exit 0 (62 tests, 14 files). Nothing was modified.
**Local env:** `.env.example:9` ships a placeholder — copy to `.env.local` and set `VITE_SUPABASE_ANON_KEY` (same Supabase project as the-brief: key available as `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `/Users/adnanrashid/Projects/clauding-lab/the-brief/.env.local`, or from the GitHub repo secret) before `npm run dev`. Dev URL is `localhost:5173/` — AGENTS.md's `/YieldScope/` dev path is part of the F5 staleness.

## Ground truth the docs get wrong (believe this, not the docs)

- **The EconDelta swap SHIPPED** (PRs #10–#17, May 28–Jun 5). The live site reads Supabase `metric_history`/`metric_history_monthly`/`briefings` via the **anon key** (verified: 5+ REST calls returning 200; anon-read RLS policies exist on both metric tables, both auction tables, `metric_definitions`, `run_logs`, `briefings`). `fixtures.ts` is NOT "the temporary data layer" anymore — it backs only the yield curve and a few Demo panels.
- The stale v2.0 workflows (`scrape-data.yml`, `update-app.yml`) and `scripts/` were **already deleted** in PR #5; only `deploy.yml` remains. Base path migrated from `/YieldScope/` to `/` (custom domain `yieldscope.clauding-lab.com`) — done correctly in vite.config.ts + main.tsx + manifest, but the docs still describe the old world.
- Live displayed values match reality almost exactly (91d 9.44, 182d 9.71, 364d 9.74, 5y 10.37, 10y 10.24, USD/BDT 122.85, repo 10.00, SLF 11.50 — all fresh-dated and correct). The design and honesty scaffolding (DemoBadges, `—` for nulls, vintage labels like "Mar '26") were independently praised by both reviewers. Mobile-first at 375px is real.

## Upstream context (EconDelta bugs YieldScope currently displays)

Fixed separately via `econdelta/docs/handoff/2026-07-04-ecosystem-review-fixes.md` — do not fix upstream from here, but the client-side gates below must not wait for upstream:
- `banking_sector_crar = 1.56` (as_of 2025-09-30) is a **fabricated** LLM-fallback value (real system CRAR ~10–13%).
- `policy_rate_sdf = 7.5` writes fresh-dated daily; the **real SDF floor is 8.50** (repo 10.00 / SLF 11.50 are right).
- `dsex` frozen 2026-06-11 (DSE TLS cert failure); `auction_calendar`'s newest `auction_date` is 2026-06-09 (scraper gap under investigation upstream).

---

## Fixes (priority order)

### F1 — Excess-liquidity label wrong by 100× (P1, S) — VERIFIED CONFIRMED
`excess_liquid_asset_total_minimum` latest value = **385,992.24 BDT crore**. `src/hooks/useLiquidity.ts:33` defines `CR_PER_KCR=100000`; `:64` computes `excessLiquidityKCr = value/100000 = 3.86`; `src/pages/Liquidity.tsx:159/161` renders `3.9` + label `k Cr` (thousand crore) → reads as ৳3,900 cr when the truth is ~৳386,000 cr (3.86 **lakh** crore). Root cause: the variable/comment conflates k (thousand) with lakh (100k). Fix scope is FOUR sites, not two: the mobile render `:159/161`, the desktop render `:240/242` (same bug), and TWO fixture-scale thresholds — `:253` (`<200` warn color) and the `threshold={150}` prop at `:249`.
**Fix:** correct the unit label (lakh Cr) or rescale; rename the variable; rescale both thresholds. **Sign-off gate:** this changes a displayed financial magnitude on an ALCO tool (3.9 → ~386,000) — present the corrected number to Adnan for confirmation before merge (global rule 9 / VISION currency-and-data-seam), even though the fix itself is mechanical.

### F2 — Plausibility + vintage gate at the hook seam (P1, M)
The honesty gate is `value ?? null → DemoBadge` everywhere — excellent for MISSING data, defenseless against present-but-wrong data. Symptoms live now: Banking renders "CAR 1.56%" unbadged (LCR/NSFR beside it ARE badged) and Liquidity renders "Standing deposit 7.50" unbadged. The app's own `briefings.stale_series` already flags `banking_sector_crar`, yet the page shows it clean.
**Fix:** lightweight per-metric guard at the hook seam (`useBanking`, `useLiquidity`, etc.): (a) plausibility band per metric (proposed: CAR 5–30%, policy rates 0–20%, corridor coherence SDF < repo < SLF — **these bands are financial-judgment constants: confirm with Adnan before hardcoding**); (b) max-age by cadence (quarterly > ~110d → stale chip + vintage label, e.g. "Sep '25"); breach → render `—`/DemoBadge/stale chip, never a clean number. Add vintage labels to NPL ("Mar '26") and CAR. This is the one architectural gap both reviewers converged on. (The `briefings.stale_series` flag on `banking_sector_crar` was observed live but is not locally checkable without the anon key — verify before relying on it as a gate input.)

### F3 — The flagship yield curve is the last fixture, unbadged on Dashboard + mobile Yields (P1, M) — VERIFIED CONFIRMED
`src/components/charts/YieldCurve.tsx` renders EXCLUSIVELY from `FX.curve` (imports FX at `:2`; tenors `:29`; every line incl. the accent "Today" series `:36/:81/:95`; scrub readout `:105/:122`; no live-data prop exists). The Dashboard shows it under a LIVE "Slope 10y–91d" headline with zero DemoBadges, and mobile `Yields.tsx:67` renders it unbadged — only desktop `Yields.tsx:335` badges it. Screenshot evidence: fixture curve plots 91D ≈ 11% while the live hero tile beside it reads 9.44%.
**Fix (two steps):** (1) immediate honesty — DemoBadge the curve on Dashboard + mobile Yields to match desktop; (2) wire it live — feed `useYields()` series (91D/182D/364D/2Y/5Y/10Y/20Y are live in `metric_history`; the 4 non-EconDelta tenors 7D/14D/28D/15Y render gapped/labeled). **Open design decision for step 2:** `FX.curve.tenors` is an 11-entry axis — decide with Adnan whether the live curve keeps that axis (live points interpolated/gapped onto it) or the axis shrinks to the 7 live tenors; this changes the shape of the product's identity object, so mock both options before committing. AGENTS.md landmine 18 (live headline over unbadged fixture) is exactly this.

### F4 — Auction data is ALREADY wired; residual work is the "Upcoming shows the past" bug (P2, S)
**Corrected premise (cold-reader check):** the auction wiring shipped in PR #14 (`e9b857d`, "feat(auctions): wire live auction results + forward calendar") — `useAuctions.ts` fetches both `auction_calendar` and `auction_results`, consumed at `Dashboard.tsx:185` and `Yields.tsx:169/268`. Do NOT re-wire from scratch. ("No consumer reads the auction tables" remains true only for The Brief — handled in its own handoff.)
**Residual work:** (a) `Yields.tsx:170` shows month-old dates as "Upcoming" — the newest live `auction_date` is 2026-06-09 (upstream scraper gap, chased in the econdelta handoff), and the fixture fallback `:27-31` is June dates too. Filter to `auction_date >= today` with an honest empty state ("No scheduled auctions"), and make the fixture fallback badge unambiguous. (b) Refresh `docs/econdelta-wishlist.md` — it still says "scraper still needed" for auctions and CRR/SLR utilisation (`crr_utilisation_pct`/`slr_utilisation_pct`, live daily); reclassify what's now available and wire the CRR/SLR bars.

### F5 — Docs reconciliation: AGENTS.md/README/VISION.md describe a deleted world (P1 for governance, S)
`AGENTS.md:7` still calls fixtures "the temporary data layer until the EconDelta swap"; landmine 9 defends `scripts/*.mjs` + two workflows deleted in PR #5 (`ff1926f`); landmine 5 documents the `/YieldScope/` base path (now `/`); README lists the old GitHub-Pages URL and "four palettes… Moss" (Moss removed). These stale docs actively misled the review that produced this handoff.
**Fix:** one docs PR — reframe the data-layer status (swap shipped; anon RLS proven), retire landmine 9, rewrite landmine 5 for `/` (including the dev URL `localhost:5173/`), fix README URL/palettes, note in AGENT_LEARNINGS.md that stale governance docs caused a misdiagnosis. The matching econdelta-side edit (its landmine 18 says service-role-only RLS; superseded for `metric_history`) is item E3.1 in `/Users/adnanrashid/Projects/clauding-lab/econdelta/docs/handoff/2026-07-04-ecosystem-review-fixes.md` — done in that repo's session, not this one.

### F6 — Dashboard briefing content undated as "Today" (P2, S)
`Dashboard.tsx:63` kicker=todayLabel(); `:80` hero = briefing title; `:51` "What's moving" = briefing anomalies — with no `weekOf`/`dataAsOf` shown, so briefing-snapshot figures ("91D at 9.70%") sit inches from live tiles (9.44%) implying same-moment truth. `/intelligence` DOES disclose ("2026-06-29 · Data as of 2026-03-31 · 1 series stale") — grep `src/pages/Intelligence.tsx` for that disclosure render and lift it into `Dashboard.tsx`; label the block "From this week's briefing".

### F7 — Small polish (P3, S)
Deprecated `apple-mobile-web-app-capable` meta (add `mobile-web-app-capable`) — the only console warning. Wrap the `useLiquidity` loading-state test in `act()`. Bottom-nav labels at 375px are near the tap-target lower bound — acceptable, monitor.

## House rules
Branch → PR → preview → Adnan's merge approval (VISION.md). `npm run lint` + `npm run test:run` + `tsc -b` full-gate before any "done" claim (no piping through tail/grep). Live-verify on the deployed preview per Adnan's preview-before-prod rule. Dev server in tmux per AGENTS.md. Log incidents (100× label, unbadged fixture curve) in AGENT_LEARNINGS.md.
