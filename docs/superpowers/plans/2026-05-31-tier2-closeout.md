# Tier 2 close-out — EconDelta scrapers + YieldScope wiring

**Created:** 2026-05-31 · **Status:** blueprint (not yet executed) · **Owner:** Adnan (vibe-coded; directs AI agents)

## Objective

Close out **Tier 2** of the YieldScope EconDelta wishlist (`docs/econdelta-wishlist.md`): build ~14 structured-data items in the **EconDelta** data layer (`/Users/adnanrashid/Projects/clauding-lab/econdelta` — Python fetch→parse→aggregate into Supabase) and wire each into **YieldScope** (`/Users/adnanrashid/Projects/YieldScope` — Vite/React 19 PWA reading Supabase), retiring the `Demo data` pills panel-by-panel. The work spans two repos and many sessions; each step below is one PR, sized so a fresh agent can execute it cold from this document alone. Three wishlist items are explicitly **reclassified out** of Tier 2 (kept Demo / pushed to Tier 3) with a written rationale, because no clean public source exists or a "live" tile would be stale most of the year.

---

## Scope & non-goals

### BUILD (~14 items)

**Clean scalars / derived ratios (low risk):**
1. **Current account balance** — targeted row-select on the existing `bop_summary` BOP source (do NOT relabel the existing `bop_summary` scalar — build a NEW current-account row). Monthly, BD egress.
2. **CRR utilisation %** — derived ratio in the aggregate layer from the already-scraped CRR balance (`deposits_held_with_bb_crr`) and deposit base; no new fetch. Monthly.
3. **SLR utilisation %** — derived ratio from the already-scraped `excess_liquid_asset_total_minimum` + SLR base; no new fetch. Monthly.
4. **NBR revenue composition** — assemble from existing `nbr_vat_collected_cr` / `nbr_it_collected_cr` / `nbr_customs_collected_cr` + `non_tax_revenue`; add a Non-NBR-tax leg from MoF. Monthly.
5. **Debt/GDP (+ history)** — MoF Debt Bulletin PDF for the latest BD-official stock (BD egress) + IMF DataMapper JSON API for the multi-year history (NO egress). Quarterly.
6. **Domestic/external debt breakdown + IMF-EFF** — MoF Debt Bulletin stock split (BD egress) + IMF API for the EFF tranche (NO egress). Quarterly.

**Brittle / BB-PDF / per-print discovery (medium risk):**
7. **SLF draw** — usage-only (NO 'limit' field; SLF is uncapped-on-demand). Daily BB auction press release via latest-`rrpt`-id discovery + LLM extract. BD egress.
8. **BB central-bank repo** — usage-only, intermittent (BB largely stopped routine daily repo lending → many days zero/absent; handle null-safe). Same press release as SLF. Do NOT relabel `interbank_repo_data` (that is bank-to-bank). BD egress.
9. **Ways & Means usage** — usage-only (the Board-set 'limit' has no stable monthly cell). MoF/BB MET govt-finance table. Monthly. BD egress.
10. **BB 12-week issuance calendar** — multi-row parse of the same `auc_calendar` page `gsec_auction` already hits (currently collapsed to one scalar). Forward strip; horizon may be partially empty. BD egress.
11. **Recent-auctions results** — per-print bid / cover / WAM / cutoff. NEW structured storage required (see Hard Constraint 1). BD egress.

**Banking FSR clusters (medium risk, fan-out):**
12. **NPL by ownership segment** — SOCB / Private / Foreign / Specialised, 4 scalar metrics via fan-out. FSR PDF LLM table/chart extract. Quarterly. BD egress.
13. **System deposits by ownership** — SOCB / PCB / FCB / Specialised, 4 scalar metrics via fan-out. FSR / Scheduled Bank Statistics. Quarterly. BD egress.

**External provider (different source pattern):**
14. **LNG / Wheat / Palm-oil** — World Bank Pink Sheet (free, monthly). NO egress.

### RECLASSIFY OUT (do NOT build — mark Tier 3 / accept-Demo)

- **Intraday call-money hourly rates** → **Tier 3 (no public source).** BB publishes only end-of-day volume-weighted reference rates (DOMMR / BOFR); call money is OTC bilateral with no intraday tick feed. Daily granularity is the floor. *Action in S17:* relabel the Liquidity intraday heatmap as **"daily"**, or leave Demo with a note. Do NOT attempt an hourly scraper.
- **Core CPI (4th heatmap row)** → **accept-Demo (default).** BBS publishes General/Food/Non-food/Urban/Rural but no stable monthly "core" (ex food+fuel) cell; BB MPS references core ad hoc. *Option (not default):* approximate the 4th row with the already-live `non_food_inflation`. **Default = leave the core row Demo** with a one-line note; do not fabricate a "Core CPI" metric_id.
- **Industry LCR / NSFR** → **accept-Demo.** Only the (broadly annual) FSR publishes system LCR/NSFR, usually as a chart. A "live" tile would be stale most of the year and read as misleadingly current. Capital (CAR) is already live; leave the LCR/NSFR legs Demo. Do NOT build a low-cadence tile that masquerades as current.

### Out of scope entirely

- Top-10 per-bank Basel-III matrix; ALCO decisions log (both Tier 3, no public BD source).
- Any YieldScope palette / dependency / base-path change (VISION sign-off; not needed for this work except the auction structured-fetch path, see gates).
- The monthly backfill system (`metric_history_monthly`, `scripts/backfill_*.py`) — these are a separate namespace; this plan only touches the DAILY pipeline plus the existing monthly metrics already surfaced.

---

## Shared context (reusable reference for every step)

> Distilled from the three research recipes. Read this once; each step assumes it.

### A. EconDelta — add-a-metric (the canonical 8-step recipe)

Repo: `/Users/adnanrashid/Projects/clauding-lab/econdelta`. Python 3.11, venv at `.venv`. Everything keys off ONE entry in `config/sources-v3.json` (`indicators` list). Three orchestrators walk it: `fetch_all.py` (raw artifact → `data/_html/` or `data/_pdfs/`) → `parse_all.py` (deterministic parser + Sonnet sanity-check + LLM fallback in `parsers/hybrid.py` → `data/<id>/<date>.json`) → `aggregate_latest.py` (flatten → `data/latest.json` + upsert Supabase `metric_history`, seed `metric_definitions`).

1. **Config entry** in `config/sources-v3.json` `indicators[]`. Load-bearing fields: `id` (snake_case canonical `metric_id` AND data dir; tenor as suffix `_182d`; NEVER `_monthly` here), `name`, `domain` (`money_market`/`government_finance`/`macro`/`banking`/`food`), `cadence` (`daily`/`monthly`/`quarterly` → drives `aggregate_latest._is_fresh` staleness window), `fetch.type` (`html`|`pdf` — only two handled), `fetch.url`, `fetch.task` (machine-parseable AND human-readable — also fed to the LLM prompt and grepped for `page N`), optional `fetch.discover` (`latest_pdf_link` / `latest_article_link`) and `fetch.stealth:true` (Playwright for Akamai-walled BB PDFs), `parse.deterministic` (registry name), `parse.llm_prompt` (file in `claude_max/prompts/`), `parse.value_type` (`percent`/`amount_bdt_crore`/`amount_bdt_mn`/`amount_usd_bn`/`ratio`/`count`/... per `claude_max/validators.py:ValueType`), `parse.valid_range` `[lo,hi]` (authoritative gate), `anomaly_threshold` (fractional DoD tolerance, default 0.10).
2. **Reuse or write the parser** (`parsers/<name>.py`). Existing: `html_call_money`, `html_footer_ticker`, `html_table_row`, `dam_ticker`, `dse_sector_heat`, `pdf_component`, `pdf_table_column_latest`, `pdf_table_latest`, `pdf_table_row`, `pdf_table_total`. New parser shape: `@register("name")` class with `parse(self, artifact, instruction) -> ParseResult`; return `ParseResult(value=..., _parse_strategy="name")`, set `source_as_of` (a `datetime.date`) when recoverable so `metric_history.as_of` reflects true publication date; **raise `ParseError` on failure (never return None)** so hybrid falls through to LLM; lazy-import `pdfplumber`/`bs4` inside `parse()`.
3. **Register the parser in `parse_all.py`** import block (~lines 18–27): `import parsers.<name>  # noqa: F401`. **THIS IS THE #1 LANDMINE** — the `@register` decorator only runs on import; production builds `REGISTRY` from this explicit list; unit tests pass without it (they import the module directly) but production silently yields 0 rows (`"no parser registered for '<name>'"`). Guard: `tests/test_parser_registry_coverage.py` (subprocess) catches it — but there is NO CI, so run it yourself.
4. **LLM fallback prompt** `claude_max/prompts/<name>.txt` (copy `pdf_table_column_latest.txt`). `.format()` placeholders: `{indicator_name}`, `{instruction}`, `{value_type}`, `{valid_range}`, `{pdf_text}` or `{html_text}`. Must end demanding strict JSON `{{"value": <num-or-null>, "reason": "..."}}` (doubled braces literal).
5. **Aggregate wiring** (`aggregate_latest.py`) ONLY if The Brief consumes it or the parser returns a dict: `BRIEF_ALIASES` (~line 381, 1:1), `BRIEF_CONVERSIONS` (~line 441, `key:(source,mult)`), or `_flatten_dict_indicators` (~line 465 — dict → per-key scalars BEFORE the writer's scalar-only filter drops it; the `call_money_rate` precedent). For a plain new scalar consumed under its own id: nothing here. **No runtime-derived-ratio precedent exists:** there is NO `a/b*100` derived-key machinery — `_apply_brief_aliases` (lines 509-527) only does 1:1 aliasing, scalar unit-multiplication, and dict fan-out; the apparently-"derived" `tax_gdp_ratio`/`rev_gdp_ratio` are *scraped* percentage cells (`scripts/build_sources_v3.py:119-133`, `deterministic: pdf_table_row`), not computed. To compute a NEW ratio from existing scalars (S2's case), add an explicit computation step in `_build_v3_blocks` (line 245) writing the result into `data_additions` under its own id BEFORE the writer's scalar filter, seed its `metric_definitions` via `_build_definition_seeds`, and catalog it in `scripts/build_catalog.py:DERIVED_KEYS`. A value minted only in `_apply_brief_aliases` reaches `metric_history` but gets no definition seed.
6. **Supabase** — nothing for a scalar. `metric_history(metric_id, as_of, value numeric, source, ingested_at)`; writer (`utils/supabase_writer._rows_from_data`) keeps only int/float (drops bool/dict/list/str/None), service-role key, `on_conflict=metric_id,as_of`. `metric_definitions` auto-seeded idempotently. Do NOT touch `db/schema.sql` / `db/migrations/` (sign-off-gated, hits live project).
7. **Tests** `tests/test_<name>.py` (mirror `tests/test_pdf_table_column_latest.py`): helper tests on synthetic fixtures; integration tests gated with `@pytest.mark.skipif` on a probe file. Prefer extracted-text fixtures over committing PDFs >50KB.
8. **Regenerate catalog + verify** (commands in §"ED verify").

### B. EconDelta — the 8 landmines (priority order)

- **A. Forgot `import parsers.<name>` in `parse_all.py`** (recipe step 3). Silent 0-row; tests pass. THE canonical mistake. (AGENTS.md landmine 16.)
- **B. No backend CI.** The only GH Actions are `pwa-deploy.yml` (fires on `pwa/**`) and `stats-badges.yml` (badge regen) — **neither runs `pytest`/`ruff` on a backend PR.** So a cold agent must NOT wait for a green check on a backend PR — there is no check to go green; the PR will sit "no checks" forever. Run `pytest` + `ruff` + `tests/test_parser_registry_coverage.py` LOCALLY before every backend merge and treat that local pass as the gate. (AGENTS.md "Build, Test, Run".)
- **C. Writer silently drops non-scalars.** dict/list/str/None for an unknown id → warning + dropped → 0 rows. Fix: fan-out in `_flatten_dict_indicators`, or a new table+writer. (AGENTS.md landmine 8.)
- **D. Two parallel metric systems.** DAILY = `metric_history`/`metric_definitions` (ids from `sources-v3.json`); MONTHLY = `metric_history_monthly`/`metric_definitions_monthly` (ids `_monthly`, seeded by `scripts/backfill_*.py`). Don't mix namespaces. (AGENTS.md landmine 20.)
- **E. BB MEI page numbers shift edition-to-edition.** Prefer column-HEADER / label matching over absolute `page=N`. (`pdf_table_column_latest` does this.)
- **F. pdfplumber multi-line headers contain literal `\n`.** Normalize whitespace (collapse `\s+`, lowercase) before matching.
- **G. Don't strip `<script>` from BB HTML** in custom cleaners — BB injects table data into inline scripts. `hybrid._clean_html` strips only `style`/`noscript`.
- **H. NEVER set `ANTHROPIC_API_KEY`** anywhere — triggers pay-per-call billing. EconDelta is Max-OAuth only via `claude` CLI / `CLAUDE_CODE_OAUTH_TOKEN`. (AGENTS.md landmine 2.)

### C. EconDelta — verify commands ("ED verify")

```bash
cd /Users/adnanrashid/Projects/clauding-lab/econdelta && source .venv/bin/activate
pytest                                                          # MUST be green (no CI)
pytest tests/test_parser_registry_coverage.py                  # the import-block guard
ruff check . && ruff format .
python scripts/build_catalog.py > docs/indicator-catalog.md     # mandatory after sources-v3.json change; commit it
# dev-loop one indicator (local; works only for NO-egress sources off this Mac):
python fetch_all.py --only <id>
ECONDELTA_SKIP_SUPABASE=1 python parse_all.py --only <id> --skip-claude-preflight
ECONDELTA_SKIP_SUPABASE=1 python -m aggregate_latest
```
**BD-egress fetch/parse verification runs on ExonVPS Dhaka** (`adnan-local@103.187.23.22`, where the EconDelta cron runs), NOT this Mac — BB/BBS/NBR/MoF firewall non-BD IPs (live CAPTCHA wall confirmed). On the box: `ssh adnan-local@103.187.23.22 'cd ~/econdelta && git pull && source .venv/bin/activate && python fetch_all.py --only <id> && ECONDELTA_SKIP_SUPABASE=1 python parse_all.py --only <id> --skip-claude-preflight'` (one sudo per ssh — landmine 11). **No-egress exceptions** (verifiable on Mac): IMF DataMapper API, World Bank Pink Sheet.

### D. YieldScope — the 4-layer wire (per metric)

Repo: `/Users/adnanrashid/Projects/YieldScope`. Reverse-engineered from PR #10.

1. **Catalog** `src/lib/econdelta-metrics.ts`: add `NEW_METRIC: 'econdelta_metric_id'` under the right section comment. If MONTHLY, also add `METRIC.NEW_METRIC` to `MONTHLY_METRICS` (the ONLY routing switch — `tableFor()` in `src/lib/econdelta.ts` reads it; forgetting it makes a monthly metric query the wrong table and return null). `MetricId` type is derived; no type edit.
2. **Hook** `src/hooks/use<Page>.ts`: extend the `…Data` interface (`X: number | null`; for a lagged monthly add `XAsOf: string | null` for its OWN vintage; `XHist: number[]` if charting). Add `fetchLatest(METRIC.X)` (and `fetchSeries(METRIC.X, { limit: N })` for a sparkline) to the single `Promise.all` — keep destructure order aligned with call order. Map with `?? null` (NEVER a literal fallback); thread the metric's OWN `as_of` not the hook's top-level `asOf`. Derived ratio: guard both operands (`(a?.value != null && b?.value) ? ...`). Add a matching assertion in `src/hooks/use<Page>.test.ts`.
3. **Page** `src/pages/<Page>.tsx`: edit BOTH `…Mobile()` and `…Desktop()` sub-components. Replace fixture with `data?.X != null ? ... : '—'`; make `<DemoBadge/>` conditional `{data?.X == null && <DemoBadge/>}`; import `monthLabel` (`src/lib/dates.ts`) for vintage line on monthlies; `roundTo(x, 2)` (`src/lib/yieldMath.ts`) before any `<Delta>` / verbatim render; `spreadBps()` for spreads; gate sparklines on live history (`{data?.XHist?.length ? <Chart/> : null}`) or drop the chart; strip orphaned fixture subtitles ("+1.2% YTD", "cleared 26 May").

### E. YieldScope — landmines 15–21 (gate every wire)

- **15.** No silent fixture fallback — live or `—`; never `?? 'literal'`. Placeholder panels keep `<DemoBadge/>`.
- **16.** A fresh `as_of` does NOT prove freshness — `aggregate` re-stamps stale snapshots; confirm parse cron healthy (`econdelta.clauding-lab.com/runs`).
- **17.** `roundTo(value, dp)` before any verbatim-render component (`<Delta>` prints `{value}` raw → IEEE-754 noise).
- **18.** No live headline above a fixture/synthetic chart — gate or drop the chart.
- **19.** metric_id ≠ panel label — verify semantic. Confirmed traps: `bop_summary` ≈ Overall Balance (NOT Current Account); `interbank_repo_data` = interbank (NOT central-bank repo). Leave Demo if ambiguous; never relabel.
- **20.** Label a derived ratio by what it divides ("Pvt credit / deposits", not regulated ADR/CDR).
- **21.** Lagged monthlies show vintage via `monthLabel(ownAsOf)`.

Also **23** (never hardcode the dashboard "Today" date) and **24** (Playwright `fullPage` captures a FALSE Demo/loading state — use VIEWPORT screenshots after fetch settles; assert live values via `browser_evaluate`/text-waits).

### F. YieldScope — verify commands ("YS verify")

```bash
cd /Users/adnanrashid/Projects/YieldScope
npm run test:run          # Vitest hook+lib unit tests
npm run lint              # ESLint, must be green
npm run build             # tsc -b runs FIRST, then vite build — TS errors fail it
```
Visual QA: `tmux new-session -d -s dev "npm run dev"` (plain background `npm run dev` is blocked by the harness hook), then Playwright **viewport** screenshot at a tall window after the fetch settles (landmine 24), asserting live values via `browser_evaluate`. Post-deploy, re-check the live site `https://yieldscope.clauding-lab.com`.

### G. The three constraints that gate the whole plan (read first)

- **Scalar-only storage.** `metric_history` is numeric-only; `supabase_writer` drops dict/list payloads. Per-print auction RESULTS (6 rows × 7 fields) and 4-way clusters CANNOT be stored as a blob. Two routes: **(a) scalar fan-out** via `_flatten_dict_indicators` (no schema change; the call-money precedent — used here for the NPL/deposit 4-value clusters S10), or **(b) a NEW structured table + writer path** (`db/` change → VISION sign-off — used here for auction RESULTS S8). This storage decision is a FOUNDATION that gates S9 and S16.
- **BD egress + no CI.** BB/BBS/NBR/MoF firewall non-BD IPs → fetch/parse verified on **ExonVPS Dhaka**, not this Mac. No backend CI → `pytest`+`ruff` local before every merge. No-egress exceptions: IMF DataMapper, World Bank Pink Sheet.
- **Semantic traps.** `bop_summary` ≠ Current Account; `interbank_repo_data` ≠ central-bank repo — build NEW targeted metrics, never relabel.

---

## Dependency graph & parallelism

```
EconDelta scrapers (independent sources — parallel-safe across sessions):
  S1  current_account_balance      (bop row-select; BD egress)        ┐
  S2  CRR + SLR utilisation        (derived ratios; no fetch)         │
  S3  NBR revenue composition      (existing legs + MoF; BD egress)   │  all
  S4  Debt/GDP                     (MoF PDF + IMF API; hybrid egress) │  mutually
  S5  domestic/external + IMF-EFF  (MoF PDF + IMF API; hybrid egress) │  independent
  S6  Ways & Means usage           (MoF/BB MET; BD egress)            │  → any order,
  S7  SLF draw + BB repo           (rrpt discovery; BD egress)        │  parallel
  S10 NPL-seg + deposits-by-owner  (FSR fan-out; BD egress)           │  across
  S11 World Bank Pink Sheet        (LNG/Wheat/Palm; NO egress)        ┘  sessions

EconDelta structured-storage chain (serial):
  S8  auction_results table + writer  (schema; VISION SIGN-OFF)
        └──> S9  auction scraper (results rows + 12-wk calendar)   [S9 depends on S8]

YieldScope wiring (local, fast; each depends on its ED metric being LIVE in Supabase):
  S12 Liquidity  depends-on S2, S7
  S13 Fiscal     depends-on S3, S4, S5, S6
  S14 Macro      depends-on S1, S11
  S15 Banking    depends-on S10
  S16 Auctions   depends-on S8, S9   (NEW structured-fetch path in YS)

Close-out:
  S17 wishlist refresh  depends-on (ideally) S12-S16 done; can run partial
```

**Parallel-safe (different sources, different parser files):** S1, S2, S3, S4, S5, S6, S7, S10, S11 — run in any order, across sessions.
**Serial:** S8 → S9 (storage before scraper). {S8, S9} → S16. Each ED metric live before its YS step.
**Shared-edit hotspots (merge-coordination risk):** every ED step touches `config/sources-v3.json` (`indicators[]` append) and most touch the `parse_all.py` import block (~lines 18–27). These two files are the only shared-edit points — when running ED steps in parallel across branches, expect trivial append-conflicts there; resolve by keeping all entries (additive). No ED step deletes another's lines. `docs/indicator-catalog.md` is regenerated, not hand-merged — regenerate after each merge.

---

## Steps

> Every step is one PR on a feature branch (repo's #6–11 convention). Conventional Commits, **no `Co-Authored-By` lines**. Branch off `main`.

---

### S1 — EconDelta: current_account_balance

- **id:** S1 · **repo:** EconDelta · **depends-on:** none · **model tier:** default · **branch:** `feat/econdelta-current-account`

**Context brief.** The Macro page wants a Current Account Balance tile (currently hardcoded −2.8). EconDelta already fetches BB's full BoP table as `bop_summary` (`config/sources-v3.json:1615-1640`, `econdata/bop` HTML table, task "Entire Table", alternate `publictn/3/11` p.31) — but its single persisted scalar most likely means **Overall Balance**, NOT Current Account (AGENTS.md landmine 19a; YieldScope landmine 19). **Do NOT relabel `bop_summary`.** Build a NEW metric `current_account_balance` that row-selects the Current Account line out of the same source. Monthly cadence, BD egress (econdata/bop is behind BB's CAPTCHA wall). This is the easiest "new" Tier 2 item and doubles as the recipe shake-out + the reference VPS verify-loop for later steps. **Match `bop_summary`'s unit exactly:** `bop_summary` is `value_type: amount_usd_bn` with `valid_range: [-20.0, 20.0]` (`config/sources-v3.json:1616-1640`) — the BoP table is published in USD, and the existing sibling proves the unit is **billion, not million**. Set `current_account_balance` to `value_type: amount_usd_bn` and `valid_range: [-20.0, 20.0]` to stay unit-consistent (a USD-mn unit here would store a value 1000× off and break any cross-read against `bop_summary`, and would render wrong in YieldScope's S14 tile, which reads −2.8 as billion). BD's actual current-account deficit (≈ −6 to −7 bn FY24) sits comfortably inside `[-20.0, 20.0]`. Negative values valid (deficit); small `anomaly_threshold` is wrong for a sign-flipping series — use a generous one or omit.

**Tasks.**
1. Add `current_account_balance` entry to `config/sources-v3.json` `indicators[]`: `domain: macro`, `cadence: monthly`, `fetch.type: html`, same `url` as `bop_summary` (`econdata/bop`), `value_type: amount_usd_bn`, `valid_range: [-20.0, 20.0]` (match `bop_summary` — USD billion, NOT million), `fetch.task` naming the Current Account row explicitly ("the Current Account Balance line of the BoP table, in USD billion; negative = deficit"). Add the `publictn/3/11` p.31 PDF as an `alternate` block — but note `bop_summary`'s own alternate `task` is a bare page reference ("Go to page 31 of the doc"), which does NOT name a Current Account row; do NOT copy it verbatim. **Write a new alternate `task` that explicitly names the Current Account row** on that PDF page (e.g. "On page 31, the Current Account Balance row of the BoP table, USD billion, negative = deficit").
2. Reuse `html_table_row` if the row is cell-addressable; otherwise rely on the LLM fallback with a tight prompt. Prefer a deterministic row-label match over absolute index (landmine E). Do NOT strip `<script>` from BB HTML (landmine G).
3. If a new parser was written, add `import parsers.<name>  # noqa: F401` to `parse_all.py` (~lines 18-27) — **the #1 landmine.**
4. Add/point an LLM prompt in `claude_max/prompts/` (reuse an existing HTML prompt if shape matches; ensure it asks for the Current Account row, USD mn, negatives allowed).
5. Tests `tests/test_current_account*.py` on a synthetic BoP-table fixture; assert the Current Account number (not Overall Balance).
6. Regenerate `docs/indicator-catalog.md`.

**Verification.** ED verify (§C). Because BD-egress, run `fetch_all.py --only current_account_balance` + `parse_all.py --only ...` **on ExonVPS Dhaka** and confirm a numeric row distinct from `bop_summary`'s value. `pytest`, `pytest tests/test_parser_registry_coverage.py`, `ruff` local. Commit regenerated catalog.

**Exit criteria.** `current_account_balance` upserts a numeric row into Supabase `metric_history` (verifiable on the VPS run or via `econdelta.clauding-lab.com/runs`), with a value that is NOT identical to `bop_summary` (proves the row-select works).

**Rollback.** Revert the PR (single config + parser + prompt + test). No schema change; nothing to migrate down.

---

### S2 — EconDelta: CRR + SLR utilisation (derived ratios)

- **id:** S2 · **repo:** EconDelta · **depends-on:** none · **model tier:** default · **branch:** `feat/econdelta-reserve-utilisation`

**Context brief.** The Liquidity "Reserve utilisation" panel wants industry CRR-utilisation % and SLR-utilisation % bars. EconDelta already scrapes the absolute legs: `deposits_held_with_bb_crr` (CRR balance, BDT crore, BB MEI p.4, `config:1256-1276`) and `excess_liquid_asset_total_minimum` (SLR surplus over statutory minimum, BDT crore, BB MEI p.5, `config:1300-1320`), plus `deposits_of_the_system` (total system deposits, MEI p.3, `config:1158-1178`). These are LEVELS, not the ratios the panel needs. **There are two honest routes — pick one, do NOT invent a third (anti-pattern: hybrid that splits the difference):**
- **Route (a) — scrape the published maintenance %.** BB MEI p.4 (CRR) / p.5 (SLR) print the absolute *balance*; the scrapability research notes the % is derivable but is NOT necessarily printed as a maintenance-% cell. **Before committing to a scrape, confirm a maintenance-% cell actually exists on the MEI page** — if BB prints "CRR maintained: N%" / "SLR maintained: N%", add `crr_utilisation_pct` / `slr_utilisation_pct` as ordinary new `pdf_table_row` indicators in `config/sources-v3.json` (`value_type: percent`, header-match per landmine E), exactly like every other scraped MEI cell. This is the simplest path if the cell exists.
- **Route (b) — compute from the already-scraped scalars.** If no maintenance-% cell is printed, compute the ratio at runtime. **The real mechanism is NOT a brief-alias.** EconDelta has NO runtime `a/b*100` derived-key machinery: `tax_gdp_ratio`/`rev_gdp_ratio` are *scraped* cells (`scripts/build_sources_v3.py:119-133`, `deterministic: pdf_table_row`, `value_type: percent`) — BB/MoF print the percentage and EconDelta reads it; they are NOT computed ratios, so do NOT cite them as a division precedent (it will send you hunting for code that does not exist). `_apply_brief_aliases` (`aggregate_latest.py:509-527`) only does 1:1 aliasing + scalar unit-multiplication + dict fan-out — and a key minted only there lands in `metric_history` (the same `data` dict is passed to `upsert_metric_history`) but gets NO `metric_definitions` seed (`_build_definition_seeds:535` seeds only from `sources-v3.json` `indicators[]`). So for route (b) add an explicit derived-computation step in the snapshot-collection path of **`_build_v3_blocks` (`aggregate_latest.py:245`)** — after the CRR/SLR/deposit snapshots are loaded into `data_additions` and BEFORE the writer's scalar filter (`utils/supabase_writer._rows_from_data:83-122` keeps only int/float). Write the computed `crr_utilisation_pct` / `slr_utilisation_pct` as numerics into `data_additions` under their own ids; this lands them in `metric_history` via line 688's `upsert_metric_history(data=data, ...)`. CRR utilisation = CRR balance / required CRR (simplest honest form: held-vs-base where base ≈ `deposits_of_the_system`); SLR utilisation similarly. Because the exact statutory bases are policy constants that shift, **label the derived metric by what it actually computes** (YieldScope landmine 20 on the wiring side) and keep `value_type: percent`.

No new source → no BD egress for the fetch (route b inputs are already scraped); route (a)'s % cell rides the existing MEI fetch. Monthly cadence.

**Tasks.**
1. Decide route (a) vs (b) per the Context brief — confirm whether a maintenance-% cell exists on MEI p.4/p.5 first. **Route (a):** add `crr_utilisation_pct` / `slr_utilisation_pct` as standard new `pdf_table_row` indicators in `config/sources-v3.json` `indicators[]` (gets `metric_history` row + `metric_definitions` seed automatically via the normal recipe — register the parser per landmine A if new). **Route (b):** add the explicit derived computation inside `_build_v3_blocks` (`aggregate_latest.py:245`) writing the two numerics into `data_additions` under their own ids BEFORE the writer's scalar filter; then seed `metric_definitions` for both via `_build_definition_seeds` (it reads `sources-v3.json` `indicators[]`, so add lightweight config stubs for the two derived ids, or extend the seed builder to include them) so the catalog and Supabase definitions stay in sync. Do NOT mint the values only inside `_apply_brief_aliases` — that skips the definition seed. Do NOT cite `tax_gdp_ratio`/`rev_gdp_ratio` as a precedent (they are scraped cells, not computed ratios). For route (b), also register the two derived ids in `scripts/build_catalog.py:DERIVED_KEYS` (`build_catalog.py:42-45`), where genuinely-derived/cross-source keys are catalogued — not just regenerate the catalog.
2. Guard against null/zero denominators (return null, not a divide-by-zero) so a missing month doesn't emit a bogus 9999%.
3. `value_type: percent`, sensible `valid_range` (e.g. `[0, 200]` — utilisation can exceed 100% when excess is held).
4. Tests asserting the ratio math on synthetic inputs (held=X, base=Y → known %), including the null-denominator guard.
5. Regenerate `docs/indicator-catalog.md` (and `scripts/build_catalog.py` if derived keys need a catalog entry — landmine 15: never hand-edit the catalog).

**Verification.** ED verify (§C). The derived computation reads its CRR/SLR/deposit input snapshots from `data/<id>/<date>.json` — but `data/` is a **gitignored build artifact** produced by BD-egress MEI fetches on the VPS. On a fresh Mac checkout those snapshots are ABSENT, so `aggregate_latest` computes the ratio over empty inputs and emits `null` — which looks like a broken metric but is really just missing inputs, and will confusingly fail the exit criteria. So do NOT assume the derived metric is fully Mac-runnable: verify it **on ExonVPS Dhaka** (where fresh CRR/SLR/deposit snapshots exist after the MEI cron) OR against committed/synthetic fixtures (a `data/<id>/<date>.json` you stage by hand, or the unit-test fixtures from task 4). The *unit-test math* (task 4) is fully Mac-runnable; the *end-to-end `aggregate_latest` ratio* needs real snapshots. `pytest` + `ruff` local.

**Exit criteria.** `crr_utilisation_pct` and `slr_utilisation_pct` land as numeric rows in `metric_history` (verified on the VPS or against staged fixtures, NOT a bare-Mac `aggregate_latest` over absent snapshots), each between 0 and ~150%, null-safe when a base month is missing.

**Rollback.** Revert PR (aggregate + tests + catalog). No schema/migration.

---

### S3 — EconDelta: NBR revenue composition

- **id:** S3 · **repo:** EconDelta · **depends-on:** none · **model tier:** default · **branch:** `feat/econdelta-nbr-composition`

**Context brief.** The Fiscal revenue donut wants the NBR-tax / Non-NBR-tax / Non-tax composition (YTD). EconDelta already scrapes most legs: `nbr_vat_collected_cr` / `nbr_it_collected_cr` / `nbr_customs_collected_cr` (FYTD BDT crore, TBS news, `config:1008-1075`), `tax_revenue` (canonical NBR-tax total, BB PDF, `config:174-204`), and `non_tax_revenue` (`config:206-228`). **The gap is the Non-NBR-tax slice** (land registration, stamp/narcotics duty) — available in MoF Monthly Fiscal Reports (`mof.gov.bd` PDF, BD egress). NBR-tax components (VAT/IT/Customs) come from TBS which does NOT firewall (arguably no BD egress for that leg); the Non-NBR-tax + Non-tax legs from MoF DO need BD egress. Build a `nbr_non_tax_revenue` or `non_nbr_tax_revenue` metric for the missing leg; the donut is then assemblable downstream from the four existing-or-new scalars. **`non_tax_revenue` is already self-healing — do NOT pin a URL from scratch.** Its config entry has `fetch.type: "news"` with an empty `fetch.url`, but `fetch.type: "news"` is unsupported by `fetch_all._fetch_one` (only `html`/`pdf` dispatch; `news` logs "unsupported fetch.type" and yields nothing) — so the primary fetch is a no-op. It already carries an `alternate` block pointing at a real MoF PDF (`mof.gov.bd/pages/static-pages/6940329635ce18e1c055ef1a`, `type: pdf`, task "Page 9 of doc, table 4"), which is what actually does the work. The fix is to **promote that existing alternate to primary** (move the alternate's `url`/`type`/`task` into the primary `fetch` block as `type: pdf`) — OR teach `_fetch_one` a `news`→html path — NOT to research and pin a new URL.

**Tasks.**
1. Add a config entry for the Non-NBR-tax leg (`domain: government_finance`, `cadence: monthly`, MoF Monthly Fiscal Report PDF source, `value_type: amount_bdt_crore`). Reuse `pdf_table_row` / `pdf_table_column_latest` (header-match per landmine E) if the cell is addressable; else LLM fallback.
2. If a new parser, register it in `parse_all.py` import block (landmine A).
3. Fix `non_tax_revenue`'s dead primary fetch. Its `fetch.type: "news"` + empty `url` is a no-op (`_fetch_one` only dispatches `html`/`pdf`); the existing `alternate` MoF PDF (`mof.gov.bd/...6940329635ce18e1c055ef1a`, "Page 9 of doc, table 4") is doing the work. **Promote that alternate to primary** (move its `url`/`type:pdf`/`task` into the primary `fetch` block) so the indicator no longer relies on an unsupported type — OR add a `news`→html dispatch to `_fetch_one`. Do NOT pin a URL from scratch; the working source already exists in the `alternate` block. Note the change in the PR body; do not silently retire it.
4. Tests on a synthetic MoF fiscal-table fixture; assert the Non-NBR-tax number.
5. Regenerate `docs/indicator-catalog.md`.

**Verification.** ED verify (§C). MoF source = BD egress → verify fetch+parse on ExonVPS Dhaka. The TBS-sourced NBR legs already work. `pytest` + `ruff` local.

**Exit criteria.** The Non-NBR-tax metric lands a numeric row in `metric_history`; the four donut legs (NBR-tax total, NBR components, Non-NBR-tax, Non-tax) are all queryable.

**Rollback.** Revert PR. No schema/migration.

---

### S4 — EconDelta: Debt/GDP (+ history)

- **id:** S4 · **repo:** EconDelta · **depends-on:** none · **model tier:** default · **branch:** `feat/econdelta-debt-gdp`

**Context brief.** The Fiscal hero wants Debt/GDP + a multi-year history chart. EconDelta scrapes GDP (`config:1662-1683`) and borrowing FLOWS but NO debt STOCK and no ratio. Hybrid source: **latest BD-official print** from the MoF Finance Division **Debt Bulletin** (quarterly PDF on `mof.gov.bd`; FY25 = Tk21.44tn = 38.61% of GDP; BD egress — same publisher EconDelta already hits for budget OpEx/ADP). **History** from **IMF DataMapper** (`imf.org/external/datamapper`, JSON API, general-govt-debt/GDP series, **NO BD egress, no firewall**) — this is the easy part and verifiable on this Mac.

**Tasks.**
1. Add `debt_gdp_ratio` config entry (`domain: government_finance`, `cadence: quarterly`, `value_type: percent`, `valid_range` e.g. `[10, 100]`). Source = MoF Debt Bulletin PDF (BD egress). Parser: `pdf_table_column_latest` / `pdf_table_row` (header-match) or LLM fallback.
2. For HISTORY, add an IMF DataMapper fetch. IMF returns JSON, not HTML/PDF — and `fetch_all._fetch_one` dispatches ONLY `html`/`pdf` (verified: anything else logs "unsupported fetch.type" and yields nothing). **Pick the `scrapers/` one-shot pattern** — a standalone script under `scrapers/` (the home of `commodity_prices.py` / `dse_market.py`, which already run outside the `_fetch_one` dispatch), NOT a `fetchers/` helper (that dir holds discovery/download helpers `pdf_discovery.py`/`html_fetcher.py` that `_fetch_one` CALLS, not standalone JSON pullers) and NOT an edit to the shared `_fetch_one` dispatcher (that's a higher-blast-radius orchestrator change). S11's Pink Sheet leg uses the same `scrapers/` one-shot pattern — keep them consistent. The IMF script fetches the JSON, parses the general-govt-debt/GDP series, and writes the history. Decide where the history lands: if it's a short accumulated quarterly series, write `debt_gdp_ratio` quarterly prints to `metric_history` (surfaced via `fetchSeries`); if a longer multi-year back-series is wanted, seeding it into the monthly system is a namespace-boundary change (landmine D) → flag for sign-off (do NOT mix into `metric_history` as `_monthly` ids by accident). Recommend the short-accumulated-series default unless Adnan wants the deep back-series.
3. Register any new parser/fetcher (landmine A).
4. Tests: IMF JSON parse on a captured fixture (no egress, fully local); MoF PDF parse on a text fixture.
5. Regenerate `docs/indicator-catalog.md`.

**Verification.** ED verify (§C). IMF leg = no egress, verify on Mac. MoF leg = BD egress, verify fetch+parse on ExonVPS Dhaka. `pytest` + `ruff` local.

**Exit criteria.** `debt_gdp_ratio` lands a numeric row (latest ~38–40%); at least a short history series is retrievable for the chart.

**Rollback.** Revert PR. If the IMF history was seeded into the monthly system, note the seed rows to delete (one-off script) in the PR.

---

### S5 — EconDelta: domestic/external debt breakdown + IMF-EFF

- **id:** S5 · **repo:** EconDelta · **depends-on:** none (independent of S4, though both read the MoF Debt Bulletin — coordinate the shared PDF fetch) · **model tier:** default · **branch:** `feat/econdelta-debt-breakdown`

**Context brief.** The Fiscal page wants outstanding-debt STOCK split into Domestic / External plus the IMF-EFF tranche. EconDelta has only deficit-financing FLOWS (`domestic_borrowing_for_budget_deficit` `config:333-358`, `foreign_borrowing_for_budget_deficit` `config:306-331`) — wrong granularity (flow ≠ stock), and NO IMF-EFF metric. Source: MoF Debt Bulletin (same PDF as S4; FY25 external Tk9.49tn / domestic Tk11.95tn, cleanly tabulated) for the stock split (BD egress); IMF Country Reports / DataMapper API for the ECF/EFF/RSF disbursement+outstanding (NO egress).

**Tasks.**
1. Add `debt_domestic_stock_cr` + `debt_external_stock_cr` config entries (`domain: government_finance`, `cadence: quarterly`, `value_type: amount_bdt_crore`). MoF Debt Bulletin PDF. If S4 already added the Debt Bulletin fetch, reuse the same `fetch.url`/discovery and just add the row-select tasks (avoid double-fetching — coordinate via the shared `config/sources-v3.json` entry; this is a shared-edit hotspot).
2. Add `imf_eff_disbursed` (or similar) via the IMF API leg (no egress). Use the SAME `scrapers/` one-shot pattern as S4's IMF history script (a standalone script under `scrapers/`, mirroring `commodity_prices.py`/`dse_market.py` — NOT a `fetchers/` helper and NOT a `_fetch_one` dispatcher edit) — if S4 already added an IMF `scrapers/` script, extend it rather than duplicating the IMF client. Decide unit (USD mn) and document.
3. Register any new parser (landmine A). Reuse a `pdf_table_*` parser (header-match) for the stock split.
4. Tests on synthetic Debt Bulletin table + IMF JSON fixtures.
5. Regenerate `docs/indicator-catalog.md`.

**Verification.** ED verify (§C). MoF leg = BD egress → ExonVPS Dhaka. IMF leg = no egress → Mac. `pytest` + `ruff` local.

**Exit criteria.** `debt_domestic_stock_cr`, `debt_external_stock_cr`, and the IMF-EFF metric all land numeric rows; domestic + external roughly reconciles with the total debt behind S4's ratio.

**Rollback.** Revert PR. No schema/migration.

---

### S6 — EconDelta: Ways & Means usage

- **id:** S6 · **repo:** EconDelta · **depends-on:** none · **model tier:** default · **branch:** `feat/econdelta-ways-and-means`

**Context brief.** The Fiscal page wants Ways & Means Advances (WMA — BB overdraft to government) usage. The USAGE figure is published in BB Scheduled Banks Statistics / Economic Trends govt-finance tables and the MoF Debt Bulletin (CEIC sources it: Tk120,000mn Nov-2025 vs Tk90,924mn Oct-2025) — BD egress. The **LIMIT** is a Board-set ceiling announced ad hoc in monetary-policy circulars, with NO stable monthly cell → **build usage-only**; do NOT fabricate a 'limit' denominator. Render the tile as a usage level, not a "vs limit" gauge, until/unless a limit source is found.

**Tasks.**
1. Add `ways_means_usage_cr` config entry (`domain: government_finance`, `cadence: monthly`, `value_type: amount_bdt_crore`). Source = BB MEI (`publictn/3/11`) govt-finance table OR MoF Debt Bulletin. Header-match parser (landmine E).
2. Register any new parser (landmine A).
3. Explicitly note in the config `name` / PR body that there is NO limit field (usage-only).
4. Tests on a synthetic govt-finance table fixture.
5. Regenerate `docs/indicator-catalog.md`.

**Verification.** ED verify (§C). BD egress → verify fetch+parse on ExonVPS Dhaka. `pytest` + `ruff` local.

**Exit criteria.** `ways_means_usage_cr` lands a numeric usage row (no limit metric created — intentionally).

**Rollback.** Revert PR. No schema/migration.

---

### S7 — EconDelta: SLF draw + BB central-bank repo (usage-only, per-print discovery)

- **id:** S7 · **repo:** EconDelta · **depends-on:** none · **model tier:** default · **branch:** `feat/econdelta-slf-bbrepo-usage`

**Context brief.** The Liquidity reserve-util bars + the "Repo borrow · from BB" tile (currently hardcoded 124.6 kCr) want SLF drawdown and BB central-bank repo usage. Both are published in the SAME daily BB auction press release ("Result of the Auction of Repo, ALS, SLF, SDF and IBLF held on <date>") under `mediaroom/press_release_details/rrpt/<id>` — HTML page + attached PDF, one per business day, requiring a **latest-`rrpt`-id discovery** step (like the existing news_article_discovery pattern). Two hard realities: (1) SLF has **no published 'limit'** — it is uncapped-on-demand, so build **draw/usage-only**; (2) BB **largely stopped routine daily repo lending** (shifting to SLF/ALS) → on many days the Repo line is **zero or absent** — handle as null, do NOT carry a stale value or emit a fabricated zero as if it were a measured zero. **CRITICAL:** this is central-bank repo, distinct from the existing `interbank_repo_data` (bank-to-bank) — YieldScope landmine 19b forbids wiring the latter as BB repo, so the new metric must be unambiguously named (`bb_repo_usage_cr`, not `repo_*`).

**Tasks.**
1. Add `slf_draw_cr` + `bb_repo_usage_cr` config entries (`domain: money_market`, `cadence: daily`, `value_type: amount_bdt_crore`, `fetch.discover: latest_pdf_link` or an `rrpt`-id discovery variant). Mirror the news/auction discovery pattern in `fetchers/`.
2. Parser: LLM extract of the named rows ("SLF accepted amount", "Repo accepted amount") from the press release; null when a row is absent (BB stopped repo) — return `ParseError`/null cleanly, never a fabricated 0 (landmine C: a null is dropped, which is correct here; a measured 0 is different). Document the null-vs-zero distinction.
3. Register any new parser (landmine A).
4. LLM prompt asking for SLF + Repo accepted amounts, allowing null per row.
5. Tests on a captured press-release fixture: one with a Repo row (non-null), one without (null/absent) → asserts null-safe handling.
6. Regenerate `docs/indicator-catalog.md`.

**Verification.** ED verify (§C). BD egress → verify discovery + fetch + parse on ExonVPS Dhaka against a recent `rrpt` page. Confirm SLF non-null and BB-repo correctly null on a no-repo day. `pytest` + `ruff` local.

**Exit criteria.** `slf_draw_cr` lands a numeric row daily; `bb_repo_usage_cr` lands a numeric row when present and is cleanly absent (no stale carry-forward of a fabricated value) on no-repo days.

**Cross-step contract (for S12).** "Absent on a no-repo day" means EconDelta writes NO new `bb_repo_usage_cr` row that day — it does NOT write a null/zero. But YieldScope's `fetchLatest` (`src/lib/econdelta.ts:24-33`) orders `as_of desc, limit 1` and returns the most-recent EXISTING row, so on a no-repo day it returns the LAST repo row (possibly weeks old), NOT null. S12 MUST therefore apply an `as_of`-freshness guard (landmine 16) to render `—` instead of a stale carry-forward — see S12 task 2. Document the daily cadence + the "no row on no-repo days" behavior in the config `name`/PR body so S12 knows the freshness window to enforce.

**Rollback.** Revert PR. No schema/migration.

---

### S8 — EconDelta: structured auction storage (NEW `auction_results` table + writer) — SIGN-OFF

- **id:** S8 · **repo:** EconDelta · **depends-on:** none (foundation) · **model tier:** strongest (schema/architecture) · **branch:** `feat/econdelta-auction-results-storage`

**Context brief.** YieldScope's three auction panels need TWO structured shapes, not one. EconDelta's `metric_history` is **scalar-numeric-only** (`utils/supabase_writer.py:10-12, 111-122` drops every non-scalar; `db/schema.sql`). `ParseResult.value` already allows `dict` (`parsers/base.py:21`) but the writer + schema throw it away. The two shapes:
- **Auction RESULTS** — per-print `{date, tenor, size, bid, cover, wam, cutoff}`, ~6 rows × 7 fields per print (fed by S9's results scraper; consumed by YieldScope Panels A + B).
- **Auction forward CALENDAR** — the 12-week issuance strip: future `{date, tenor, notional}` rows with NO bid/cover/wam/cutoff (those don't exist yet for an un-held auction; fed by S9's `gsec_auction` multi-row extension; consumed by YieldScope Panel C, the Fiscal 12-wk strip). **This is a DIFFERENT shape from results** — forcing it into the results table would leave bid/cover/wam/cutoff null on every calendar row and blur "scheduled" vs "happened". **S8 must design BOTH tables under this one sign-off** so S9 never hits an un-signed-off `db/` change mid-execution. Two options for the RESULTS shape (the CALENDAR shape gets a parallel second table — see Tasks):
- **(a) Scalar fan-out** to per-tenor-per-field metrics (`auction_91d_cover`, `auction_91d_wam`, …) via `_flatten_dict_indicators` — no schema change, but 7 fields × ~6 tenors = ~42 metrics, unwieldy and it loses the row identity (which print, which date).
- **(b) NEW `auction_results` table** (`date, tenor, size, bid, cover, wam, cutoff`) + a dedicated structured writer path — clean, preserves row identity, but it is a `db/` change → **VISION sign-off required** (EconDelta VISION "Needs Sign-Off: db/schema.sql or db/migrations/"; also a new writer is a public-boundary change).

**Recommendation: option (b)** — the row-table is the honest shape and the fan-out gets unwieldy at 42 metrics with no date/print identity. This step is a FOUNDATION that gates S9 and S16. **Design BOTH the results table AND the forward-calendar table in this one migration / one sign-off** — the calendar leg (S9 task 2) is a distinct shape that S8's sign-off MUST cover, or S9 hits an un-signed-off `db/` change mid-execution (the "S8 gates S9" chain has a hole otherwise). **Present both options to Adnan and get explicit sign-off before writing the migration** (do not execute — recommend).

**Tasks (after sign-off on option b).**
1. Add `db/migrations/000X_auction_results.sql` with BOTH tables under one migration:
   - `auction_results(auction_date date, tenor text, size numeric, bid numeric, cover numeric, wam numeric, cutoff numeric, ingested_at timestamptz, PRIMARY KEY (auction_date, tenor))` — the per-print RESULTS shape.
   - `auction_calendar(auction_date date, tenor text, notional numeric, ingested_at timestamptz, PRIMARY KEY (auction_date, tenor))` — the forward 12-week CALENDAR shape (future date+tenor+notional, NO bid/cover/wam/cutoff). This is the second table the calendar leg needs; carving it here keeps S9 inside an already-signed-off `db/` surface. (If Adnan prefers, the calendar leg can be split into its OWN gate — but then S9's calendar task is BLOCKED on that separate sign-off; default is to cover both here.)
   - Both get RLS `service_role_all` for the writer + an `anon`-read policy (the PWA reads with the anon key — mirror the `metric_history`/anon-read split noted in EconDelta landmine 18; the PWA uses the shared Brief anon key).
2. Add a structured writer path in `utils/supabase_writer.py` (a new function, NOT shoehorned into `_rows_from_data` which is scalar-only) that POSTs row-tables with `on_conflict=auction_date,tenor` + merge-duplicates — generic enough to serve BOTH tables (or two thin wrappers).
3. Tests for the writer path (mock the POST; assert row shape + conflict key for both tables).
4. Regenerate `docs/indicator-catalog.md` if the catalog references the new tables.

**Verification.** ED verify (§C). Migration applied to the live Supabase project is sign-off-gated — confirm with Adnan before applying. `pytest` + `ruff` local. Confirm the writer round-trips a sample row-table into each table.

**Exit criteria.** Both `auction_results` and `auction_calendar` tables exist in Supabase with anon-read; the new writer successfully upserts a test row-table into each.

**Rollback.** Revert PR; **migration-down**: `DROP TABLE IF EXISTS auction_results;` and `DROP TABLE IF EXISTS auction_calendar;` (include the down-migration in the PR). No `metric_history` impact.

---

### S9 — EconDelta: auction scraper (results rows + 12-week calendar)

- **id:** S9 · **repo:** EconDelta · **depends-on:** **S8** · **model tier:** default (escalate to strongest if the per-print LLM extract proves fiddly) · **branch:** `feat/econdelta-auction-scraper`

**Context brief.** With S8's structured storage in place, build the scraper that feeds it. Two BB sources:
- **Results** (for Yields table + Dashboard list): per-auction RESULTS — accepted/bid → bid-cover, weighted-avg-yield (cutoff), WAM — published as BB press releases per auction day under `mediaroom/press_release_details/` (T-bill & BGTB result notices), summarized on `monetaryactivity/treasury`. CUTOFF yields are already captured as scalars (`bill_bond_rates`, `tbill_182d/364d`, `tbond_5y/10y`, `config:466-593`); bid/cover and WAM are the NEW fields, in the same press-release PDF → latest-`rrpt` discovery + multi-field LLM extract per print. Write per-tenor rows to `auction_results`.
- **Forward calendar** (for Fiscal 12-week strip): EconDelta already hits `monetaryactivity/auc_calendar` as `gsec_auction` (`config:765-784`) but collapses it to the single topmost notional. Extend to return ALL future weekly rows (per-tenor T-bill + BGTB) → a 12-week forward strip. Horizon varies (sometimes only 4–8 weeks firm) → handle partial/empty weeks gracefully. This is a multi-row parser change on an existing source, not a new source.

BD egress (CAPTCHA wall confirmed). Intermittent: not every business day has every tenor.

**Tasks.**
1. New scraper/parser producing per-tenor result rows → S8's structured writer (NOT `metric_history`). Reuse the `rrpt` discovery from S7 if shaped the same.
2. Extend `gsec_auction`'s parse (or add a sibling `auction_calendar` source) to emit the multi-row forward strip; write the rows to the **`auction_calendar` table created in S8** (date/tenor/notional) via S8's structured writer path — the storage shape is already signed off in S8, so this is NOT an undecided `db/` change. Keep the scalar `gsec_auction` working for any existing consumer.
3. Register new parsers (landmine A).
4. LLM prompts for the multi-field result extract.
5. Tests on captured press-release + calendar fixtures: assert per-tenor rows with all 7 fields; assert graceful partial-horizon handling.
6. Regenerate `docs/indicator-catalog.md`.

**Verification.** ED verify (§C). BD egress → verify discovery + fetch + parse on ExonVPS Dhaka against a recent results page and the live calendar. Confirm `auction_results` rows populate and the forward strip returns multiple weeks. `pytest` + `ruff` local.

**Exit criteria.** `auction_results` has recent per-tenor rows (date/tenor/size/bid/cover/wam/cutoff); the forward calendar yields a multi-week per-tenor strip.

**Rollback.** Revert PR. S8's table stays (separate PR); no `metric_history` impact.

---

### S10 — EconDelta: NPL-by-segment + deposits-by-ownership (FSR fan-out)

- **id:** S10 · **repo:** EconDelta · **depends-on:** none · **model tier:** strongest (FSR LLM chart/table extraction) · **branch:** `feat/econdelta-fsr-clusters`

**Context brief.** The Banking page wants NPL split by ownership (SOCB / Private / Foreign / Specialised) and the deposits-by-ownership donut. EconDelta has only the aggregates: `gross_npl_ratio` (system %, FSR p.13, `config:786-811`) and `deposits_of_the_system` (total, MEI p.3, `config:1158-1178`). The ownership splits live deeper in the BB FSR body / Banking-Sector-Performance releases, often as **charts or multi-column tables** → deterministic parse is brittle → LLM table/chart extract. Quarterly, BD egress. Each cluster is **4 values** → store via **scalar fan-out** through `_flatten_dict_indicators` (the call-money precedent; AGENTS.md landmine 8) → 4 scalar metrics each, NO schema change. **Pin the units now (cross-step contract with S15) — do NOT leave it "or share %":**
- **NPL: store as per-segment PERCENT** — `npl_socb_pct`, `npl_pcb_pct`, `npl_fcb_pct`, `npl_specialised_pct` (`value_type: percent`). NPL is inherently a ratio (bad loans ÷ that segment's loans), published as a %, so the segment value IS a percent; there is no "level" to store. (S15 renders these directly; no share computation.)
- **Deposits: store the 4 ownership LEVELS in BDT crore** — `deposits_socb_cr`, `deposits_pcb_cr`, `deposits_fcb_cr`, `deposits_specialised_cr` (`value_type: amount_bdt_crore`). **Store levels, NOT shares** — S15's donut computes the shares from the levels (null-safe) so they always sum to 100% and stay consistent with `deposits_of_the_system`. Storing pre-computed shares would (a) duplicate derivable data, (b) risk not summing to 100% if one leg is missing, and (c) lose the absolute crore figure. The unit suffix `_cr` makes the contract explicit on both sides.

**Tasks.**
1. Add config entries whose parser returns a 4-key **dict** per cluster: NPL as per-segment **percent**, deposits as **BDT-crore levels** (NOT shares — per the pinned units above; `value_type: percent` for NPL, `amount_bdt_crore` for deposits). FSR PDF source (BD egress). LLM extract of the 4-row ownership cluster.
2. Add fan-out branches to `_flatten_dict_indicators` (~line 465) exploding each dict into 4 per-segment scalars BEFORE the writer drops the dict (landmine C). Mirror the `call_money_rate` dict→`_1d/_7d/...` pattern.
3. Register new parsers (landmine A).
4. LLM prompts for the 4-row cluster extract (NPL %, deposit share/level), strict JSON dict.
5. Tests: parser returns the 4-key dict on a synthetic FSR-table fixture; `_flatten_dict_indicators` explodes it into 4 scalar rows each (assert all 8 land).
6. Regenerate `docs/indicator-catalog.md`.

**Verification.** ED verify (§C). BD egress → verify fetch+parse on ExonVPS Dhaka against a recent FSR. Confirm 8 scalar metrics (4 NPL + 4 deposits) appear in `metric_history`. `pytest` + `ruff` local.

**Exit criteria.** Four `npl_*_pct` and four `deposits_*` scalar metrics land as numeric rows; the NPL segments are plausibly ordered (SOCB highest).

**Rollback.** Revert PR (config + parsers + fan-out + prompts + tests). No schema/migration (fan-out reuses `metric_history`).

---

### S11 — EconDelta: World Bank Pink Sheet (LNG / Wheat / Palm-oil)

- **id:** S11 · **repo:** EconDelta · **depends-on:** none · **model tier:** default · **branch:** `feat/econdelta-pink-sheet-commodities`

**Context brief.** The Macro commodities mini-list wants LNG / Wheat / Palm-oil import benchmarks. BB publishes NO commodity import spot prices; EconDelta's existing commodity coverage is RETAIL DOMESTIC (`dam.gov.bd`). For international benchmarks use the **World Bank "Pink Sheet"** (free, **monthly**, **NO BD egress** — global data, no firewall). This is a NEW non-BB provider with a different source pattern from every existing EconDelta source. Metrics: `lng_price_usd`, `wheat_price_usd`, `palm_oil_price_usd` (units per the Pink Sheet — document each). **If this requires a new Python dependency** (e.g. an Excel reader for the Pink Sheet `.xlsx`), that is a **VISION sign-off item** (EconDelta VISION "Dependency additions") — prefer a no-dep path (Pink Sheet also offers CSV; or parse the published values via existing libs). Verifiable entirely on this Mac (no egress).

**Tasks.**
1. Add a new one-shot script under `scrapers/` for the World Bank Pink Sheet (CSV/Excel monthly) — the same `scrapers/` pattern as `commodity_prices.py`/`dse_market.py` and S4/S5's IMF script, NOT a `fetchers/` helper. If a no-dep CSV path exists, use it (avoids the dependency sign-off). Flag any new dep for sign-off BEFORE adding.
2. Add config entries `lng_price_usd` / `wheat_price_usd` / `palm_oil_price_usd` (`domain: macro` or a `commodities` domain, `cadence: monthly`, `value_type: amount_usd_*`). Note: `fetch_all._fetch_one` handles only `html`/`pdf` (verified) — so the Pink Sheet runs as the standalone `scrapers/` script from task 1, not through the `_fetch_one` dispatch.
3. Register any new parser (landmine A).
4. Tests on a captured Pink Sheet fixture (fully local, no egress).
5. Regenerate `docs/indicator-catalog.md`.

**Verification.** ED verify (§C). NO egress → verify fetch+parse on this Mac. `pytest` + `ruff` local. If a dep was needed, confirm sign-off was obtained.

**Exit criteria.** Three commodity metrics land numeric rows monthly.

**Rollback.** Revert PR. If a dep was added, remove it from `requirements.txt`/`pyproject.toml` in the revert. No schema/migration.

---

### S12 — YieldScope: Liquidity page wire (CRR/SLR util bars; SLF/repo tiles)

- **id:** S12 · **repo:** YieldScope · **depends-on:** **S2, S7** (live in Supabase) · **model tier:** default · **branch:** `feat/yieldscope-liquidity-wire`

**Context brief.** Wire the Liquidity reserve-utilisation panel + the "Repo borrow · from BB" tile to the new metrics: `crr_utilisation_pct`, `slr_utilisation_pct` (S2), `slf_draw_cr`, `bb_repo_usage_cr` (S7). Follow the 4-layer wire (§D) and landmines 15–21 (§E). Reframe the tiles honestly: SLF and BB-repo are **usage-only** (no 'limit' / no gauge denominator) — render as levels, not "vs limit" bars; BB-repo is **intermittent** → when stale on a no-repo day, render `—` (NOT a stale value, NOT the old hardcoded 124.6 kCr). Label CRR/SLR by what the ratio computes (landmine 20). **The null-vs-stale trap (landmine 16) — read before wiring BB-repo:** on a no-repo day S7 writes NO new `bb_repo_usage_cr` row, but `fetchLatest` (`src/lib/econdelta.ts:24-33`) orders `as_of desc, limit 1` and returns the most-recent EXISTING row, which can be WEEKS old. So `data.bbRepo != null` is NOT proof of freshness — without a guard the tile would render a stale carry-forward instead of `—`. The fix is an `as_of`-freshness guard in the hook (task 2).

**Tasks.**
1. `src/lib/econdelta-metrics.ts`: add `CRR_UTIL`, `SLR_UTIL`, `SLF_DRAW`, `BB_REPO`. None are monthly-table (S2 monthly cadence but in the daily `metric_history`; S7 daily) — confirm cadence vs `MONTHLY_METRICS` membership: S2 is monthly-cadence within the daily pipeline → it lives in `metric_history`, so do NOT add to `MONTHLY_METRICS` (that set is for the separate `metric_history_monthly` table — landmine D / YS econdelta.ts). Add to `MONTHLY_METRICS` ONLY if the metric was seeded into `metric_history_monthly`.
2. `src/hooks/useLiquidity.ts`: extend interface (`crrUtil`/`slrUtil`/`slfDraw`/`bbRepo` as `number|null`; surface each metric's OWN `*AsOf: string | null`, especially `bbRepoAsOf`); add `fetchLatest` calls to `Promise.all` (order-aligned); map with `?? null`. **Implement the `as_of`-freshness guard for BB-repo (landmine 16):** because `fetchLatest` returns the latest EXISTING row regardless of age, treat `bbRepo` as null when `bbRepoAsOf` is older than N days (BB-repo is daily-cadence — N ≈ 3–5 business days is a sane stale threshold; pick one and name it as a constant). Compute the age from `bbRepoAsOf` vs the dashboard "today" (NOT a hardcoded date — landmine 23); e.g. `const bbRepoFresh = bbRepoAsOf != null && daysBetween(bbRepoAsOf, now) <= BB_REPO_STALE_DAYS; const bbRepo = bbRepoFresh ? rawBbRepo : null;`. Add a small day-diff helper to `src/lib/dates.ts` if one doesn't exist (it currently exports only `monthLabel`/`weekdayName`/`todayLabel`). Apply the same pattern to any other intermittent daily metric if needed; CRR/SLR/SLF are regularly-published so a stale guard is optional for them.
3. `src/hooks/useLiquidity.test.ts`: assert live mapping + null fallback + **the BB-repo stale guard**: a `bb_repo_usage_cr` row with an `as_of` older than the threshold maps to `bbRepo === null` (renders `—`), while a fresh `as_of` maps through.
4. `src/pages/Liquidity.tsx`: in BOTH Mobile + Desktop — replace fixtures; conditional `<DemoBadge/>`; reframe SLF/BB-repo as usage-only levels; BB-repo `—` when the (guarded) value is null; strip orphaned fixture subtitles.

**Verification.** YS verify (§F): `npm run test:run`, `npm run lint`, `npm run build`. Visual: tmux dev server + Playwright **viewport** screenshot (landmine 24), assert live CRR/SLR/SLF values via `browser_evaluate`; confirm BB-repo shows `—` (not a stale carry-forward) when its latest `as_of` is beyond the stale threshold.

**Exit criteria.** CRR/SLR util bars + SLF tile render live values with vintage; BB-repo tile renders live-or-`—` via the `as_of`-freshness guard (a weeks-old latest row renders `—`, not the stale value); the relevant `<DemoBadge/>`s are gone (or remain only where null).

**Rollback.** Revert PR. Pages fall back to fixtures + Demo badges.

---

### S13 — YieldScope: Fiscal page wire (Debt/GDP, debt breakdown, W&M, NBR donut)

- **id:** S13 · **repo:** YieldScope · **depends-on:** **S3, S4, S5, S6** · **model tier:** default · **branch:** `feat/yieldscope-fiscal-wire`

**Context brief.** Wire the Fiscal hero + revenue donut + debt panels to: `debt_gdp_ratio` (+ history, S4), `debt_domestic_stock_cr`/`debt_external_stock_cr`/IMF-EFF (S5), `ways_means_usage_cr` (S6, usage-only), and the NBR composition legs (S3 + existing `nbr_vat/it/customs`, `tax_revenue`, `non_tax_revenue`). The 12-week issuance strip is S16, NOT here. Donut: build from the 4 revenue legs. W&M: usage level, no "vs limit" gauge. Debt/GDP: gate the history chart on live series (landmine 18) — if only one or two quarterly prints exist, drop the chart and show the scalar.

**Tasks.**
1. `src/lib/econdelta-metrics.ts`: add `DEBT_GDP`, `DEBT_DOMESTIC`, `DEBT_EXTERNAL`, `IMF_EFF`, `WAYS_MEANS`, `NBR_NON_TAX` (and reuse existing NBR ids). Mind `MONTHLY_METRICS` only if any was seeded into the monthly table.
2. `src/hooks/useFiscal.ts`: extend interface; add `fetchLatest`/`fetchSeries` (Debt/GDP history) to `Promise.all`; `?? null` mapping; derived donut shares computed null-safe.
3. `src/hooks/useFiscal.test.ts`: assert live mapping + null fallback + donut math.
4. `src/pages/Fiscal.tsx`: Mobile + Desktop — replace fixtures; conditional `<DemoBadge/>`; W&M usage-only; gate Debt/GDP history chart on live series; revenue donut from live legs (label by what each leg is); strip orphaned subtitles; `roundTo` any delta before `<Delta>`.

**Verification.** YS verify (§F). Visual: viewport screenshot, assert Debt/GDP + donut + W&M live via `browser_evaluate`.

**Exit criteria.** Debt/GDP hero, debt breakdown, W&M usage, and revenue donut render live; history chart shown only if live series exists; relevant `<DemoBadge/>`s gone.

**Rollback.** Revert PR.

---

### S14 — YieldScope: Macro page wire (current account tile; commodities)

- **id:** S14 · **repo:** YieldScope · **depends-on:** **S1, S11** · **model tier:** default · **branch:** `feat/yieldscope-macro-wire`

**Context brief.** Wire the Macro BoP "Current acct" mini-tile (currently hardcoded −2.8) to `current_account_balance` (S1) — NOT `bop_summary` (landmine 19a). Wire the commodities mini-list LNG/Wheat/Palm-oil to `lng_price_usd`/`wheat_price_usd`/`palm_oil_price_usd` (S11). Both monthly → show vintage via `monthLabel(ownAsOf)` (landmine 21). Negative current account is valid (deficit) — render the sign honestly.

**Tasks.**
1. `src/lib/econdelta-metrics.ts`: add `CURRENT_ACCOUNT`, `LNG`, `WHEAT`, `PALM_OIL`. These are monthly-cadence in the daily `metric_history` (S1, S11 write the daily table) — add to `MONTHLY_METRICS` ONLY if seeded into `metric_history_monthly`; otherwise leave out (confirm where S1/S11 actually wrote).
2. `src/hooks/useMacro.ts`: extend interface (`currentAccount`/`currentAccountAsOf`; `lng`/`wheat`/`palmOil` + their `AsOf`); add `fetchLatest` to `Promise.all`; `?? null` mapping threading each metric's own `as_of`.
3. `src/hooks/useMacro.test.ts`: assert live + null fallback + negative-value handling for current account.
4. `src/pages/Macro.tsx`: Mobile + Desktop — replace −2.8 fixture; conditional `<DemoBadge/>`; vintage via `monthLabel`; commodities list live; strip orphaned subtitles.

**Verification.** YS verify (§F). Visual: viewport screenshot, assert current-account (with correct sign) + 3 commodity values via `browser_evaluate`.

**Exit criteria.** Current-account tile + LNG/Wheat/Palm-oil render live with vintage; relevant `<DemoBadge/>`s gone.

**Rollback.** Revert PR.

---

### S15 — YieldScope: Banking page wire (NPL-by-segment, deposits donut)

- **id:** S15 · **repo:** YieldScope · **depends-on:** **S10** · **model tier:** default · **branch:** `feat/yieldscope-banking-segments`

**Context brief.** Wire the NPL-by-segment panel (+ slope chart) and deposits-by-ownership donut to the 8 fan-out scalars from S10: `npl_socb_pct`/`npl_pcb_pct`/`npl_fcb_pct`/`npl_specialised_pct` (per-segment **percent**, render directly) and `deposits_socb_cr`/`deposits_pcb_cr`/`deposits_fcb_cr`/`deposits_specialised_cr` (BDT-crore **levels**). Quarterly → vintage label. The industry NPL + CAR are already live; this adds the segment split. **The deposits donut MUST compute shares from the 4 crore levels** (`share_i = level_i / Σ levels`), not read pre-stored shares — S10 stores levels by contract. Make the share math **null-safe**: if any of the 4 levels is null, either drop the donut to Demo or compute over the present legs and label it partial (decide and document); never divide by a zero/partial sum that fabricates a 100%. NPL segments render as the stored percents directly (no share computation). Donut shares computed null-safe; slope chart gated on having all 4 NPL segments live (landmine 18).

**Tasks.**
1. `src/lib/econdelta-metrics.ts`: add the 8 segment metric ids (quarterly cadence; daily-table unless seeded monthly).
2. `src/hooks/useBanking.ts`: extend interface (4 NPL-percent + 4 deposit-crore-level fields + `AsOf`); add `fetchLatest` to `Promise.all`; `?? null` mapping; **compute the donut shares from the 4 crore levels** (`share_i = level_i / Σ present levels`), guarding the denominator (Σ null/0 → null shares, no divide-by-zero) — do NOT expect pre-stored shares from S10.
3. `src/hooks/useBanking.test.ts`: assert live mapping + null fallback + donut share math.
4. `src/pages/Banking.tsx`: Mobile + Desktop — replace fixtures; conditional `<DemoBadge/>`; deposits donut + NPL-segment panel live; slope chart gated on all 4 NPL segments; vintage labels; strip orphaned subtitles.

**Verification.** YS verify (§F). Visual: viewport screenshot, assert 4 NPL + 4 deposit values via `browser_evaluate`; donut/slope render only with full live data.

**Exit criteria.** NPL-by-segment panel + deposits donut render live with vintage; slope chart shown only with all 4 segments; relevant `<DemoBadge/>`s gone.

**Rollback.** Revert PR.

---

### S16 — YieldScope: auction panels (Yields table + Dashboard list + Fiscal 12-wk calendar)

- **id:** S16 · **repo:** YieldScope · **depends-on:** **S8, S9** · **model tier:** strongest (NEW structured-fetch path — the wiring recipe only covers scalars) · **branch:** `feat/yieldscope-auction-panels`

**Context brief.** Wire the three auction panels to the structured `auction_results` table (S8/S9) + the forward calendar:
- **Panel A — Yields "Recent auctions" table** (`src/pages/Yields.tsx:359-391`, mobile tab `166, 216-226`): renders `FX.auctions` (fixture, `AuctionRow` shape `src/data/fixtures.ts:34-40`). Needs per-tenor result rows.
- **Panel B — Dashboard auction list** (`src/pages/Dashboard.tsx:335-350`): same `AuctionRow` shape, `.slice(0,4)`.
- **Panel C — Fiscal 12-week issuance calendar** (`src/pages/Fiscal.tsx:16-17, 214-232`): hardcoded `ISSUANCE_T_BILL`/`ISSUANCE_T_BOND` arrays → forward calendar strip.

**This needs a NEW structured-fetch path in YieldScope** — `src/lib/econdelta.ts` only has scalar `fetchLatest`/`fetchSeries` against `metric_history`. Add a `fetchAuctionResults()` (and `fetchAuctionCalendar()`) reading the `auction_results` table (anon-read RLS from S8) via the existing Supabase client. The `GSEC_AUCTION` metric is declared (`src/lib/econdelta-metrics.ts:26`) but referenced nowhere — either retire it or leave it; do not wire the scalar into the table panels (it is the single next-notional, not results). Map rows into the `AuctionRow` shape. Honor `৳` currency convention, `tabular-nums`, up=red/down=green deltas (round via `roundTo`), landmine 18 (no live headline over fixture chart).

**Tasks.**
1. `src/lib/econdelta.ts` (or a new `src/lib/auctions.ts`): add `fetchAuctionResults(limit)` + `fetchAuctionCalendar(weeks)` reading the new table; type the row shape.
2. New hook or extend `useYields.ts`/`useFiscal.ts`/`useDashboard.ts` to expose the auction rows + forward strip (`number[]`/row[]); `?? []` empty fallback.
3. Tests: assert the fetch maps Supabase rows → `AuctionRow[]`; empty-table → `[]` (then panels show Demo, not crash).
4. `src/pages/Yields.tsx` + `Dashboard.tsx` + `Fiscal.tsx`: Mobile + Desktop — replace `FX.auctions` / `ISSUANCE_*` with live rows; conditional `<DemoBadge/>` when empty; round cutoff/cover deltas; gate the 12-wk strip on live calendar rows; strip orphaned fixture subtitles (the hardcoded Dashboard cover/devolvement alert string `Dashboard.tsx:30`).

**Verification.** YS verify (§F). Visual: viewport screenshot of all three panels, assert live rows via `browser_evaluate`; empty-table path shows Demo (not a crash).

**Exit criteria.** Yields table + Dashboard list render live per-tenor auction rows; Fiscal 12-week strip renders the live forward calendar; `<DemoBadge/>` remains only when the table is genuinely empty.

**Rollback.** Revert PR. Panels fall back to fixtures.

---

### S17 — YieldScope: close-out — refresh wishlist, record reclassifications

- **id:** S17 · **repo:** YieldScope · **depends-on:** S12–S16 (ideally complete; can run partial) · **model tier:** default · **branch:** `docs/yieldscope-tier2-closeout`

**Context brief.** Update `docs/econdelta-wishlist.md` to mark Tier 2 closed and record the three reclassified items. This is docs-only (merge-by-default under both VISIONs).

**Tasks.**
1. In `docs/econdelta-wishlist.md`: flip each built Tier 2 item from `⏳` to `✅` with the shipping PR reference; update the "Coverage at a glance" counts.
2. Record the 3 reclassified items: move **intraday call-money hourly** firmly to Tier 3 (it's already partly there) and note the Liquidity heatmap should be **relabelled "daily"** or left Demo with a one-line note; mark **Core CPI** as accept-Demo (with the optional non-food approximation noted as NOT-default); mark **industry LCR/NSFR** as accept-Demo (annual-FSR staleness rationale).
3. If chosen in S12-related work: relabel the intraday heatmap panel from "intraday/hourly" to "daily" in `src/pages/Liquidity.tsx` (small copy change, no data wire) — OR leave Demo with a note. Decide and document. **Scope note (NOT this plan's work):** once relabelled "daily", the heatmap is a candidate for a FUTURE wire to BB's end-of-day DOMMR/BOFR volume-weighted reference rates (which ARE published daily, unlike intraday ticks) rather than permanent Demo. Record this as a Tier-3 follow-up in the wishlist; do not build the DOMMR scraper here.

**Verification.** YS verify (§F) — `npm run lint` + `npm run build` (in case the heatmap relabel touches a page). Docs change needs no Playwright.

**Exit criteria.** `docs/econdelta-wishlist.md` shows Tier 2 closed; the 3 reclassified items have written rationale; if the heatmap was relabelled, it no longer claims "hourly".

**Rollback.** Revert PR (docs + optional copy change).

---

## VISION sign-off gates

These steps need explicit user (Adnan) approval BEFORE execution — do not auto-merge:

- **S8 — auction storage / schema (EconDelta).** New `db/migrations/` file + new Supabase table + new writer path. EconDelta VISION: "`db/schema.sql` or `db/migrations/`" and "Broad refactors that touch a public boundary (Supabase schema)" both require sign-off. Present option (a) fan-out vs (b) new table; recommend (b); get the nod before writing the migration. **Gates S9 and S16.**
- **S16 — auction panels / new live data seam (YieldScope).** Introduces a new live structured data seam (`fetchAuctionResults`/`fetchAuctionCalendar` against the `auction_results` table) feeding the `AuctionRow` shape across **three** pages (Yields, Dashboard, Fiscal) — the highest-blast-radius wiring in the plan. YieldScope VISION:33 "Data-seam changes — replacing `src/data/fixtures.ts` is the planned EconDelta swap; modifications to its schema cascade to all pages" → **Needs Sign-Off.** No new dependency does NOT mean no data-seam change — the dependency check passes (reuses `@supabase/supabase-js`), but the data-seam check does not. **Get Adnan's nod on the `AuctionRow` live-vs-fixture mapping shape before wiring all three pages.** Present this together with S8 (same auction feature, paired EconDelta-side sign-off).
- **S11 — World Bank Pink Sheet, IF it adds a Python dependency** (e.g. an Excel reader). EconDelta VISION: "Dependency additions in `requirements.txt`/`pyproject.toml`" need sign-off. Prefer a no-dep CSV path to avoid the gate; if a dep is unavoidable, flag it before adding.
- **S4 / S5 — IF the IMF history is seeded into the monthly system** (`metric_history_monthly` seeders). Touching the monthly seeders is a load-bearing-namespace change — confirm before crossing into that system (landmine D). The default (latest-scalar + accumulated history) needs no gate.
- **S3 — IF `non_tax_revenue`'s flaky empty-URL source is retired/repinned.** A single retirement with rationale is merge-by-default, but a source repin that changes a production indicator's behavior should be flagged.

**S16 is the one YieldScope step that needs a sign-off gate** (see above — new live data seam, VISION:33). The other YieldScope wires (S12–S15, S17) need no gate by default — none changes palette, base path, currency, the up=red convention, or adds a dependency, and they wire scalars into the *existing* `metric_history` seam rather than introducing a new one. Note S16 adds NO dependency (reuses the existing `@supabase/supabase-js` client) — but "no new dependency" is not the same as "no data-seam change," and S16 trips the data-seam rule. If S16's structured-fetch path ever tempts a chart library, that is a hard NO on top (AGENTS landmine: hand-rolled SVG only).

---

## Verification reality

- **EconDelta scrapers (S1, S3, S4-MoF, S5-MoF, S6, S7, S9, S10) are BD-egress** — fetch/parse MUST be verified on **ExonVPS Dhaka** (`adnan-local@103.187.23.22`, where the cron runs), NOT this Mac, because BB/BBS/NBR/MoF firewall non-BD datacenter IPs (live CAPTCHA wall confirmed). One sudo per ssh (landmine 11). **No-egress exceptions verifiable on this Mac:** S2 (derived from already-scraped values), S4/S5 IMF DataMapper leg, S11 World Bank Pink Sheet.
- **No backend CI in EconDelta** — `pytest` + `ruff` + `tests/test_parser_registry_coverage.py` run LOCALLY before every backend merge; regenerate `docs/indicator-catalog.md` after every `sources-v3.json` change.
- **YieldScope is verified locally** (`npm run test:run` / `lint` / `build`) **and on the live site post-deploy** (`https://yieldscope.clauding-lab.com`, GitHub Pages). The dev server must run in tmux (`tmux new-session -d -s dev "npm run dev"`; plain background is blocked by the harness hook).
- **Visual QA uses VIEWPORT screenshots, never `fullPage`** (YieldScope landmine 24): expanding the viewport for a full-page capture remounts the data hooks into their loading + demo-fallback render and freezes that transient, so a fully-live page photographs as if every panel were Demo. Screenshot at a tall window AFTER the fetch settles and assert live values with `browser_evaluate` / text-waits, never from a `fullPage` image.
- **A fresh `as_of` does NOT prove freshness** (YieldScope landmine 16 / EconDelta carry-forward): before claiming a YieldScope panel is "live", confirm EconDelta's parse cron is healthy (`econdelta.clauding-lab.com/runs`, `source=parse status=ok`) — `aggregate` re-stamps stale snapshots with today's date.
