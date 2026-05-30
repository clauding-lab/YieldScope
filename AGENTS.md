# AGENTS.md — YieldScope

Operational rules for AI coding agents (Claude Code, Cursor, Codex CLI, etc.) working in this repo. Read this in full before making any code change.

## What this project is

**YieldScope** is a banker-grade Bangladesh ALCO (Asset-Liability Committee) Intelligence Platform — a mobile-first PWA aimed at treasury teams at Bangladeshi banks. It surfaces government securities yields, T-bill/T-bond auctions, money-market liquidity, macro indicators (CPI, FX reserves, BoP), fiscal pressure (revenue, ADP, debt/GDP), and banking-sector health (NPL, CAR, repo borrowing). The app is a single-page React 19 + Vite + TypeScript application deployed to GitHub Pages at `/YieldScope/`. Charts are hand-rolled SVG (no chart library); typography is Geist + Geist Mono; design system uses 4 palettes (Slate / Ivory / Linen / Moss) applied via `theme-*` classes on `<html>`. Version 3.0 (2026-05-28) is a ground-up rebuild from a Claude Design package handoff — `src/data/fixtures.ts` is the temporary data layer until the EconDelta swap (see `docs/superpowers/plans/2026-05-28-econdelta-data-swap.md`).

Owner: solo dev (Adnan, Bangladesh, UTC+6). Vibe-coded — Adnan directs AI agents, does not hand-write code himself. All explanations, summaries, and prose should be in **plain English with technical terms briefly explained**, never assume Adnan reads code.

## Repository structure

```
.
├── src/
│   ├── App.tsx                       Lazy routes + AppShell wrap
│   ├── main.tsx                      ThemeProvider → ErrorBoundary → Router → App
│   ├── data/fixtures.ts              TEMPORARY data layer (FX) — EconDelta swap pending
│   ├── theme/
│   │   ├── themeContext.ts           Palette types, PALETTES, ThemeContext, useTheme hook
│   │   └── ThemeProvider.tsx         Provider component only (HMR-safe split)
│   ├── lib/
│   │   ├── routes.ts                 NAV_ITEMS, activeKeyForPath
│   │   └── hooks.ts                  useMediaQuery, useIsDesktop
│   ├── styles/globals.css            Full design system, 4 palettes, glass, typography
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
├── vite.config.ts                    Base `/YieldScope/`, PWA manifest, vendor-react chunk
├── package.json                      v3.0.0 — React 19 + Vite 6 + Tailwind 4 + react-router-dom 7
├── .github/workflows/deploy.yml      Build + push to GitHub Pages
└── scripts/, .github/workflows/scrape-data.yml, update-app.yml   STALE — left over from v2.0, slated for deletion (deps removed, would fail at runtime)
```

## Build, Test, Run

| Goal | Command |
|---|---|
| Dev server | `npm run dev` (Vite, http://localhost:5173/YieldScope/) |
| Production build | `npm run build` (runs `tsc -b && vite build`) |
| Lint | `npm run lint` (ESLint, must be green to merge) |
| Local preview of prod build | `npm run preview` |
| Unit tests | `npm run test:run` (Vitest — hook + lib unit tests; 41 as of 2026-05-31) |
| E2E tests | (none yet) |

Build gotchas:

- **`tsc -b` runs FIRST in `build`** — TypeScript errors fail the build. Don't push past tsc by skipping it.
- **Dev server must run in tmux per Adnan's session-hook setup**: `tmux new-session -d -s dev "npm run dev"` and `tmux attach -t dev` to view logs. A plain `npm run dev` background gets blocked by the harness pre-bash hook.
- **GitHub Pages base path is `/YieldScope/`** — set in BOTH `vite.config.ts` (`base`) and `src/main.tsx` (`BrowserRouter basename`). Changing one without the other breaks routing on the deployed site.

## Release flow

- Push to `main` → `.github/workflows/deploy.yml` triggers → builds with `npm run build` → publishes `dist/` to GitHub Pages.
- No tag-based releases. No semantic versioning enforced beyond `package.json`'s `version` field.
- The two workflows `scrape-data.yml` and `update-app.yml` are **stale** (depend on v2.0 deps that were removed); they should not run. Slated for deletion in a future cleanup session — requires explicit user sign-off because they're tracked files.

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
- **Data seam is `src/data/fixtures.ts`.** Pages import `FX` from this single file. The EconDelta swap (planned) replaces this file with hooks. Until then, all data lives in `FX`.
- **`Demo data` chip pattern (post-EconDelta-swap):** when a panel doesn't have a live source yet, attach `<DemoBadge />` next to the eyebrow label. Don't silently render fixture data as if it were live.
- **Font family is `Geist` (sans) and `Geist Mono` only.** No italics, no serif. The v2.0 design briefly used Instrument Serif italic and was rejected as "unprofessional" — don't reintroduce.
- **CSS custom properties drive everything visual** — colors, spacing, type — via `src/styles/globals.css`. Don't introduce Tailwind `text-slate-100` style classes for theming; they bypass the palette system.

## Known landmines (read before touching these areas)

Numbered, named, and specific enough to keep a fresh AI session from stepping on them again.

1. **`useTheme` hook lives in `src/theme/themeContext.ts`, NOT in `ThemeProvider.tsx`.** Splitting was required for the `react-refresh/only-export-components` lint rule (HMR can't fast-refresh a file that exports both components and non-components). If you co-locate them again, lint will fail. Same applies to `PALETTES` constant and `ThemeContext`.
2. **`useMediaQuery` does NOT call `setMatches(mql.matches)` inside `useEffect`.** State is initialized lazily via `useState(() => …)`; the effect only registers the `addEventListener('change', …)` listener. Adding the sync line back triggers `react-hooks/set-state-in-effect` (cascading-renders warning).
3. **`Donut` uses `reduce` for arc offset accumulation, not `let runningOffset` + `.map()`.** Mutation-in-render fails the `react-hooks/immutability` lint rule. If you add another chart with cumulative offsets, follow the `reduce<{...}>([...], (acc, seg) => …)` pattern.
4. **Empty `catch {}` blocks fail `no-empty`.** Add a brief comment in every catch: `} catch { /* localStorage unavailable */ }`. Empty catches without comments are a lint failure.
5. **GitHub Pages base path is `/YieldScope/`** — set in BOTH `vite.config.ts` (`base`) and `src/main.tsx` (`BrowserRouter basename`). Changing one without the other breaks routing on the deployed site. PWA manifest's `start_url` / `scope` also reference this path.
6. **PWA `theme_color` / `background_color` must match the `:root` background of the default palette** (Slate, `#14171C`). Set in `vite.config.ts` PWA manifest AND `index.html` `<meta name="theme-color">`. If you change the default palette, update both.
7. **No AI / Anthropic SDK in client code (yet).** v2.0 had `dangerouslyAllowBrowser: true` with a hardcoded model ID (`claude-opus-4-6`, which doesn't exist) — every call silently 404'd for 2+ months. v3.0 deliberately drops the SDK. If AI features re-enter scope, do it behind a server-side proxy and centralize the model ID in ONE place.
8. **No `process.exit(0)` on errors in scripts.** v2.0 scripts swallowed every failure with exit-0, masking errors from CI. Use `process.exit(1)` (or just throw) so failures show as red in GitHub Actions.
9. **`scripts/*.mjs`, `.github/workflows/scrape-data.yml`, `.github/workflows/update-app.yml` are STALE and DISABLED.** They reference removed deps (`@anthropic-ai/sdk`, `cheerio`) and will fail at runtime. Both workflows were disabled via `gh workflow disable` on 2026-05-28 (they were firing cron commits against `public/data/*.json` files that v3.0 deleted). Files remain in the repo pending explicit user sign-off to delete (tracked files). Don't try to revive them — the work belongs in the EconDelta swap.
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

## Communication & timezone

- **All times in BDT (UTC+6).** When generating timestamps, dates, or schedules, convert to BDT and label it.
- **Plain-English explanations** of technical terms in conversation, even obvious ones. Adnan reads but doesn't write code.
- **No emojis** in code or commits unless explicitly requested.
- **Short, scannable updates** — Adnan reads on mobile often.

## Out-of-scope behaviors

Do not, without explicit user sign-off:

- Delete `scripts/*.mjs`, `.github/workflows/scrape-data.yml`, or `.github/workflows/update-app.yml` (they're stale but tracked).
- Delete or rewrite `.github/workflows/deploy.yml` (production deploy).
- Add new dependencies to `package.json`.
- Re-introduce `@anthropic-ai/sdk`, `recharts`, `lightweight-charts`, `html-to-image`, `cheerio`, or `date-fns` (deliberately dropped in v3.0).
- Change the `/YieldScope/` GitHub Pages base path.
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
