# AGENTS.md — YieldScope

Operational rules for AI coding agents (Claude Code, Cursor, Codex CLI, etc.) working in this repo. Read this in full before making any code change.

## What this project is

**YieldScope** is a banker-grade Bangladesh ALCO (Asset-Liability Committee) Intelligence Platform — a mobile-first PWA aimed at treasury teams at Bangladeshi banks. It surfaces government securities yields, T-bill/T-bond auctions, money-market liquidity, macro indicators (CPI, FX reserves, BoP), fiscal pressure (revenue, ADP, debt/GDP), and banking-sector health (NPL, CAR, repo borrowing). The app is a single-page React 19 + Vite + TypeScript application deployed to GitHub Pages at the **custom domain `yieldscope.clauding-lab.com`** (base path `/`; a `public/CNAME` pins the domain). Charts are hand-rolled SVG (no chart library); typography is Geist + Geist Mono; design system uses 3 palettes (Slate / Ivory / Linen) applied via `theme-*` classes on `<html>` (Linen is the base `:root`, empty class). Moss was removed 2026-05-31. Version 3.0 (2026-05-28) is a ground-up rebuild from a Claude Design package handoff.

**Data layer status (the EconDelta swap SHIPPED, PRs #10–#17, May 28–Jun 5 2026).** Pages read **live** EconDelta data from Supabase (`metric_history` / `metric_history_monthly` / `briefings` / `auction_results` / `auction_calendar`) through per-domain hooks (`useYields`, `useLiquidity`, `useBanking`, `useAuctions`, `useDashboard`, `useBriefing`, …) via `src/lib/econdelta.ts` + `src/lib/supabase.ts`, using a read-only anon key (anon-read RLS proven on all five tables). `src/data/fixtures.ts` is **no longer the data layer** — it survives only as the no-credentials fallback (incl. the yield curve's fixture mode) and a handful of `<DemoBadge />` panels with no live source yet (see `docs/econdelta-wishlist.md`). The yield curve went LIVE 2026-07-09; later the same day the axis switched to **Option B** (owner reversal after seeing Option A live): the live axis is exactly the **7 EconDelta tenors (91D–20Y)** — 7D/14D/28D/15Y are off the axis entirely. The gap/bridge honesty machinery remains for genuinely missing prints *within* the 7 (never interpolated). The no-credentials fixture curve keeps its own 11-tenor axis, badged. See `src/lib/curveLive.ts` and `YieldCurve.tsx`.

Owner: solo dev (Adnan, Bangladesh, UTC+6). Vibe-coded — Adnan directs AI agents, does not hand-write code himself. All explanations, summaries, and prose should be in **plain English with technical terms briefly explained**, never assume Adnan reads code.

## Repository structure

```
.
├── src/
│   ├── App.tsx                       Lazy routes + AppShell wrap
│   ├── main.tsx                      ThemeProvider → ErrorBoundary → Router → App
│   ├── hooks/                        Per-domain LIVE data hooks (useYields, useLiquidity, useBanking, useAuctions, …)
│   ├── data/fixtures.ts              Fixture fallback (FX) — backs only the yield curve + a few Demo panels post-swap
│   ├── theme/
│   │   ├── themeContext.ts           Palette types, PALETTES, ThemeContext, useTheme hook
│   │   └── ThemeProvider.tsx         Provider component only (HMR-safe split)
│   ├── lib/
│   │   ├── routes.ts                 NAV_ITEMS, activeKeyForPath
│   │   └── hooks.ts                  useMediaQuery, useIsDesktop
│   ├── styles/globals.css            Full design system, 3 palettes, glass, typography
│   ├── components/
│   │   ├── primitives/               Editorial UI atoms: Logo, Stat, Card, ListRow, Sparkline, Delta, Tabs, Collapse, Alert, Bar, IconButton, HeaderActions, SectionTitle, NavIcon
│   │   ├── charts/                   Hand-rolled SVG: AreaChart, YieldCurve (scrubbable), Heatmap, Timeline, BarChart, Donut, RadialGauge, DotMatrix, SlopeChart, Candle
│   │   └── layout/                   AppShell (responsive), MobileHeader, DesktopHeader, BottomNav (floating glass pill), DesktopSideNav (collapsible pin/hover), ErrorBoundary
│   └── pages/                        Dashboard, Yields, Liquidity, Macro, Fiscal, Banking, Intelligence — each has Mobile + Desktop sub-layouts
├── docs/
│   ├── superpowers/plans/            Implementation plans (e.g., the EconDelta swap plan)
│   └── econdelta-wishlist.md         Catalog of placeholder panels + 4 effort tiers for live data
├── public/                           favicon.svg, icons/ (PWA)
├── index.html                        Vite entry, `<html class="theme-slate">` default
├── vite.config.ts                    Base `/` (custom domain), PWA manifest, vendor-react chunk
├── public/CNAME                      `yieldscope.clauding-lab.com` (pins the GitHub Pages custom domain)
├── package.json                      v3.0.0 — React 19 + Vite 6 + Tailwind 4 + react-router-dom 7
└── .github/workflows/deploy.yml      Build + publish to GitHub Pages (the ONLY workflow)
```

> The v2.0 `scripts/*.mjs` and the `scrape-data.yml` / `update-app.yml` workflows were **deleted in PR #5** (`ff1926f`). They are gone from the tree — do not expect them.

## Build, Test, Run

| Goal | Command |
|---|---|
| Dev server | `npm run dev` (Vite, http://localhost:5173/) |
| Production build | `npm run build` (runs `tsc -b && vite build`) |
| Lint | `npm run lint` (ESLint, must be green to merge) |
| Local preview of prod build | `npm run preview` |
| Unit tests | `npm run test:run` (Vitest — hook + lib unit tests; 41 as of 2026-05-31) |
| E2E tests | (none yet) |

Build gotchas:

- **`tsc -b` runs FIRST in `build`** — TypeScript errors fail the build. Don't push past tsc by skipping it.
- **Dev server must run in tmux per Adnan's session-hook setup**: `tmux new-session -d -s dev "npm run dev"` and `tmux attach -t dev` to view logs. A plain `npm run dev` background gets blocked by the harness pre-bash hook.
- **GitHub Pages base path is `/`** (custom domain `yieldscope.clauding-lab.com`). Set in `vite.config.ts` (`base: '/'`) and the PWA manifest (`start_url` / `scope`). `src/main.tsx` derives its `BrowserRouter basename` from `import.meta.env.BASE_URL`, so it auto-follows `base` — don't hardcode it. See landmine 5.

## Release flow

- Push to `main` → `.github/workflows/deploy.yml` triggers → builds with `npm run build` → publishes `dist/` to GitHub Pages (served at `yieldscope.clauding-lab.com` via the `public/CNAME`).
- No tag-based releases. No semantic versioning enforced beyond `package.json`'s `version` field.
- `deploy.yml` is the **only** workflow. The v2.0 `scrape-data.yml` / `update-app.yml` were deleted in PR #5.

## Coding style

- **TypeScript:** `npm run lint` (ESLint with `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`). No Prettier configured — match existing file style.
- **Imports:** relative paths from `src/` root via `@/` alias (set in `vite.config.ts` and `tsconfig.json`) where helpful; otherwise relative.
- **Components:** named function exports; default exports only for lazy-loaded page modules.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, etc.) with optional scope. Imperative mood. **No `Co-Authored-By: Claude` lines** — attribution is disabled globally; do not re-add.
- **Files:** keep modules focused; ~400 lines typical, 800 max. The largest legitimate file is `src/styles/globals.css` (~500 LOC, the design system).

## Key conventions

Shape rules that govern HOW code/configs/data are named, structured, and wired together in this repo. A fresh AI agent should follow these without re-discovering them.

- **Currency symbol is `৳`** (Bangladeshi Taka, U+09F3). Never `Tk`, never `BDT`, never `₹` (Indian Rupee). This was fixed multiple times in v2.0 and is intentional.
- **Up = red, down = green for yields / inflation / call-money / CPI panels.** Use `invert` prop on `<Delta />` to express this. Inversion is intentional — markets convention for fixed-income (rising yields = bad for bondholders, rising inflation = bad for the system). Don't "fix" this.
- **Numbers use `tabular-nums` (`.serif-num` / `.num` class)** so digits align across rows. Don't render figures with default proportional fonts.
- **All time math in BDT (UTC+6).** When generating timestamps, label them BDT.
- **Theme palette is applied via `<html className>`** — `document.documentElement.className = 'theme-slate'` etc. (or empty string for Linen default). Set centrally by `ThemeProvider`; never set elsewhere.
- **Pages have separate Mobile and Desktop sub-layouts.** A page like `src/pages/Yields.tsx` exports a default that switches on `useIsDesktop()` at `>= 1024px`. Mobile uses tab-style segmented controls; desktop uses multi-column grids. They are intentionally not collapsed into a single responsive component because the IA differs.
- **Page chrome (header + nav) comes from `AppShell`, not from individual pages.** Mobile gets `<MobileHeader />` + floating `<BottomNav />`. Desktop gets `<DesktopSideNav />` + each page renders its own `<DesktopHeader section="..." breadcrumb="..." />` at the top of its desktop layout.
- **All charts are hand-rolled SVG.** No `recharts`, no `lightweight-charts`, no `d3-*`. If a chart shape is needed that doesn't exist, add it to `src/components/charts/` as a new `.tsx` file with the same SVG-and-CSS-variables pattern.
- **Live data seam is the per-domain hooks** (`src/hooks/use*.ts`) reading Supabase through `src/lib/econdelta.ts` (+ `src/lib/auctions.ts` for the row-shaped auction tables). Pages call these hooks. The EconDelta swap (SHIPPED, PRs #10–#17) replaced the old single-file `FX` seam. `src/data/fixtures.ts` (`FX`) survives only as the fixture fallback (yield curve + Demo panels) — do NOT route new live data through it.
- **`Demo data` chip pattern:** when a panel has no live source yet (or renders fixture/synthetic data), attach `<DemoBadge />` next to the eyebrow label. Don't silently render fixture data as if it were live. For a shared component mounted in several places, prefer the `YieldCurve` pattern: the component renders its OWN honesty chrome (Demo badge in fixture mode, a "Live · 7 of 11 tenors …" coverage note in live mode) so every mount stays consistent automatically.
- **Font family is `Geist` (sans) and `Geist Mono` only.** No italics, no serif. The v2.0 design briefly used Instrument Serif italic and was rejected as "unprofessional" — don't reintroduce.
- **CSS custom properties drive everything visual** — colors, spacing, type — via `src/styles/globals.css`. Don't introduce Tailwind `text-slate-100` style classes for theming; they bypass the palette system.

## Known landmines (read before touching these areas)

Numbered, named, and specific enough to keep a fresh AI session from stepping on them again.

1. **`useTheme` hook lives in `src/theme/themeContext.ts`, NOT in `ThemeProvider.tsx`.** Splitting was required for the `react-refresh/only-export-components` lint rule (HMR can't fast-refresh a file that exports both components and non-components). If you co-locate them again, lint will fail. Same applies to `PALETTES` constant and `ThemeContext`.
2. **`useMediaQuery` does NOT call `setMatches(mql.matches)` inside `useEffect`.** State is initialized lazily via `useState(() => …)`; the effect only registers the `addEventListener('change', …)` listener. Adding the sync line back triggers `react-hooks/set-state-in-effect` (cascading-renders warning).
3. **`Donut` uses `reduce` for arc offset accumulation, not `let runningOffset` + `.map()`.** Mutation-in-render fails the `react-hooks/immutability` lint rule. If you add another chart with cumulative offsets, follow the `reduce<{...}>([...], (acc, seg) => …)` pattern.
4. **Empty `catch {}` blocks fail `no-empty`.** Add a brief comment in every catch: `} catch { /* localStorage unavailable */ }`. Empty catches without comments are a lint failure.
5. **GitHub Pages base path is `/`** (custom domain `yieldscope.clauding-lab.com`, pinned by `public/CNAME`). Set in `vite.config.ts` (`base: '/'`) and the PWA manifest (`start_url` / `scope`). `src/main.tsx` derives its `BrowserRouter basename` from `import.meta.env.BASE_URL`, so it auto-follows `base` — do NOT hardcode a basename. The dev server serves at **`http://localhost:5173/`** (NOT `/YieldScope/`). Migrated from the old `/YieldScope/` project-pages path in PR #5 — if you see `/YieldScope/` anywhere, it's stale.
6. **PWA `theme_color` / `background_color` must match the `:root` background of the default palette** (Slate, `#14171C`). Set in `vite.config.ts` PWA manifest AND `index.html` `<meta name="theme-color">`. If you change the default palette, update both.
7. **No AI / Anthropic SDK in client code (yet).** v2.0 had `dangerouslyAllowBrowser: true` with a hardcoded model ID (`claude-opus-4-6`, which doesn't exist) — every call silently 404'd for 2+ months. v3.0 deliberately drops the SDK. If AI features re-enter scope, do it behind a server-side proxy and centralize the model ID in ONE place.
8. **No `process.exit(0)` on errors in scripts.** v2.0 scripts swallowed every failure with exit-0, masking errors from CI. Use `process.exit(1)` (or just throw) so failures show as red in GitHub Actions.
9. **RETIRED (2026-07-09) — the stale v2.0 files are GONE, not just disabled.** `scripts/*.mjs`, `.github/workflows/scrape-data.yml`, and `.github/workflows/update-app.yml` were **deleted in PR #5** (`ff1926f`); only `deploy.yml` remains. This landmine formerly warned not to revive them — there is nothing left to revive. All scraping/data work lives in EconDelta (the swap shipped, PRs #10–#17). Kept as a numbered tombstone so later landmine references don't shift.
10. **Admin password gates are forbidden.** v2.0 had `const ADMIN_PASSWORD = 'yieldscope2008$'` in `Header.tsx` — visible in View Source, security theater. v3.0 removed Settings entirely. If a settings UI is needed later, do it without any client-side "password" gate.
11. **Vite plugin order matters: `react()` BEFORE `tailwindcss()` BEFORE `VitePWA()`.** Reordering can break HMR or PWA precaching. The current order in `vite.config.ts` is correct.
12. **CSS `@import url(...)` for Google Fonts must come BEFORE `@import "tailwindcss"`** in `src/styles/globals.css`. Tailwind 4's import expands into rules, so a later `@import` violates the CSS spec ("@import rules must precede all rules"). The build warns about this; keep the Google Fonts import on line 1.
13. **`useId()` must have its `:` characters stripped before being used as an HTML `id` attribute.** SVG `<linearGradient id={…}>` rejects colons. Pattern: `const id = useId().replace(/[:]/g, '')`. See `Sparkline.tsx`, `AreaChart.tsx`.
14. **Lazy page imports use **default** export.** `App.tsx` does `lazy(() => import('./pages/Dashboard'))` which requires `export default function Dashboard()`. Don't switch pages to named exports without updating `App.tsx`.
15. **No silent fixture fallback. Live or `—`, never `?? 'literal'`.** When a hook returns null because EconDelta has no row yet, render `—` (or hide the chart/sub-element) — NEVER fall back to a hardcoded value. The v3.0 honesty pass (2026-05-28, PR #2) stripped 7+ silent fallbacks across Dashboard/Yields/Banking/Fiscal that were rendering hardcoded `'9.34'` / `'11.42'` / `'12.18'` / `'9.20'` / `'+76'` / `B.nplRatio` / `F.revenuePct` when EconDelta returned null. Same dishonesty class as v2.0's hallucinated macro pipeline, different mechanism. For non-live content that's intentionally placeholder, attach `<DemoBadge />` (the grey "Demo data" chip) so the reader knows it's not real. See `docs/econdelta-wishlist.md` for the tiered backlog of panels that should eventually become live.

16. **A fresh `as_of` in Supabase does NOT prove the value is fresh.** EconDelta's `aggregate` re-stamps the latest available snapshot with today's `as_of` on every run — so when its parse stage is down, daily metrics keep showing today's date while the value is days stale (a carry-forward). This actually happened 2026-05-25→05-29 (EconDelta's parse died on a sandbox `EROFS`; fixed). When auditing "is this panel actually live?", a today `as_of` is necessary but NOT sufficient — confirm EconDelta's parse cron is healthy (`run_logs` `source=parse status=ok`, or `econdelta.clauding-lab.com/runs`). This is the upstream cousin of landmine 15: a stale carry-forward can look just as live as a hardcoded fixture.

17. **Never pass raw float subtraction into `<Delta />` (or any verbatim-rendering display).** `Delta` renders `{value}` literally — no `toFixed`, no rounding — so `11.42 - 11.50` shows `↓ -0.08000000000000007`. Round computed numbers at the source with `roundTo(value, dp)` from `src/lib/yieldMath.ts` (2 dp for yields/rates/FX). This bit the Tier A hero deltas (Yields 91d/10y, Macro USD/BDT) — a 17-significant-digit delta is a "wrong-looking number" and fails the honesty bar. Same rule for any new component that prints a number verbatim.

18. **Don't render a live headline above an unbadged fixture/synthetic chart.** When a panel's headline goes live but its sparkline/trend stays a fixture (or is synthetic), the two contradict each other and silently imply a false trend — Banking C/D showed a live ~89.5% over a fixture chart that ended at the old hardcoded 81.4. Either gate the chart to render only with live history (the NPL `{nplHist && (…)}` pattern), or drop the chart. This is landmine 15 extended from single values to charts/deltas/sparklines. NOTE: `private_sector_credit` and `deposits_of_the_system` are flat daily carry-forwards (see #16), so a derived C/D history is a meaningless flat line — the C/D chart was dropped, not wired.

19. **An EconDelta metric's id is NOT its panel label — verify the semantic before wiring.** Two confirmed mismatches left as `<DemoBadge />` rather than mislabelled: (a) `bop_summary` is an LLM row-parse of BB's *entire* Balance-of-Payments table (`config/sources-v3.json` task "Entire Table") — its "BOP Summary" name most likely means the **Overall Balance** line, NOT specifically the Current Account; do not wire it to a "Current acct" panel. (b) `interbank_repo_data` is bank-to-bank **interbank** repo, NOT central-bank repo from BB; do not wire it to "Repo borrow from BB". When a metric's id/source is ambiguous, leave the panel demo and flag it — never relabel a real number into a slot it doesn't mean.

20. **Label a derived ratio by what it actually divides.** The Banking C/D headline is `private_sector_credit ÷ deposits_of_the_system × 100` (~89.5%) — that is NOT the regulated total-advances ADR/CDR. It is labelled "Pvt credit / deposits", NOT "Credit / Deposit · industry". Don't relabel an approximation as the regulated metric.

21. **Lagged monthly metrics must show their vintage.** M2 YoY (Feb), REER / import-cover (Mar), 2Y/20Y yields (Apr) lag "today" by 1–3 months. Render each with a compact vintage via `monthLabel(asOf)` from `src/lib/dates.ts` (e.g. "Feb '26") so a stale monthly print is never read as the current figure. Thread the metric's OWN `as_of` through the hook — the hook's top-level `asOf` is the daily anchor-metric's date and is wrong for a lagged monthly. `monthLabel` rejects partial dates so a malformed value can't fabricate a vintage.

22. **The header theme button cycles ALL palettes via `nextPalette()` — there is no separate picker.** `toggleTheme` calls `setPaletteState(nextPalette)` (themeContext.ts), which advances through every entry in `PALETTES` in order and wraps (Linen → Ivory → Slate → Linen). To add/remove a palette you must update SIX places together: the `Palette` type + `PALETTES` array + `nextPalette` order is implicit in array order (themeContext.ts), `readStoredPalette` validation + `THEME_COLORS` (ThemeProvider.tsx), the `.theme-*` block in `globals.css`, and the "N palettes" doc references in this file. Moss was pruned 2026-05-31 (it existed in the array but no UI reached it). Default stays Slate (out-of-scope to change). **Palette changes are a VISION.md sign-off item** — get explicit user approval. Linen's `cls` is `''` (the `:root` base), so selecting Linen sets `className=''`, not a `theme-linen` class.

23. **Never hardcode the dashboard "Today" date.** `Dashboard.tsx` shipped `kicker="Wednesday, 27 May"` and `breadcrumb="… · Wednesday"` as string literals — frozen, so they silently went stale (showed Wednesday 27 May on Sunday 31 May, drifting worse daily) on the product's most prominent date. Derive it: `todayLabel()` ("Sunday, 31 May") and `weekdayName()` ("Sunday") from `src/lib/dates.ts`, which use LOCAL date parts (the viewer's calendar day). Same hardcoded-label class as the CPI "April" / vintage issue (landmine 21) but for the live current date rather than a data vintage.

24. **Playwright `fullPage` screenshots capture a FALSE "Demo data" / loading state.** Expanding the viewport for a full-page capture remounts the data hooks into their initial loading + demo-fallback render, and the screenshot freezes that transient — so a fully-live page photographs as if every panel were demo. For visual QA use **viewport screenshots** (`fullPage` omitted) at a tall window after the fetch settles, and assert live values with `browser_evaluate` / text-waits, never from a `fullPage` image. (Also: localStorage palette changes don't reliably survive a `page.goto` full reload under automation because of the PWA service worker + the hardcoded `<html class="theme-slate">` in `index.html`; toggle via the in-app button or client-side nav instead. Real users navigate client-side, so this is an automation artifact, not a user bug.)

25. **`debt_gdp_ratio` conflates THREE series under one metric_id** — IMF annual ACTUALS (Dec-31 dated), IMF PROJECTIONS (future Dec-31), and one off-cycle MoF daily print. `fetchLatest` returns the furthest projection (wrong); the raw `fetchSeries` charts a sawtooth (the daily print dips between annual points — landmine 18). Wire via `selectDebtGdpActuals(series, now)` in `src/hooks/useFiscal.ts`: keep only Dec-31 rows dated ≤ today (drops projections + the off-cycle print), take the latest = the current actual. Adnan's chosen basis (2026-06-02) = the latest COMPLETE-YEAR actual (2025 = 42.0%). Flagged for EconDelta to split this into separate ids upstream — until then, do NOT use `fetchLatest` on this id.

26. **`crr_utilisation_pct` / `slr_utilisation_pct` are the MAINTAINED reserve ratios (% of deposits), NOT a 0–100 "utilisation of cap".** Live values ≈ CRR 5% / SLR 19% (vary daily). Despite `_pct`/`utilisation` in the id, render them as ratio levels ("CRR maintained 4.98% · of deposits"), never as a 0–100 bar — the pre-wire fixture's "CRR utilisation 92%" framing was wrong (landmine 20). `METRIC.CRR_UTIL`/`SLR_UTIL`; both are daily `metric_history`, not monthly.

27. **Auction data lives in ROW-shaped tables (`auction_results`, `auction_calendar`), NOT scalar `metric_history`.** Read via `src/lib/auctions.ts` (`fetchAuctionResults`/`fetchAuctionCalendar`) + `useAuctions` — do NOT add these to `METRIC`/`MONTHLY_METRICS` (those route `metric_history`). The pure mappers (`toAuctionDisplayRows`/`toUpcomingAuctions`) must NOT fabricate trends: a cutoff delta is computed only from a prior SAME-TENOR auction (null when none — currently one auction per tenor, so deltas are null), and the trend sparkline renders only with ≥2 real same-tenor cutoffs (landmine 18). The Fiscal issuance bar is now wired live from `auction_calendar` via `toWeeklyIssuance`/`useIssuance` (de-demo 2026-07-11): columns are dynamic, trailing all-zero weeks are trimmed, and the heading reads "next N weeks" — so it never overclaims the horizon the BB calendar actually covers.

28. **The Macro CPI-components heatmap keys columns by month name → React "duplicate key" console warnings (keys `May`/`Jun`) when the live CPI series repeats a month.** Pre-existing in `buildCpiHeatmapCols`/`monthsFromSeries` (`src/pages/Macro.tsx`); surfaced 2026-06-02. The "Core" heatmap row stays Demo regardless (no core-CPI EconDelta source). Fix when touched: dedupe/index the column keys, or investigate why the series returns repeating months. Not introduced by the Tier-2 wire.

29. **Panels REMOVED 2026-07-11 (de-demo batch) vs. panels that stay Demo BY DESIGN.** REMOVED (not demo — gone from the UI entirely): the LCR/NSFR tiles (Banking), Ways & Means + ADP (Fiscal — `non_nbr_tax_revenue`/`ways_means_usage_cr` never populated), the call-money intraday heatmap (Liquidity), the ALCO decision log (Intelligence), and the Fiscal revenue-split donut. The Banking repo tile is no longer demo either — it's relabeled **"Interbank repo · volume"** and wired live to `interbank_repo_data` (consistent with landmine 19: it was never central-bank repo, so "Repo borrow from BB" was the wrong label all along; SLF-draw/BB-repo themselves stay retired per EconDelta PR #62). What genuinely REMAINS Demo BY DESIGN — don't try to "wire" these: Banking NPL-by-segment + deposits-by-ownership donut + top-10-banks heatmap (no per-bank source), Fiscal-pressure composite gauge (methodology undefined), Core CPI (no source), offline curve/auctions fallbacks (no-credentials builds only). Backlog + rationale: `docs/econdelta-wishlist.md`.

## 30. Library/framework API calls → Context7 first

Before writing or editing code that calls a third-party library or framework API,
query **Context7** for current, version-pinned docs — do NOT rely on training-cutoff memory.

- **Flow:** `resolve-library-id` (name → `/org/project` ID) → `query-docs` (PIN the version this repo ships, e.g. `/reactjs/react.dev/v19`).
- **Applies to:** `react` / `react-dom` 19 (hooks, `useId`, `lazy`/`Suspense`, concurrent rendering), `react-router-dom` 7 (lazy routes, `BrowserRouter` `basename`, data APIs), and `@supabase/supabase-js` 2 (query builder, `.from().select()`, filters, realtime) — the EconDelta data seam.
- **Skip for:** business/domain logic, general programming concepts, or libraries Context7 does not index.
- **Query specifically:** library + version + exact task (e.g. `@supabase/supabase-js v2 select with .order() and .limit() on metric_history`), never one-word topics like "auth".

## 31. `fixtures.ts` scope after the de-demo batch

**`src/data/fixtures.ts` is curve + auctions (the two sanctioned offline fallbacks) ONLY.** The Fiscal/Banking/Intel/Liquidity page fixtures were removed 2026-07-11 (de-demo batch). A missing live value renders `—` + `<DemoBadge />` or an honest empty-state — never reintroduce page-level fixture objects.

## Communication & timezone

- **All times in BDT (UTC+6).** When generating timestamps, dates, or schedules, convert to BDT and label it.
- **Plain-English explanations** of technical terms in conversation, even obvious ones. Adnan reads but doesn't write code.
- **No emojis** in code or commits unless explicitly requested.
- **Short, scannable updates** — Adnan reads on mobile often.

## Out-of-scope behaviors

Do not, without explicit user sign-off:

- Delete or rewrite `.github/workflows/deploy.yml` (production deploy — the only workflow left).
- Add new dependencies to `package.json`.
- Re-introduce `@anthropic-ai/sdk`, `recharts`, `lightweight-charts`, `html-to-image`, `cheerio`, or `date-fns` (deliberately dropped in v3.0).
- Change the `/` base path or the `yieldscope.clauding-lab.com` custom domain (`vite.config.ts` base + PWA manifest + `public/CNAME` move together).
- Change the default palette away from Slate.
- Modify the currency symbol convention (`৳`) anywhere in source.
- Flip the up-is-red / down-is-green convention on yield / inflation / CPI panels.
- Modify CHANGELOG.md historical entries (no CHANGELOG yet — when added, treat historical entries as immutable).
- Run `git push origin v*` (no tagged releases configured).
- Run `git push --force` against any branch.
- Skip hooks (`--no-verify`, `--no-gpg-sign`, etc.).

For everything else, see `VISION.md` for what auto-merges vs needs sign-off.

## Cross-cutting rules

Adnan's global rules live in `~/.claude/CLAUDE.md` (loaded automatically by Claude Code). When that file conflicts with this one, this file wins because it's project-specific.
