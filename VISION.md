# Vision

YieldScope is a banker-grade Bangladesh ALCO Intelligence Platform — a mobile-first PWA that helps treasury teams at Bangladeshi banks read the government-securities curve, money-market liquidity, macro indicators, and fiscal pressure at a glance. It should keep adding **calm, editorial signal** while preserving fast loads (≤ 100 kB gzip total), a single coherent native-feeling palette system, hand-rolled SVC charts (no chart-library aesthetic), and uncompromising honesty about what's real data vs placeholder.

The rules below scope what AI agents and contributors can ship without explicit sign-off.

## Merge by Default

- **Bug fixes** with a clear cause and bounded blast radius.
- **Lint, type, and build-error fixes** that don't change behavior.
- **Documentation, README, design notes, code comments.**
- **Small UI / UX tweaks** that don't change layout, copy, or behavior materially.
- **New tests**, including coverage for existing code (once Vitest is installed).
- **Logging additions** and small observability improvements (no PII / no secrets in logs).
- **New chart primitives** added to `src/components/charts/` as long as they follow the existing hand-rolled SVG + CSS-variable pattern and don't pull in a library.
- **New design-system atoms** added to `src/components/primitives/` that consume the existing CSS variables.
- **Extending an existing page's content** within the established Mobile/Desktop dual-layout pattern (e.g., adding another stat row to Macro).
- **Dependency patch-version bumps** — *except* React, Vite, TypeScript, Tailwind, react-router-dom, and `@supabase/supabase-js` (framework-level deps need scrutiny even on patches once added).

## Needs Sign-Off

- **New user-visible features** — any change to user-visible behavior beyond a bug fix.
- **Dependency additions** in `package.json` (deliberately minimal — be very thoughtful about what comes back).
- **Dependency minor or major bumps**, and any bump of: React, Vite, TypeScript, Tailwind, react-router-dom, vite-plugin-pwa, and (once added) `@supabase/supabase-js`, `vitest`.
- **Re-introducing dropped dependencies** — `@anthropic-ai/sdk`, `recharts`, `lightweight-charts`, `html-to-image`, `cheerio`, `date-fns` were dropped in the v3.0 rebuild for clear reasons; bringing any back is a real conversation.
- **Toolchain / runtime version changes** — Node major bumps, switching package managers, changing build target.
- **Broad refactors** that span > 1 module or touch the public seam (pages-to-fixtures import, pages-to-hooks once swapped, the design-system token names in `globals.css`).
- **Architectural changes** — new top-level dirs at repo root, new build steps, new long-running processes, anything that introduces server-side hosting (Vercel / Cloudflare Workers / etc.).
- **Release pipeline edits** — `.github/workflows/deploy.yml`, signing, publishing config.
- **Currency / locale changes** — anything that touches the `৳` symbol or BDT labeling.
- **Palette / theme system changes** — adding a palette, changing default palette, changing the `theme-*` className mechanism, changing `globals.css` CSS-variable names.
- **Up=red / down=green convention** on yield / inflation / call-money / CPI panels — this is deliberate (fixed-income markets convention) and not to be "fixed."
- **Data-seam changes** — replacing `src/data/fixtures.ts` is the planned EconDelta swap; modifications to its schema cascade to all pages.
- **GitHub Pages base path** — `/YieldScope/` is set in three places (vite.config base, BrowserRouter basename, PWA manifest start_url/scope) and must move together.
- **Adding any auth pattern** — there is intentionally no auth in v3.0. If an admin surface is needed later, no client-side password gates (see AGENTS.md landmine #10).
- **Privacy-impacting changes** — telemetry, network destinations, data storage locations beyond Supabase, log content with user-identifying data.
- **Anything that requires editing historical CHANGELOG entries** (when CHANGELOG.md is added).

## When in doubt

If a change could conceivably surprise the user, ask first. Cost of one extra question << cost of one bad surprise.
