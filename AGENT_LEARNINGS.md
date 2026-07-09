# Agent Learning Rulebook — YieldScope

A running log of lessons learned the hard way while shipping YieldScope.

Different from `AGENTS.md` — that file documents **stable conventions and landmines** (the codebase is structured this way; don't break it). This file documents **incidents and lessons** (this is what went wrong, and here's how to prevent recurrence).

**Author:** AI agents under Adnan's direction. Appended on every incident; entries are point-in-time observations that may go stale but the lesson stays.

## How to add an entry

When something ships broken, when a methodology gap is exposed, or when a smoke test catches a real bug:

1. Write the entry below using the template.
2. If the lesson generalizes across Adnan's other projects, also append to the global rulebook at `~/.claude/AGENT_LEARNINGS.md`.
3. Save to AI auto-memory at `~/.claude/projects/-Users-adnanrashid-Projects-YieldScope/memory/` so future Claude sessions inherit.
4. If the lesson is a stable codebase rule, distill into a numbered `AGENTS.md` landmine.

## Entry template

```markdown
## YYYY-MM-DD — vX.Y.Z | Short title

**Trigger:** what surfaced the issue.

**What went wrong:** root cause in plain English; cite file:line if useful.

**Lesson:** the generalizable rule in one sentence.

**Prevention:** concrete steps (validator, smoke checklist, CI gate).

**Hotfix:** what shipped to resolve.

**Cross-references:** AGENTS.md landmine, auto-memory key, global rulebook entry.
```

---

## Entries (most recent first)

## 2026-07-09 — v3.0 | Excess-liquidity label understated by 100× ("k Cr" vs "lakh Cr")

**Trigger:** 2026-07-04 ecosystem review (two Opus 4.8 passes, live + Supabase reads). The Liquidity page rendered excess liquidity as "3.9 k Cr" — reads as ৳3,900 crore — when the live `excess_liquid_asset_total_minimum` is **385,992.24 BDT crore** (≈ ৳3.86 **lakh** crore, ~৳386,000 crore). A 100× understatement on an ALCO tool.

**What went wrong:** `useLiquidity.ts` divided the raw crore value by `CR_PER_KCR = 100000` — which is arithmetically the correct divisor for *lakh* crore (1 lakh crore = 100,000 crore), producing 3.86. But the constant, the field (`excessLiquidityKCr`), and the rendered unit label all said "**k**Cr" (thousand crore). "k" = 1,000; "lakh" = 100,000. The number 3.86 was right for lakh-crore; the label was wrong by 100×. Two render sites (mobile + desktop) plus two desktop BarChart thresholds (`threshold={150}`, warn `< 200`) were all calibrated to the old thousand-crore fixture scale, so the bug had four surfaces, not one.

**Lesson:** In BD-finance UIs, `k` (thousand) and `lakh` (100,000) are a 100× trap. A divisor can be numerically correct while the unit *word* attached to it is off by two orders of magnitude — the value looks plausible, so the error hides. Grep the whole class (constant name + field name + every render label + every threshold on that scale), not just the one number the reviewer pointed at.

**Prevention:**
- Name the unit in the identifier: `excessLiquidityLakhCr`, `CR_PER_LAKH_CR` — a mislabel becomes visible at the call site.
- Synthetic test fixtures mirror the real producer's magnitude (385,992.24 crore), not an idealized small number, so a unit-scale regression fails the assertion (`excessLiquidityLakhCr ≈ 3.86`).
- Thresholds carry their unit in the constant name (`EXCESS_LIQ_WARN_LAKH_CR`) and rescale together with the label.

**Hotfix:** Branch `fix/f1-liquidity-100x-label`: renamed constant/fields to `...LakhCr`; relabeled both render sites "k Cr" → "lakh Cr" (displayed number stays 3.9; the magnitude it communicates goes 3,900 → ~386,000 crore); rescaled the two BarChart thresholds ÷100 (warn `< 2.0`, ref line `1.5`) as named constants; BarChart `fmt` now shows one decimal (was `Math.round`, which collapsed every ~3.86 bar to "4"). Test mock updated to the real producer magnitude. Gate green (lint 0, tests, tsc 0); verified live at 375px + 1440px (reads "3.9 lakh Cr", zero "k Cr" on the page). **Merge gated on Adnan's confirmation of the corrected magnitude** (VISION currency/data-seam sign-off).

**Cross-references:** Handoff F1 (`docs/handoff/2026-07-04-review-fixes.md`). AGENTS.md currency conventions. Engineering-discipline rule 2 (fixtures mirror the real producer).

---

## 2026-05-31 — v3.0 | Playwright `fullPage` screenshot photographed a live page as all-"Demo data"

**Trigger:** Post-HTTPS visual smoke of the live site. A `fullPage` screenshot of the Dashboard showed the demo hero copy, "Demo data" badges on every panel, and empty metric tiles — even though a `browser_evaluate` taken seconds earlier on the same load reported fully live values (91d 10.15%, the live briefing, FX 35.1bn). The two contradicted each other.

**What went wrong:** Playwright expands the viewport to capture a full-page screenshot. That viewport change remounts the React data hooks into their initial loading state, which renders the demo fallbacks (with `<DemoBadge />`) and skeleton dashes — and the screenshot froze that transient. The settled, user-visible state was live the whole time; the console showed zero fetch errors. Nearly logged a false P0 "live site fell back to demo" alarm.

**Lesson:** For visual QA of this app, a `fullPage` screenshot is unreliable — it captures a loading/demo transient, not what users see. Use viewport screenshots after the fetch settles, and assert live values with `browser_evaluate` / text-waits, not from a `fullPage` image.

**Prevention:**
- Viewport screenshots (omit `fullPage`) at a tall window (e.g. 1440×1500); scroll if needed. Confirmed live again via viewport capture (same load) — the demo state did NOT recur.
- Verify "is this live?" with `browser_evaluate` reading the DOM text + a bad-token scan (`NaN`/`undefined`), and `browser_wait_for` on the expected value.
- Related: localStorage palette changes don't reliably survive a `page.goto` full reload under automation (PWA service worker + hardcoded `<html class="theme-slate">`); toggle via the in-app button instead. Real users navigate client-side, so this is an automation artifact, not a user bug.

**Hotfix:** No code change (false alarm averted). Codified as AGENTS.md landmine #24. Cross-cutting QA lesson → promoted to global rulebook + auto-memory.

**Cross-references:** AGENTS.md landmine #24. Global `~/.claude/AGENT_LEARNINGS.md`. Auto-memory `reference_playwright_fullpage_demo_artifact`. Related: a prior session read the HTTPS failure as "000 = no connection" when the real error was `curl (60)` cert-name-mismatch (GitHub served its `*.github.io` fallback because the Let's Encrypt cert hadn't issued) — same "observe the real error before inferring" lesson (working principle 10).

---

## 2026-05-31 — v3.0 | Smoke caught a hardcoded stale date + a second float-delta leak (landmine 17 recurrence)

**Trigger:** Visual smoke of the live deploy across all 7 pages + 4 palettes after the HTTPS cert went live.

**What went wrong:** Three real issues, none breaking:
1. **Hardcoded dashboard date.** `Dashboard.tsx` shipped `kicker="Wednesday, 27 May"` and `breadcrumb="… · Wednesday"` as literals — frozen, so on Sunday 31 May the product's headline date read "Wednesday, 27 May" and would drift worse every day.
2. **Float-precision leak (landmine 17 recurrence).** Macro → Commodity Exposure → Brent delta rendered `+0.350006103515625%` — a raw `brentHist[last] - brentHist[last-1]` subtraction passed verbatim to `<Delta />`. The Tier A pass fixed this class for the hero deltas with `roundTo()` but missed this demo-panel instance.
3. **Unreachable palettes.** `linen` + `moss` were in `PALETTES` but no UI control called `setPalette` (the toggle only flipped slate↔ivory) — 2 of 4 palettes were dead. Per Adnan: keep linen/ivory/slate reachable by cycling the toggle button; remove moss.

**Lesson:** A finding fixed "for the hero" isn't fixed everywhere — grep for the whole class (every verbatim-rendered computed number, every hardcoded date/label) when remediating. And dead code that looks like a feature (4 palettes, only 2 reachable) hides until something exercises it.

**Prevention:**
- Date: derive via `todayLabel()` / `weekdayName()` (`src/lib/dates.ts`, local date parts). Landmine #23.
- Floats: round every computed `<Delta>`/verbatim value at source with `roundTo(_, 2)`. Landmine #17 (reinforced). A page-wide regex `/-?\d+\.\d{4,}/` over `body.innerText` is a cheap smoke check for leaks.
- Palettes: toggle cycles all of `PALETTES` via `nextPalette()`; adding/removing a palette touches 6 places (landmine #22) and needs VISION.md sign-off.

**Hotfix:** PR `feat-palette-cycle-date-float-fixes` (branch off `main`, 2026-05-31): `dates.ts` helpers + tests; `Dashboard.tsx` derives the date; `Macro.tsx` `roundTo(brentDelta, 2)`; `themeContext.ts`/`ThemeProvider.tsx` 3-way `nextPalette()` cycle + moss removed; `.theme-moss` block dropped from `globals.css`; "Toggle theme" → "Cycle theme". Quality gate green (tests 47, lint, build) + verified on local preview (date = "SUNDAY"; cycle slate→linen→ivory→slate; Brent = `+0.35%`, no leaks).

**Deferred (not YieldScope code):** CRAR = 1.56% and NPL = 35.73% render live from EconDelta (`banking_sector_crar` / `gross_npl_ratio`) and also appear in the live briefing — EconDelta-side data-quality question, per `feedback_no_training_data_priors_for_local_metrics` deferred to Adnan/EconDelta. Pre-existing follow-ups confirmed still present: "Above repo" call-money hint, CPI "April" label.

**Cross-references:** AGENTS.md landmines #17, #22, #23. PR `feat-palette-cycle-date-float-fixes`.

---

## 2026-05-28 — v3.0 | Flagged correct EconDelta NPL data as anomalous based on training-data priors

**Trigger:** Live PostgREST smoke of the EconDelta swap returned `gross_npl_ratio = 35.73%` for 2026-05-28. The previous session's notes (composed by the assistant) flagged this as a likely "anomaly" because training-data knowledge of Bangladesh classified-NPL pointed to the 12–17% range. Adnan corrected on resume: EconDelta data is correct; the analysis was wrong.

**What went wrong:** The assistant treated a stale training-data prior (BB classified-NPL ~12–17% as of cutoff) as a fact-check against live data from a verified source pipeline. Bangladesh banking NPL methodology has shifted materially post-IMF EFF: broader inclusion of rescheduled + classified + written-off, SOCBs (state-owned commercial banks) being properly consolidated, and more honest reporting under the IFRS-9 push. The 35%+ figure reflects real current methodology. Flagging it as suspect put a false "credibility risk" in the session note that would have caused Adnan (or a future Claude) to spend time chasing a non-issue OR, worse, to second-guess accurate data in front of a banking audience.

**Lesson:** When live YieldScope/EconDelta data conflicts with my training-data knowledge, **trust the data and the domain expert**, not the training prior. Don't write "anomaly" verdicts into session notes based on what feels off relative to memory. The domain expert (Adnan, 15+ years IDLC SME) has current knowledge; my training data is stale by months-to-years on emerging-market specifics. This is principle 9 (User Sovereignty) and principle 10 (Show The Work) from `~/.claude/rules/common/working-principles.md` in action.

**Prevention:**
- Phrase surprising values as "is this the right metric / definition for the UI label?" — never as "this value looks wrong."
- Before writing an "anomaly" flag into a session note, explicitly identify the source of the prior (training data vs. a verifiable current document) and mark training-data priors as low-confidence.
- If a number genuinely needs verification before going in front of a banking audience, the verification path is: ask Adnan → if uncertain, point to BB's own published source → never assert from memory alone.
- For Bangladesh macro/banking data specifically, default to "EconDelta + Adnan are right." YieldScope renders faithfully; methodology fixes live on the EconDelta side.

**Hotfix:** None code-side (data was correct). The previous session note's "Open Question — NPL definition mismatch" is wrong as written. Promoting the broader lesson to global `~/.claude/AGENT_LEARNINGS.md` and to auto-memory as `feedback_no_training_data_priors_for_local_metrics`.

**Cross-references:** Global `~/.claude/AGENT_LEARNINGS.md` (2026-05-28 YieldScope entry). Auto-memory `feedback_no_training_data_priors_for_local_metrics.md`. Working principles 9, 10.

---

## 2026-05-28 — v3.0 | Six ESLint errors on first post-rebuild lint

**Trigger:** `npm run lint` after the ground-up rebuild produced six errors, all from `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`.

**What went wrong:** Modern React + lint tooling is opinionated about four things that aren't obvious until they bite:

1. **`react-hooks/set-state-in-effect`** — `useMediaQuery` was calling `setMatches(mql.matches)` synchronously inside `useEffect` to "sync if window resized between render and effect." Lint correctly flags this as a cascading-renders risk.
2. **`react-hooks/immutability`** — `Donut.tsx` used `let runningOffset = 0; const arcs = segments.map(seg => { …; runningOffset += len; … })`. Mutating a render-scope variable inside `.map()` is forbidden.
3. **`react-refresh/only-export-components`** — `ThemeProvider.tsx` co-exported the `ThemeProvider` component AND the `useTheme` hook + `PALETTES` constant. Fast Refresh requires a file to export EITHER components OR non-components, not both.
4. **`no-empty`** — two `catch {}` blocks in `ThemeProvider.tsx` (localStorage unavailability paths) tripped the lint rule, which expects either a binding or a comment.

**Lesson:** Plan for these patterns from the first file you write, not after the first lint pass. They're not preferences — they catch real bugs (stale state, mutation in render, HMR breakage, silent failures).

**Prevention:**
- `useMediaQuery`-style hooks: initialize state via `useState(() => …)` lazy initializer; only register listeners in the effect, never set state synchronously.
- Cumulative-offset computations: use `reduce<{ ... }>((acc, seg) => { …; acc.push(…); return acc }, [])`, never `let` + `.map()`.
- Co-locating hooks/constants with provider components: split into `Context.ts` (types, context, hook, constants) + `Provider.tsx` (provider component only).
- Empty catches: always include a brief comment — `} catch { /* localStorage unavailable */ }`.

**Hotfix:** All four patterns codified as AGENTS.md landmines #1–#4. Lint now green: `npx eslint .` exits with no output. Build green: `npm run build` in 769ms.

**Cross-references:** AGENTS.md landmines #1, #2, #3, #4. Session note `~/.claude/session-data/2026-05-28-v3-rebuild-session.tmp` "What Did NOT Work" section.

---

## 2026-05-27 — v2.0 → v3.0 | Auto-mode classifier blocked tracked-file deletion mid-rebuild

**Trigger:** During the ground-up rebuild, attempted to `rm -f .github/workflows/scrape-data.yml .github/workflows/update-app.yml` and `find scripts -type f -delete` — all stale files referencing the dropped v2.0 deps (`@anthropic-ai/sdk`, `cheerio`).

**What went wrong:** The auto-mode classifier blocked the deletion with: "Deleting pre-existing GitHub Actions workflow files (scrape-data.yml, update-app.yml) and scripts/ directory not created in this session — irreversible destruction of tracked files without explicit user authorization for these specific targets."

**Lesson:** This is the classifier doing its job — broad "rebuild the app from ground up" authorization does NOT extend to deleting tracked CI workflows or shared scripts. Those need explicit per-target sign-off because they affect deploy pipelines and history.

**Prevention:** When a rebuild requires deleting tracked CI / scripts / config that didn't originate in the current session, surface the list explicitly to the user and ask before deleting. Don't try to slip it into a parallel batch.

**Hotfix:** Left the stale files in place. Documented in AGENTS.md as known stale state (landmine #9) with explicit "do not try to revive them — work belongs in the EconDelta swap." Cleanup queued for a future session with explicit user sign-off.

**Cross-references:** AGENTS.md landmine #9 and out-of-scope behaviors list. Session note "Cleanup blocked" section.

---

## 2026-05-27 — v2.0 | AI model IDs invalid in 10 places; silent failure for 2+ months

**Trigger:** Repo review surfaced that the live ALCO brief on the deployed site was dated `2026-03-26T14:22:48Z` — over 2 months stale — even though "data: update auction results & analysis [automated]" commits had run regularly since then.

**What went wrong:** `claude-opus-4-6` was wired into 10 places: `src/services/aiService.ts:55,88`, `src/services/alcoBrief.ts:109`, `scripts/generate-ai-analysis.mjs:74,118,208,330`, `scripts/update-all-data.mjs:29`, `scripts/update-banking-data.mjs:59` (also `claude-sonnet-4-20250514` in older spots). **`claude-opus-4-6` doesn't exist** — valid current Opus IDs are `claude-opus-4-7` and `claude-opus-4-5`. Every AI call 404'd. Compounding: every script's error handler was `process.exit(0)`, masking the failure from CI. The cron commits since 2026-03-26 pushed empty diffs while the dashboard's "Updated daily by AI" caption stayed on Slate, lying about freshness.

**Lesson:** Two stable, generalizable rules:
1. **Model IDs in one place only.** Hardcoded model strings spread across 10 files is a recipe for silent rot. Centralize in a single `const MODEL_ID = 'claude-opus-4-7'` (or env var), import everywhere.
2. **`process.exit(0)` on caught errors is a code smell.** It's worse than no error handling — it lies to CI. Use `process.exit(1)` or just `throw`.

**Prevention:** v3.0 deliberately drops the Anthropic SDK from client code entirely. When AI features re-enter scope, do it behind a server-side proxy and centralize the model ID. Add a CI smoke test that calls the AI client with the configured model ID and fails red if the response is a 404.

**Hotfix:** Full Anthropic SDK dropped from `package.json` in v3.0. All AI services / scripts deleted (or stale-marked). Empty fixture data layer (`src/data/fixtures.ts`) replaces the broken hallucination pipeline until the EconDelta swap brings in real data.

**Cross-references:** AGENTS.md landmines #7, #8. v2.0 review session notes (this session's "Repo Review" section).

---

## 2026-05-27 — v2.0 | Hallucinated macro data presented as authoritative

**Trigger:** Repo review opened `scripts/update-all-data.mjs` and found a fundamental design flaw.

**What went wrong:** The "data update" script was not a data pipeline. It loaded the last snapshot from `public/data/macro_context.json`, fed Claude the prior values + a vague trend hint ("Bangladesh inflation has been 8-10%, reserves $33-36B, call money ~9.5-10%"), and asked for a "next snapshot." Claude **invented numbers** within the suggested ranges. The script then wrote them to the JSON file. The dashboard rendered them as authoritative figures (CPI 9.13%, FX reserves $35.1B, etc.) with no "AI-generated" label. For a banker-facing tool, this is a credibility catastrophe — the rendered numbers could be acted on (allocation decisions, position sizing) and were lies.

**Lesson:** AI-fill of numeric data is fundamentally incompatible with credibility on a tool that makes claims of authority. Either source real data, or label scenarios clearly so the user knows they're seeing a projection / placeholder.

**Prevention:** v3.0 introduces:
1. A clear data seam (`src/data/fixtures.ts`) with comments documenting "TEMPORARY — replace with EconDelta in Phase 3 of the swap plan."
2. The `<DemoBadge />` chip pattern (planned for Phase 4 of the EconDelta swap) for any panel without a real live source.
3. No AI-fill anywhere in the data pipeline. AI re-enters as a narrative / commentary layer ON TOP of real data, never as a numbers generator.

**Hotfix:** All hallucination scripts deleted (or stale-marked). `public/data/*.json` files (17 of them) deleted in the rebuild. Fixture data is now openly fixture data with intent to replace.

**Cross-references:** AGENTS.md landmines #7 (no AI SDK in client), #8 (no `process.exit(0)`). EconDelta swap plan, Phase 4 Task 4.2 (`<DemoBadge />`).

---

## 2026-05-27 — v2.0 | OpenWolf hooks registered but `.wolf/` never existed

**Trigger:** Session-start hook timing out / failing silently for ~3 weeks.

**What went wrong:** `.claude/settings.json` registered SessionStart, PreToolUse (Read, Write|Edit|MultiEdit), PostToolUse (Read, Write|Edit|MultiEdit), and Stop hooks all pointing at `node "$CLAUDE_PROJECT_DIR/.wolf/hooks/{session-start,pre-read,pre-write,post-read,post-write,stop}.js"`. The `.wolf/` directory never existed in this repo. Every session fired these hooks; they timed out at the configured 5s and were silently ignored. Project memory was never being persisted via the hooks.

**Lesson:** Hook configurations that reference missing files are dead weight — worse than no config, because they consume the timeout budget and obscure why memory isn't persisting. If a hook file can't exist (or the supporting tool isn't installed), strip the references.

**Prevention:** Before registering a hook in `.claude/settings.json`, verify the target script exists and the supporting tool is installed. If installing the tool is out of scope, don't register the hook.

**Hotfix:** All OpenWolf references deleted in v3.0 cleanup — `CLAUDE.md` (root, was OpenWolf bootstrap), `.claude/rules/openwolf.md` (the rules), `.claude/settings.json` (the orphan hooks), and `.claude/rules/` (empty dir). `grep -rin "openwolf|.wolf"` returns zero matches across all source + config.

**Cross-references:** Session note "OpenWolf removal" section.

---

## 2026-05-27 — v2.0 | Admin password as security theater

**Trigger:** Repo review opened `src/components/layout/Header.tsx` and found `const ADMIN_PASSWORD = 'yieldscope2008$'` as a string literal in client-side JS.

**What went wrong:** The admin password was hardcoded in the React component source. Anyone with DevTools could read it via View Source / Sources panel in 5 seconds. The minified production bundle still contained the string. The Settings page protected by this gate exposed the API-key entry box and an admin data-entry panel — gating it with a guessable password sourced from the bundle is no gate at all.

**Lesson:** Client-side "password" gates are security theater and worse than honest open access — they imply a level of protection that doesn't exist. If something needs real auth, do it server-side. If it doesn't need real auth, label it as such and don't pretend.

**Prevention:** v3.0 removes the Settings page entirely. If a settings UI is needed later (e.g., palette picker), no client-side password gates. Real auth means a server-side check (route gate by env, OAuth, etc.).

**Hotfix:** Settings page deleted in v3.0 rebuild. Header has no admin-gate modal. Codified as AGENTS.md landmine #10.

**Cross-references:** AGENTS.md landmine #10. Session note "C3" finding in the v2.0 review section.

---
