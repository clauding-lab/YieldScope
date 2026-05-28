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
