# YieldScope

**A banker-grade Bangladesh ALCO Intelligence Platform** — a mobile-first PWA that helps treasury and Asset-Liability Committee (ALCO) teams at Bangladeshi banks read the government-securities curve, money-market liquidity, macro indicators, and fiscal pressure at a glance.

🌐 **Live:** https://clauding-lab.github.io/YieldScope/

---

## What it surfaces

Seven pages, each with separate mobile and desktop layouts:

| Page | Covers |
|------|--------|
| **Dashboard** | At-a-glance summary across all domains |
| **Yields** | Government-securities curve + T-bill / T-bond auction results |
| **Liquidity** | Money-market liquidity, repo/SDF/SLF corridor, call-money rates |
| **Macro** | CPI, FX reserves, balance of payments, USD/BDT, Brent |
| **Fiscal** | Revenue, ADP execution, debt/GDP |
| **Banking** | Sector health — NPL, CAR, repo borrowing |
| **Intelligence** | Editorial weekly note tying the signals together |

A deliberate convention runs through the rate/inflation panels: **up = red, down = green** (fixed-income markets read rising yields as tightening). That is intentional and not a bug.

## Data architecture

Live data comes from **[EconDelta](https://github.com/clauding-lab/econdelta)** — Bangladesh economic data pulled into a **Supabase** project (the same project that powers [The Brief](https://github.com/clauding-lab/the-brief)) and read client-side via an RLS-scoped, read-only anon key.

- `src/lib/econdelta.ts` / `src/lib/supabase.ts` — the live data seam.
- `src/data/fixtures.ts` — bundled fallback used when the Supabase env vars are absent (e.g. a local build with no key). Non-live panels are explicitly tagged so placeholder data is never presented as authoritative.

> This honesty discipline is load-bearing: a v2.0-era predecessor silently rendered AI-invented macro figures as real data. See `AGENT_LEARNINGS.md` for the full post-mortem.

## Tech stack

- **React 19** + **TypeScript 5.7** + **Vite 6**
- **Tailwind CSS 4** for styling; design system in `src/styles/globals.css`
- **React Router 7** (hash-free, `/YieldScope/` base path)
- **@supabase/supabase-js 2** for live data
- **vite-plugin-pwa** — installable, offline-capable PWA
- **Vitest 2** + Testing Library for the data-hook test suite
- **No chart library** — all charts are hand-rolled SVG primitives in `src/components/charts/`
- Typography: **Geist** + **Geist Mono**; four switchable palettes (Slate / Ivory / Linen / Moss) applied via `theme-*` classes on `<html>`
- Performance target: **≤ 100 kB gzip** total

## Project structure

```
src/
├── App.tsx                 Lazy routes + AppShell
├── main.tsx                ThemeProvider → ErrorBoundary → Router → App
├── pages/                  7 pages, each Mobile + Desktop layout
├── components/             charts/ (hand-rolled SVG) + primitives/ (design-system atoms)
├── hooks/                  Per-domain data hooks (useDashboard, useMacro, useYields, …)
├── lib/                    econdelta, supabase, econdelta-metrics, yieldMath, routes
├── data/fixtures.ts        Fallback data layer
├── theme/                  Palette types + ThemeProvider
└── styles/globals.css      Design system, palettes, typography
```

## Local development

Requires **Node 22+**.

```bash
npm install
npm run dev          # start the dev server
npm run build        # type-check + production build
npm run preview      # serve the production build locally
npm run lint         # ESLint
npm run test         # Vitest (watch)
npm run test:run     # Vitest (single run)
```

Without `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in the environment, the app runs on bundled fixture data and tags those panels accordingly.

## Deployment

Pushes to `main` are built and deployed to **GitHub Pages** automatically via `.github/workflows/deploy.yml`. Vite bakes the public `VITE_SUPABASE_URL` and the RLS-scoped `VITE_SUPABASE_ANON_KEY` (from a repo secret) into the static bundle at build time.

The base path `/YieldScope/` is set in three places that must always move together: `vite.config` `base`, the `BrowserRouter` basename, and the PWA manifest `start_url` / `scope`.

## Governance

This repo uses a three-document governance triad — read these before making changes:

- **`AGENTS.md`** — operational rules for AI coding agents, plus a running list of landmines.
- **`VISION.md`** — what ships merge-by-default vs. what needs sign-off.
- **`AGENT_LEARNINGS.md`** — dated incident reports (trigger / what went wrong / lesson / prevention).

There is **no authentication** in v3.0 by design, and no client-side password gates.

---

*Private project. v3.0 (2026-05) is a ground-up rebuild. Solo-developed; directed by Adnan via AI coding agents.*
