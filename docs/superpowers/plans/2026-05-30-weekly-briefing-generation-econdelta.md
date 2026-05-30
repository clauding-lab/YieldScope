# Weekly ALCO Briefing — Generation Pipeline (EconDelta) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a once-weekly (Monday 07:00 BDT) EconDelta job that reads daily `metric_history` from Supabase, computes anomaly candidates in Python, gates on data freshness, asks Claude Opus 4.8 (1M) at xhigh effort to write the weekly ALCO briefing + curate anomalies + carry forward "open threads", validates the JSON, and upserts a row into a new `briefings` table.

**Architecture:** Plan A from the spec — a deterministic Python harness owns all numbers and I/O; Claude is a stateless writer (`claude_max.run_max`, `--tools "" --no-session-persistence`). Persistence/"memory" is DB-backed (prior `briefings` rows + `open_threads` injected into the prompt). This is the same shape as the existing daily `opus_review` path. New code lives in a `briefing/` package; the Supabase read helper and the `briefings` upsert live with their siblings in `utils/`.

**Tech Stack:** Python ≥3.11 (repo venv is 3.14.3), `requests` against Supabase PostgREST (no supabase-py), `claude_max.run_max` subprocess wrapper, systemd timer on ExonVPS Dhaka, pytest. This plan covers the **EconDelta + Supabase** subsystem only; the YieldScope display (the `useBriefing` hook + `Intelligence.tsx` rewire) is **Plan B**, written after this lands real rows.

**Spec:** `docs/superpowers/specs/2026-05-30-weekly-alco-briefing-design.md` (in the YieldScope repo).

**Where this runs:** All file paths below are in the **EconDelta** repo: `~/Projects/clauding-lab/econdelta`. Run all commands from that repo root, using its venv: `.venv/bin/python -m pytest` (system `python3` has no pytest).

---

## File Structure (decomposition)

| File | New/Edit | Responsibility |
|---|---|---|
| `db/migrations/0008_briefings.sql` | New | `briefings` table DDL + RLS (anon read + service_role write) |
| `db/schema.sql` | Edit | Mirror the new table (house rule) |
| `utils/supabase_reader.py` | New | PostgREST **GET** helpers (none exist today): metric history, recent-run health, prior briefings |
| `utils/supabase_writer.py` | Edit | Add `upsert_briefing()` mirroring `upsert_metric_history` (session-injectable, raises) |
| `briefing/__init__.py` | New | Package marker |
| `briefing/config.py` | New | Load sources-v3 thresholds/cadence/labels; define `CORE_METRIC_IDS` + tracked set |
| `briefing/anomalies.py` | New | Pure anomaly-candidate computation (w/w Δ + z-score), reusing sources-v3 thresholds |
| `briefing/freshness.py` | New | Pure tiered freshness assessment (core→skip, peripheral→banner) |
| `briefing/prompt.py` | New | Digest builder + prompt template + output JSON validator |
| `briefing/__main__.py` | New | Orchestrator `main()`; `python -m briefing` via `wrap_run` |
| `deploy/econdelta-briefing.service` | New | systemd oneshot (Claude-calling unit) |
| `deploy/econdelta-briefing.timer` | New | `OnCalendar=Mon *-*-* 01:00:00 UTC` (07:00 BDT) |
| `deploy/econdelta-briefing.service.d/10-claude-json-writable.conf` | New | EROFS drop-in (claude writes `~/.claude.json`) |
| `deploy/install.sh` | Edit | Add `econdelta-briefing` to the hardcoded enable loop |
| `tests/test_briefing_reader.py` | New | Reader GET shape + creds |
| `tests/test_briefing_writer.py` | New | `upsert_briefing` POST shape |
| `tests/test_briefing_anomalies.py` | New | Anomaly rules (intent) |
| `tests/test_briefing_freshness.py` | New | Tiered gate |
| `tests/test_briefing_prompt.py` | New | Validator integrity guarantee |
| `tests/test_briefing_orchestrator.py` | New | main() paths with `run_max` mocked + reads injected |
| `AGENTS.md` | Edit | New landmine entries (claude-json drop-in, install.sh enable loop, two metric systems) |

**Pre-task sanity check (do once before Task 1):**

- [ ] **Step 0: Confirm repo + venv + green baseline**

Run:
```bash
cd ~/Projects/clauding-lab/econdelta && .venv/bin/python -m pytest -q
```
Expected: existing suite passes (≈30+ tests, sub-second). If `pytest` is missing, you're on system python — use `.venv/bin/python -m pytest`.

- [ ] **Step 0b: Verify the core metric_ids actually exist in sources-v3.json**

Run:
```bash
cd ~/Projects/clauding-lab/econdelta && .venv/bin/python -c "import json; ids={i['id'] for i in json.load(open('config/sources-v3.json'))['indicators']}; want=['policy_rate_repo','policy_rate_sdf','policy_rate_slf','call_money_rate','bill_bond_rates','tbill_182d','tbill_364d','tbond_5y_yield','tbond_10y_yield','usd_bdt_exchange_rate','fx_reserve_gross_and_bpm6','point_to_point_inflation','gross_npl_ratio']; print('MISSING:', [w for w in want if w not in ids]); print('have', len(ids))"
```
Expected: `MISSING: []`. If any are missing, fix the id strings in `briefing/config.py` (Task 4) to match the real ids before proceeding — this is the one place the plan assumes exact strings.

---

## Task 1: Migration `0008_briefings.sql` + schema mirror

**Files:**
- Create: `db/migrations/0008_briefings.sql`
- Modify: `db/schema.sql` (append the briefings block)

This task has no Python test (it's DDL). Verification is idempotent re-apply.

- [ ] **Step 1: Write the migration**

Create `db/migrations/0008_briefings.sql` (lowercase DDL + `public.` qualifier + idempotent guards, matching the 0003/0005/0006 camp; PK is `week_of` so no `pgcrypto` needed):

```sql
-- ============================================================================
-- 0008 — briefings
-- ----------------------------------------------------------------------------
-- One row per weekly ALCO briefing, generated Monday morning by a Claude
-- Opus session on ExonVPS (see briefing/ package). Powers YieldScope's
-- Briefings page: the weekly read, the curated anomaly list, and the
-- prior-week history. `open_threads` is the job's persistent memory —
-- carried forward into next week's prompt.
-- Written by the briefing job under service_role; read by the PWA under anon.
-- ============================================================================

create table if not exists public.briefings (
  week_of            date primary key,                 -- Monday's date (ISO week anchor)
  generated_at       timestamptz not null default now(),
  title              text not null,
  body               text not null,
  featured_anomalies jsonb not null default '[]'::jsonb, -- [{candidate_id,label,stat,value,detail,severity,metric_id,why}]
  open_threads       jsonb not null default '[]'::jsonb, -- [{id,thread,status,since_week,note}]
  data_as_of         date not null,                    -- freshness stamp for the honesty banner
  stale_series       text[] not null default '{}',     -- peripheral metric_ids flagged stale this run
  model              text not null,                    -- e.g. 'opus[1m]'
  effort             text not null,                    -- e.g. 'xhigh'
  total_cost_usd     numeric,
  inputs_hash        text
);

create index if not exists briefings_week_of_idx on public.briefings (week_of desc);

alter table public.briefings enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies
    where schemaname='public' and tablename='briefings' and policyname='service_role_all') then
    create policy service_role_all on public.briefings
      for all to service_role using (true) with check (true);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies
    where schemaname='public' and tablename='briefings' and policyname='anon read briefings') then
    create policy "anon read briefings" on public.briefings
      for select to anon using (true);
  end if;
end $$;

comment on policy "anon read briefings" on public.briefings is
  'Public read for the YieldScope Briefings page. No PII; macro commentary only.';
```

- [ ] **Step 2: Mirror into `db/schema.sql`**

Append the same `create table ... briefings ...` block (table + index + `enable row level security` + both policy `do $$` guards) to the end of `db/schema.sql`. (House rule: schema.sql mirrors the latest migration. NOTE: schema.sql is already partially drifted — it only contains `metric_history`, not run_logs/definitions/monthly. Do **not** try to backfill those; only add the briefings block. Flag the pre-existing drift in the PR description, don't fix it here.)

- [ ] **Step 3: Apply + verify idempotency**

Run (against the shared brief Supabase; `DATABASE_URL` must point at it):
```bash
cd ~/Projects/clauding-lab/econdelta
psql "$DATABASE_URL" -f db/migrations/0008_briefings.sql
psql "$DATABASE_URL" -f db/migrations/0008_briefings.sql   # second run = no-op
psql "$DATABASE_URL" -c "\d public.briefings"
```
Expected: first apply creates table+policies; second apply prints no errors (all `if not exists` / `pg_policies` guards hold); `\d` shows the columns. If you cannot reach the DB from this machine, hand the migration to Adnan to apply and mark this step blocked — do not proceed to Task 7's live smoke test until the table exists.

- [ ] **Step 4: Commit**

```bash
git add db/migrations/0008_briefings.sql db/schema.sql
git commit -m "feat(db): add briefings table (0008) + schema mirror"
```

---

## Task 2: `utils/supabase_reader.py` — PostgREST GET helpers

**Files:**
- Create: `utils/supabase_reader.py`
- Test: `tests/test_briefing_reader.py`

There is no Supabase read helper in the repo today. Mirror `upsert_metric_history`'s style: `session=` injectable, reuse `_resolve_credentials`, raise on failure.

- [ ] **Step 1: Write the failing tests**

Create `tests/test_briefing_reader.py`:
```python
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock
import requests
import pytest
from utils.supabase_reader import (
    SupabaseReadError, get_metric_history, get_recent_run_ok, get_recent_briefings,
)


def _session(json_body, status=200):
    sess = MagicMock(spec=requests.Session)
    resp = MagicMock()
    resp.status_code = status
    resp.json.return_value = json_body
    resp.text = ""
    sess.get.return_value = resp
    return sess


def test_get_metric_history_builds_ordered_limited_query():
    sess = _session([{"metric_id": "call_money_rate", "as_of": "2026-05-29", "value": 9.34}])
    rows = get_metric_history(
        "call_money_rate", days=90,
        url="https://x.supabase.co", key="sk_test", session=sess,
    )
    assert rows[0]["value"] == 9.34
    url = sess.get.call_args[0][0]
    assert url == ("https://x.supabase.co/rest/v1/metric_history"
                   "?metric_id=eq.call_money_rate&order=as_of.desc&limit=90")
    headers = sess.get.call_args[1]["headers"]
    assert headers["apikey"] == "sk_test"
    assert headers["Authorization"] == "Bearer sk_test"


def test_get_metric_history_raises_on_http_error():
    sess = _session([], status=500)
    with pytest.raises(SupabaseReadError, match="HTTP 500"):
        get_metric_history("x", days=10, url="https://x.supabase.co", key="k", session=sess)


def test_get_recent_run_ok_true_when_recent():
    recent = (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat()
    sess = _session([{"started_at": recent}])
    assert get_recent_run_ok("aggregate", within_hours=48,
                             url="https://x.supabase.co", key="k", session=sess) is True


def test_get_recent_run_ok_false_when_stale():
    old = (datetime.now(timezone.utc) - timedelta(hours=80)).isoformat()
    sess = _session([{"started_at": old}])
    assert get_recent_run_ok("aggregate", within_hours=48,
                             url="https://x.supabase.co", key="k", session=sess) is False


def test_get_recent_run_ok_false_when_no_rows():
    sess = _session([])
    assert get_recent_run_ok("aggregate", within_hours=48,
                             url="https://x.supabase.co", key="k", session=sess) is False


def test_get_recent_briefings_orders_desc():
    sess = _session([{"week_of": "2026-05-25", "title": "t"}])
    rows = get_recent_briefings(limit=8, url="https://x.supabase.co", key="k", session=sess)
    assert rows[0]["week_of"] == "2026-05-25"
    url = sess.get.call_args[0][0]
    assert url == "https://x.supabase.co/rest/v1/briefings?order=week_of.desc&limit=8"
```

- [ ] **Step 2: Run to verify failure**

Run: `.venv/bin/python -m pytest tests/test_briefing_reader.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'utils.supabase_reader'`.

- [ ] **Step 3: Implement**

Create `utils/supabase_reader.py`:
```python
"""PostgREST GET helpers for the briefing job.

The repo has no Supabase SELECT helper (utils/supabase_writer.py is POST/PATCH
only; opus_review.load_history reads LOCAL archive JSON). This module adds the
read side, mirroring the writer's style: reuse _resolve_credentials, accept a
session= for injection, and RAISE on failure (reads are load-bearing for the
briefing — unlike run_logs writes, they must not silently degrade).
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import requests

from utils.supabase_writer import _resolve_credentials

_DEFAULT_TIMEOUT = 30


class SupabaseReadError(RuntimeError):
    """Raised when a PostgREST GET fails or returns non-2xx."""


def _get(path: str, *, url: str | None, key: str | None,
         session: requests.Session | None, timeout: int = _DEFAULT_TIMEOUT) -> list[dict[str, Any]]:
    base_url, resolved_key = _resolve_credentials(url, key)
    endpoint = f"{base_url}/rest/v1/{path}"
    headers = {"apikey": resolved_key, "Authorization": f"Bearer {resolved_key}"}
    sess = session or requests.Session()
    try:
        resp = sess.get(endpoint, headers=headers, timeout=timeout)
    except requests.RequestException as e:
        raise SupabaseReadError(f"GET {path} network error: {e}") from e
    if resp.status_code not in (200, 206):
        raise SupabaseReadError(f"GET {path} returned HTTP {resp.status_code}: {resp.text[:200]}")
    return resp.json()


def get_metric_history(metric_id: str, *, days: int, url: str | None = None,
                       key: str | None = None, session: requests.Session | None = None) -> list[dict[str, Any]]:
    """Most-recent `days` rows for one metric, newest first."""
    path = f"metric_history?metric_id=eq.{metric_id}&order=as_of.desc&limit={days}"
    return _get(path, url=url, key=key, session=session)


def get_recent_run_ok(source: str, *, within_hours: int, url: str | None = None,
                      key: str | None = None, session: requests.Session | None = None) -> bool:
    """True if the latest run_logs row for `source` with status='ok' started within the window.

    This is the anti-carry-forward signal: a fresh as_of can hide a dead parse,
    but a recent successful aggregate run cannot be faked.
    """
    path = f"run_logs?source=eq.{source}&status=eq.ok&order=started_at.desc&limit=1"
    rows = _get(path, url=url, key=key, session=session)
    if not rows:
        return False
    started = datetime.fromisoformat(rows[0]["started_at"])
    if started.tzinfo is None:
        started = started.replace(tzinfo=timezone.utc)
    age_hours = (datetime.now(timezone.utc) - started).total_seconds() / 3600
    return age_hours <= within_hours


def get_recent_briefings(*, limit: int, url: str | None = None, key: str | None = None,
                         session: requests.Session | None = None) -> list[dict[str, Any]]:
    """The last `limit` briefings, newest first (for prompt context + open_threads)."""
    path = f"briefings?order=week_of.desc&limit={limit}"
    return _get(path, url=url, key=key, session=session)
```

- [ ] **Step 4: Run to verify pass**

Run: `.venv/bin/python -m pytest tests/test_briefing_reader.py -q`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add utils/supabase_reader.py tests/test_briefing_reader.py
git commit -m "feat(briefing): add PostgREST GET reader (history, run health, prior briefings)"
```

---

## Task 3: `upsert_briefing()` in `utils/supabase_writer.py`

**Files:**
- Modify: `utils/supabase_writer.py` (add one function near `upsert_metric_history`)
- Test: `tests/test_briefing_writer.py`

- [ ] **Step 1: Write the failing test**

Create `tests/test_briefing_writer.py`:
```python
from datetime import date
from unittest.mock import MagicMock
import requests
import pytest
from utils.supabase_writer import SupabaseWriteError, upsert_briefing


def _session(status=201):
    sess = MagicMock(spec=requests.Session)
    resp = MagicMock(); resp.status_code = status; resp.text = ""
    sess.post.return_value = resp
    return sess


def _row():
    return {
        "week_of": "2026-05-25", "title": "t", "body": "b",
        "featured_anomalies": [], "open_threads": [],
        "data_as_of": "2026-05-24", "stale_series": [],
        "model": "opus[1m]", "effort": "xhigh", "total_cost_usd": 0.0,
    }


def test_upsert_briefing_posts_with_week_of_on_conflict():
    sess = _session()
    upsert_briefing(_row(), url="https://x.supabase.co", service_key="sk_test", session=sess)
    args, kwargs = sess.post.call_args
    assert args[0] == "https://x.supabase.co/rest/v1/briefings?on_conflict=week_of"
    assert kwargs["headers"]["Authorization"] == "Bearer sk_test"
    assert "merge-duplicates" in kwargs["headers"]["Prefer"]
    assert kwargs["json"]["week_of"] == "2026-05-25"


def test_upsert_briefing_raises_on_http_error():
    sess = _session(status=400)
    with pytest.raises(SupabaseWriteError, match="HTTP 400"):
        upsert_briefing(_row(), url="https://x.supabase.co", service_key="sk_test", session=sess)
```

- [ ] **Step 2: Run to verify failure**

Run: `.venv/bin/python -m pytest tests/test_briefing_writer.py -q`
Expected: FAIL — `ImportError: cannot import name 'upsert_briefing'`.

- [ ] **Step 3: Implement**

Add to `utils/supabase_writer.py` (after `upsert_metric_history`; reuses the module's existing `requests`, `_resolve_credentials`, `SupabaseWriteError`, `_DEFAULT_TIMEOUT`):
```python
def upsert_briefing(row, *, url=None, service_key=None, timeout=_DEFAULT_TIMEOUT, session=None):
    """Upsert one weekly briefing row (PK week_of). Raises SupabaseWriteError on failure.

    Unlike run_logs helpers (which swallow errors), this RAISES — a failed
    briefing write must be visible so the job returns non-zero.
    """
    base_url, key = _resolve_credentials(url, service_key)
    endpoint = f"{base_url}/rest/v1/briefings?on_conflict=week_of"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    sess = session or requests.Session()
    try:
        resp = sess.post(endpoint, json=row, headers=headers, timeout=timeout)
    except requests.RequestException as e:
        raise SupabaseWriteError(f"briefing upsert network error: {e}") from e
    if resp.status_code not in (200, 201, 204):
        raise SupabaseWriteError(f"briefing upsert returned HTTP {resp.status_code}: {resp.text[:200]}")
```
(If `_DEFAULT_TIMEOUT` is named differently in the file — confirm by grep — use the existing constant. The mapping reported `_DEFAULT_TIMEOUT=30` and `_BATCH_SIZE=500`.)

- [ ] **Step 4: Run to verify pass**

Run: `.venv/bin/python -m pytest tests/test_briefing_writer.py -q`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add utils/supabase_writer.py tests/test_briefing_writer.py
git commit -m "feat(briefing): add upsert_briefing writer (raises, week_of upsert)"
```

---

## Task 4: `briefing/config.py` — thresholds, cadence, core set

**Files:**
- Create: `briefing/__init__.py` (empty)
- Create: `briefing/config.py`
- Test: `tests/test_briefing_config.py`

- [ ] **Step 1: Write the failing test**

Create `tests/test_briefing_config.py`:
```python
from briefing import config


def test_loaders_cover_known_core_ids():
    indicators = config.load_indicators()
    thr = config.thresholds_by_metric(indicators)
    cad = config.cadence_by_metric(indicators)
    # call_money_rate is a real daily money-market indicator with a threshold
    assert "call_money_rate" in thr
    assert thr["call_money_rate"] is not None
    assert cad["call_money_rate"] in {"daily", "weekly", "monthly", "quarterly", "fiscal_year"}


def test_core_ids_are_subset_of_tracked():
    indicators = config.load_indicators()
    tracked = config.tracked_metric_ids(indicators)
    assert config.CORE_METRIC_IDS <= set(tracked)
```

- [ ] **Step 2: Run to verify failure**

Run: `.venv/bin/python -m pytest tests/test_briefing_config.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'briefing'`.

- [ ] **Step 3: Implement**

Create `briefing/__init__.py` (empty file).

Create `briefing/config.py`:
```python
"""Static config for the weekly briefing: which metrics, their thresholds,
cadence and labels — all derived from config/sources-v3.json (the same source
aggregate_latest.py uses to seed metric_definitions).
"""
from __future__ import annotations

import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SOURCES_V3 = REPO_ROOT / "config" / "sources-v3.json"

# Thesis-bearing series. If any of these is stale, skip the whole briefing.
# Verified against sources-v3.json in Step 0b of the plan.
CORE_METRIC_IDS = frozenset({
    "policy_rate_repo", "policy_rate_sdf", "policy_rate_slf",
    "call_money_rate", "bill_bond_rates", "tbill_182d", "tbill_364d",
    "tbond_5y_yield", "tbond_10y_yield",
    "usd_bdt_exchange_rate", "fx_reserve_gross_and_bpm6",
    "point_to_point_inflation", "gross_npl_ratio",
})


def load_indicators() -> list[dict]:
    return json.loads(SOURCES_V3.read_text())["indicators"]


def tracked_metric_ids(indicators: list[dict]) -> list[str]:
    """Every daily-pipeline indicator id (the data YieldScope surfaces)."""
    return [ind["id"] for ind in indicators]


def thresholds_by_metric(indicators: list[dict]) -> dict[str, float | None]:
    return {ind["id"]: ind.get("anomaly_threshold") for ind in indicators}


def cadence_by_metric(indicators: list[dict]) -> dict[str, str]:
    return {ind["id"]: ind.get("cadence", "daily") for ind in indicators}


def label_by_metric(indicators: list[dict]) -> dict[str, str]:
    # sources-v3 uses `name` (not `label`) for the human-readable string.
    return {ind["id"]: ind.get("name") or ind["id"] for ind in indicators}
```

- [ ] **Step 4: Run to verify pass**

Run: `.venv/bin/python -m pytest tests/test_briefing_config.py -q`
Expected: PASS (2 tests). If `test_core_ids_are_subset_of_tracked` fails, a `CORE_METRIC_IDS` string doesn't match sources-v3 — fix per Step 0b.

- [ ] **Step 5: Commit**

```bash
git add briefing/__init__.py briefing/config.py tests/test_briefing_config.py
git commit -m "feat(briefing): config loaders + core metric set from sources-v3"
```

---

## Task 5: `briefing/anomalies.py` — candidate computation

**Files:**
- Create: `briefing/anomalies.py`
- Test: `tests/test_briefing_anomalies.py`

Two rules, reusing per-metric `anomaly_threshold` from sources-v3:
1. **Change vs prior** — `abs(latest - prev) >= threshold` → candidate (severity `up`/`down`).
2. **Statistical outlier** — with ≥8 prior points, `abs(z) >= 2` vs the trailing mean → candidate (severity `warn`).

Tests assert the **rule**, not code shape.

- [ ] **Step 1: Write the failing tests**

Create `tests/test_briefing_anomalies.py`:
```python
from briefing.anomalies import compute_candidates, AnomalyCandidate


def _series(values):
    # newest-first rows, as the reader returns them
    return [{"as_of": f"2026-05-{30-i:02d}", "value": v} for i, v in enumerate(values)]


def test_change_vs_prior_flags_when_breach():
    # call_money jumps 9.34 from 7.10 (Δ=2.24 >= threshold 2.0)
    series = {"call_money_rate": _series([9.34, 7.10, 7.05, 7.00])}
    out = compute_candidates(series, thresholds={"call_money_rate": 2.0}, cadence={"call_money_rate": "daily"})
    ids = {c.candidate_id for c in out}
    assert "call_money_rate:change" in ids
    c = next(c for c in out if c.candidate_id == "call_money_rate:change")
    assert c.severity == "up"
    assert c.value == 9.34
    assert c.metric_id == "call_money_rate"


def test_change_vs_prior_silent_when_within_threshold():
    series = {"call_money_rate": _series([7.20, 7.10])}  # Δ=0.10 < 2.0
    out = compute_candidates(series, thresholds={"call_money_rate": 2.0}, cadence={"call_money_rate": "daily"})
    assert all(c.candidate_id != "call_money_rate:change" for c in out)


def test_zscore_flags_statistical_outlier():
    # 8 flat points at 5.0, then a spike to 7.0 -> large z-score
    series = {"x": _series([7.0] + [5.0] * 9)}
    out = compute_candidates(series, thresholds={"x": 99.0}, cadence={"x": "daily"})  # high thr so only z fires
    assert any(c.candidate_id == "x:zscore" for c in out)


def test_no_threshold_means_no_change_candidate():
    series = {"y": _series([10.0, 1.0])}
    out = compute_candidates(series, thresholds={"y": None}, cadence={"y": "daily"})
    assert all(c.candidate_id != "y:change" for c in out)


def test_too_few_points_no_zscore():
    series = {"z": _series([9.0, 1.0])}
    out = compute_candidates(series, thresholds={"z": None}, cadence={"z": "daily"})
    assert all(c.candidate_id != "z:zscore" for c in out)
```

- [ ] **Step 2: Run to verify failure**

Run: `.venv/bin/python -m pytest tests/test_briefing_anomalies.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'briefing.anomalies'`.

- [ ] **Step 3: Implement**

Create `briefing/anomalies.py`:
```python
"""Deterministic anomaly-candidate computation. Pure functions — no I/O.

Numbers come from here, never from Claude. Each candidate has a stable id so
the model can reference (and only reference) it in featured_anomalies.
"""
from __future__ import annotations

import statistics
from dataclasses import dataclass

_ZSCORE_MIN_POINTS = 8
_ZSCORE_FLAG = 2.0


@dataclass(frozen=True)
class AnomalyCandidate:
    candidate_id: str
    metric_id: str
    label: str
    stat: str
    value: float
    detail: str
    severity: str  # 'up' | 'down' | 'warn'


def _values_newest_first(rows: list[dict]) -> list[float]:
    out = []
    for r in rows:
        try:
            out.append(float(r["value"]))
        except (TypeError, ValueError, KeyError):
            continue
    return out


def compute_candidates(series_by_metric: dict[str, list[dict]],
                       thresholds: dict[str, float | None],
                       cadence: dict[str, str],
                       labels: dict[str, str] | None = None) -> list[AnomalyCandidate]:
    labels = labels or {}
    out: list[AnomalyCandidate] = []
    for metric_id, rows in series_by_metric.items():
        vals = _values_newest_first(rows)
        if len(vals) < 2:
            continue
        latest, prev = vals[0], vals[1]
        label = labels.get(metric_id, metric_id)

        # Rule 1: change vs prior reading
        thr = thresholds.get(metric_id)
        if thr is not None:
            delta = latest - prev
            if abs(delta) >= thr:
                out.append(AnomalyCandidate(
                    candidate_id=f"{metric_id}:change",
                    metric_id=metric_id, label=label,
                    stat="change vs prior",
                    value=latest,
                    detail=f"{'+' if delta >= 0 else ''}{delta:.2f} vs prior {prev:.2f} (limit {thr})",
                    severity="up" if delta > 0 else "down",
                ))

        # Rule 2: z-score vs trailing mean (exclude the latest point)
        trailing = vals[1:]
        if len(trailing) >= _ZSCORE_MIN_POINTS:
            mean = statistics.fmean(trailing)
            stdev = statistics.pstdev(trailing)
            if stdev > 0:
                z = (latest - mean) / stdev
                if abs(z) >= _ZSCORE_FLAG:
                    out.append(AnomalyCandidate(
                        candidate_id=f"{metric_id}:zscore",
                        metric_id=metric_id, label=label,
                        stat="σ vs trailing mean",
                        value=latest,
                        detail=f"{z:+.1f}σ vs {len(trailing)}-pt mean {mean:.2f}",
                        severity="warn",
                    ))
    return out
```

- [ ] **Step 4: Run to verify pass**

Run: `.venv/bin/python -m pytest tests/test_briefing_anomalies.py -q`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add briefing/anomalies.py tests/test_briefing_anomalies.py
git commit -m "feat(briefing): deterministic anomaly candidates (change + z-score)"
```

---

## Task 6: `briefing/freshness.py` — tiered gate

**Files:**
- Create: `briefing/freshness.py`
- Test: `tests/test_briefing_freshness.py`

A metric is stale if its newest `as_of` is older than its cadence window. Core stale (any core metric stale, OR no recent successful aggregate run) → skip. Peripheral stale → generate-with-banner. Cadence windows (days) derived from `aggregate_latest.py` `STALE_THRESHOLDS_HOURS_BY_CADENCE` ÷ 24.

- [ ] **Step 1: Write the failing tests**

Create `tests/test_briefing_freshness.py`:
```python
from datetime import date
from briefing.freshness import assess_freshness, FreshnessResult

TODAY = date(2026, 5, 30)
CADENCE = {"call_money_rate": "daily", "tbond_5y_yield": "weekly",
           "policy_rate_repo": "monthly", "some_fiscal": "monthly"}
CORE = {"call_money_rate", "tbond_5y_yield", "policy_rate_repo"}


def test_all_fresh_passes():
    latest = {"call_money_rate": date(2026, 5, 29), "tbond_5y_yield": date(2026, 5, 26),
              "policy_rate_repo": date(2026, 5, 1), "some_fiscal": date(2026, 5, 10)}
    r = assess_freshness(latest, CADENCE, CORE, TODAY, aggregate_ok_recent=True)
    assert r.core_stale is False
    assert r.stale_series == []


def test_stale_core_daily_metric_trips_gate():
    latest = {"call_money_rate": date(2026, 5, 20),  # 10d old, daily window=1d -> stale
              "tbond_5y_yield": date(2026, 5, 26), "policy_rate_repo": date(2026, 5, 1),
              "some_fiscal": date(2026, 5, 10)}
    r = assess_freshness(latest, CADENCE, CORE, TODAY, aggregate_ok_recent=True)
    assert r.core_stale is True


def test_no_recent_aggregate_trips_gate_even_if_as_of_fresh():
    latest = {"call_money_rate": date(2026, 5, 29), "tbond_5y_yield": date(2026, 5, 26),
              "policy_rate_repo": date(2026, 5, 1), "some_fiscal": date(2026, 5, 10)}
    r = assess_freshness(latest, CADENCE, CORE, TODAY, aggregate_ok_recent=False)
    assert r.core_stale is True
    assert any("aggregate" in reason for reason in r.reasons)


def test_stale_peripheral_only_yields_banner_not_skip():
    latest = {"call_money_rate": date(2026, 5, 29), "tbond_5y_yield": date(2026, 5, 26),
              "policy_rate_repo": date(2026, 5, 1),
              "some_fiscal": date(2026, 1, 1)}  # ancient, monthly window=35d -> stale, but peripheral
    r = assess_freshness(latest, CADENCE, CORE, TODAY, aggregate_ok_recent=True)
    assert r.core_stale is False
    assert r.stale_series == ["some_fiscal"]


def test_data_as_of_is_min_core_as_of():
    latest = {"call_money_rate": date(2026, 5, 29), "tbond_5y_yield": date(2026, 5, 26),
              "policy_rate_repo": date(2026, 5, 1), "some_fiscal": date(2026, 5, 10)}
    r = assess_freshness(latest, CADENCE, CORE, TODAY, aggregate_ok_recent=True)
    assert r.data_as_of == date(2026, 5, 1)  # oldest core reading
```

- [ ] **Step 2: Run to verify failure**

Run: `.venv/bin/python -m pytest tests/test_briefing_freshness.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'briefing.freshness'`.

- [ ] **Step 3: Implement**

Create `briefing/freshness.py`:
```python
"""Tiered data-freshness gate. Pure function — no I/O.

Core series stale  -> skip the whole briefing (don't publish a confident read
                      on stale data; the 'fresh as_of != fresh parse' landmine).
Peripheral stale   -> generate, but record the names so the PWA shows a banner.

A fresh as_of alone is NOT proof of fresh data (carry-forward writes today's
date onto last week's value), so the gate ALSO requires a recent successful
aggregate run (aggregate_ok_recent) for the core tier.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date

# STALE_THRESHOLDS_HOURS_BY_CADENCE (aggregate_latest.py) / 24, rounded up.
_STALE_DAYS_BY_CADENCE = {
    "daily": 1, "weekly": 8, "monthly": 35, "quarterly": 100, "fiscal_year": 400,
}
_DEFAULT_STALE_DAYS = 35


@dataclass(frozen=True)
class FreshnessResult:
    core_stale: bool
    stale_series: list[str]
    data_as_of: date
    reasons: list[str]


def _is_stale(as_of: date, cadence: str, today: date) -> bool:
    window = _STALE_DAYS_BY_CADENCE.get(cadence, _DEFAULT_STALE_DAYS)
    return (today - as_of).days > window


def assess_freshness(latest_as_of_by_metric: dict[str, date],
                     cadence_by_metric: dict[str, str],
                     core_ids: set[str],
                     today: date,
                     aggregate_ok_recent: bool) -> FreshnessResult:
    reasons: list[str] = []
    stale_series: list[str] = []
    core_stale = False

    if not aggregate_ok_recent:
        core_stale = True
        reasons.append("no successful aggregate run within window (possible carry-forward)")

    for metric_id, as_of in latest_as_of_by_metric.items():
        cadence = cadence_by_metric.get(metric_id, "monthly")
        if not _is_stale(as_of, cadence, today):
            continue
        if metric_id in core_ids:
            core_stale = True
            reasons.append(f"core metric stale: {metric_id} (as_of {as_of})")
        else:
            stale_series.append(metric_id)

    core_as_ofs = [d for m, d in latest_as_of_by_metric.items() if m in core_ids]
    data_as_of = min(core_as_ofs) if core_as_ofs else today
    return FreshnessResult(core_stale=core_stale, stale_series=sorted(stale_series),
                           data_as_of=data_as_of, reasons=reasons)
```

- [ ] **Step 4: Run to verify pass**

Run: `.venv/bin/python -m pytest tests/test_briefing_freshness.py -q`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add briefing/freshness.py tests/test_briefing_freshness.py
git commit -m "feat(briefing): tiered freshness gate (core skip, peripheral banner)"
```

---

## Task 7: `briefing/prompt.py` — digest, prompt, validator

**Files:**
- Create: `briefing/prompt.py`
- Test: `tests/test_briefing_prompt.py`

The validator enforces the integrity guarantee: `featured_anomalies[].candidate_id` must be one Python produced this run.

- [ ] **Step 1: Write the failing tests**

Create `tests/test_briefing_prompt.py`:
```python
import pytest
from briefing.prompt import build_prompt, validate_output, BriefingValidationError


VALID_IDS = {"call_money_rate:change", "tbond_5y_yield:zscore"}


def _ok_output():
    return {
        "title": "The short end is rotating",
        "body": "Three forces...",
        "featured_anomalies": [{"candidate_id": "call_money_rate:change", "why": "VAT outflow"}],
        "updated_threads": [{"id": "t-reserves", "thread": "Reserves vs IMF floor",
                             "status": "open", "since_week": "2026-W20", "note": "3rd week"}],
    }


def test_validate_accepts_good_output():
    out = validate_output(_ok_output(), VALID_IDS)
    assert out["title"] == "The short end is rotating"


def test_validate_rejects_unknown_candidate_id():
    bad = _ok_output()
    bad["featured_anomalies"][0]["candidate_id"] = "made_up_metric:change"
    with pytest.raises(BriefingValidationError, match="unknown candidate_id"):
        validate_output(bad, VALID_IDS)


def test_validate_rejects_none():
    with pytest.raises(BriefingValidationError, match="not JSON"):
        validate_output(None, VALID_IDS)


def test_validate_rejects_missing_title():
    bad = _ok_output(); del bad["title"]
    with pytest.raises(BriefingValidationError, match="title"):
        validate_output(bad, VALID_IDS)


def test_validate_rejects_bad_thread_status():
    bad = _ok_output(); bad["updated_threads"][0]["status"] = "maybe"
    with pytest.raises(BriefingValidationError, match="status"):
        validate_output(bad, VALID_IDS)


def test_build_prompt_includes_week_and_candidate_ids():
    p = build_prompt(digest={"call_money_rate": {"latest": 9.34}},
                     candidates=[{"candidate_id": "call_money_rate:change", "detail": "x"}],
                     prior_briefings=[], open_threads=[], week_of="2026-06-01")
    assert "2026-06-01" in p
    assert "call_money_rate:change" in p
```

- [ ] **Step 2: Run to verify failure**

Run: `.venv/bin/python -m pytest tests/test_briefing_prompt.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'briefing.prompt'`.

- [ ] **Step 3: Implement**

Create `briefing/prompt.py`:
```python
"""Prompt construction + output validation for the weekly briefing.

The model is a writer, not a calculator: it receives a Python-built digest and
the pre-computed anomaly candidates, and may only REFERENCE candidate ids — it
cannot invent numbers. validate_output enforces that at the data layer.
"""
from __future__ import annotations

import json
from typing import Any

_VALID_THREAD_STATUS = {"open", "resolved"}

PROMPT_TEMPLATE = """You are the desk economist for IDLC Finance PLC's ALCO. Write the weekly \
Bangladesh money-market briefing for the week of {week_of}. Audience: senior bankers.

You are given (1) a DIGEST of the latest readings + stats, (2) pre-computed ANOMALY CANDIDATES \
(the numbers are authoritative — do not recompute or invent figures), (3) the PRIOR BRIEFINGS for \
continuity, and (4) the current OPEN THREADS you have been tracking.

Return ONLY a JSON object with this exact shape:
{{
  "title": "<a sharp one-line headline>",
  "body": "<3-5 tight paragraphs; reference figures only from the digest/candidates>",
  "featured_anomalies": [{{"candidate_id": "<MUST be one of the provided candidate ids>", "why": "<one line of ALCO relevance>"}}],
  "updated_threads": [{{"id": "<stable slug>", "thread": "<short name>", "status": "open|resolved", "since_week": "<ISO week>", "note": "<follow-through>"}}]
}}

Carry forward the open threads: mark resolved ones resolved, keep live ones open with an updated note, \
and add new threads for newly material developments. Do not feature an anomaly whose candidate_id is \
not in the provided list.

DIGEST:
{digest_json}

ANOMALY CANDIDATES:
{candidates_json}

PRIOR BRIEFINGS (newest first):
{prior_briefings_json}

OPEN THREADS:
{open_threads_json}
"""


def build_prompt(*, digest: dict, candidates: list[dict], prior_briefings: list[dict],
                 open_threads: list[dict], week_of: str) -> str:
    return PROMPT_TEMPLATE.format(
        week_of=week_of,
        digest_json=json.dumps(digest, indent=2, default=str),
        candidates_json=json.dumps(candidates, indent=2, default=str),
        prior_briefings_json=json.dumps(prior_briefings, indent=2, default=str)[:120_000],
        open_threads_json=json.dumps(open_threads, indent=2, default=str),
    )


class BriefingValidationError(ValueError):
    """Raised when Claude's output is missing, not JSON, or breaks the contract."""


def validate_output(parsed: Any, valid_candidate_ids: set[str]) -> dict:
    if not isinstance(parsed, dict):
        raise BriefingValidationError("output is not JSON (parsed is None or non-object)")
    for field in ("title", "body"):
        if not isinstance(parsed.get(field), str) or not parsed[field].strip():
            raise BriefingValidationError(f"missing or empty required field: {field}")

    feats = parsed.get("featured_anomalies", [])
    if not isinstance(feats, list):
        raise BriefingValidationError("featured_anomalies must be a list")
    for f in feats:
        cid = f.get("candidate_id") if isinstance(f, dict) else None
        if cid not in valid_candidate_ids:
            raise BriefingValidationError(f"unknown candidate_id: {cid!r}")
        if not isinstance(f.get("why"), str):
            raise BriefingValidationError("featured anomaly missing 'why'")

    threads = parsed.get("updated_threads", [])
    if not isinstance(threads, list):
        raise BriefingValidationError("updated_threads must be a list")
    for t in threads:
        if not isinstance(t, dict) or t.get("status") not in _VALID_THREAD_STATUS:
            raise BriefingValidationError(f"thread has bad status: {t}")

    return parsed
```

- [ ] **Step 4: Run to verify pass**

Run: `.venv/bin/python -m pytest tests/test_briefing_prompt.py -q`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add briefing/prompt.py tests/test_briefing_prompt.py
git commit -m "feat(briefing): prompt builder + integrity-enforcing output validator"
```

---

## Task 8: `briefing/__main__.py` — orchestrator

**Files:**
- Create: `briefing/__main__.py`
- Test: `tests/test_briefing_orchestrator.py`

`main()` wires it all together and returns an exit code (0 ok / 1 fail / 2 stale). Tests mock `run_max` and the reader/writer functions (imported into the `briefing.__main__` namespace) so no network or Claude call happens.

- [ ] **Step 1: Write the failing tests**

Create `tests/test_briefing_orchestrator.py`:
```python
from datetime import date
from unittest.mock import patch
from claude_max.max_client import MaxCallResult
import briefing.__main__ as orch


def _history(metric_id, latest_value, latest_as_of="2026-05-29"):
    return [{"metric_id": metric_id, "as_of": latest_as_of, "value": latest_value},
            {"metric_id": metric_id, "as_of": "2026-05-28", "value": latest_value}]


def _patches(core_stale=False, parsed=None):
    """Common monkeypatch set for the orchestrator's collaborators."""
    fresh = orch.FreshnessResult(core_stale=core_stale, stale_series=[],
                                 data_as_of=date(2026, 5, 29), reasons=["x"] if core_stale else [])
    result = MaxCallResult(raw_text="{}", parsed=parsed, usage={}, total_cost_usd=0.0)
    return fresh, result


def test_core_stale_returns_2_and_does_not_write():
    fresh, _ = _patches(core_stale=True)
    with patch.object(orch, "_collect_history", return_value={"call_money_rate": _history("call_money_rate", 9.0)}), \
         patch.object(orch, "assess_freshness", return_value=fresh), \
         patch.object(orch, "get_recent_run_ok", return_value=False), \
         patch.object(orch, "get_recent_briefings", return_value=[]), \
         patch.object(orch, "notify") as mock_notify, \
         patch.object(orch, "upsert_briefing") as mock_write, \
         patch.object(orch, "run_max") as mock_run:
        rc = orch.main()
    assert rc == 2
    mock_write.assert_not_called()
    mock_run.assert_not_called()
    mock_notify.assert_called_once()


def test_invalid_json_returns_1_and_does_not_write():
    fresh, result = _patches(core_stale=False, parsed=None)  # parsed=None -> validation fails
    with patch.object(orch, "_collect_history", return_value={"call_money_rate": _history("call_money_rate", 9.34)}), \
         patch.object(orch, "assess_freshness", return_value=fresh), \
         patch.object(orch, "get_recent_run_ok", return_value=True), \
         patch.object(orch, "get_recent_briefings", return_value=[]), \
         patch.object(orch, "notify") as mock_notify, \
         patch.object(orch, "upsert_briefing") as mock_write, \
         patch.object(orch, "run_max", return_value=result):
        rc = orch.main()
    assert rc == 1
    mock_write.assert_not_called()
    mock_notify.assert_called_once()


def test_happy_path_writes_and_returns_0():
    parsed = {"title": "T", "body": "B",
              "featured_anomalies": [{"candidate_id": "call_money_rate:change", "why": "w"}],
              "updated_threads": []}
    fresh, result = _patches(core_stale=False, parsed=parsed)
    # series with a change >= threshold so candidate "call_money_rate:change" exists
    hist = {"call_money_rate": [
        {"metric_id": "call_money_rate", "as_of": "2026-05-29", "value": 9.34},
        {"metric_id": "call_money_rate", "as_of": "2026-05-28", "value": 7.10}]}
    with patch.object(orch, "_collect_history", return_value=hist), \
         patch.object(orch, "assess_freshness", return_value=fresh), \
         patch.object(orch, "get_recent_run_ok", return_value=True), \
         patch.object(orch, "get_recent_briefings", return_value=[]), \
         patch.object(orch, "_thresholds", return_value={"call_money_rate": 2.0}), \
         patch.object(orch, "_cadence", return_value={"call_money_rate": "daily"}), \
         patch.object(orch, "_labels", return_value={"call_money_rate": "Call Money Rate"}), \
         patch.object(orch, "notify"), \
         patch.object(orch, "upsert_briefing") as mock_write, \
         patch.object(orch, "run_max", return_value=result):
        rc = orch.main()
    assert rc == 0
    mock_write.assert_called_once()
    row = mock_write.call_args[0][0]
    assert row["week_of"]  # set
    assert row["featured_anomalies"][0]["value"] == 9.34  # Python's number, merged in
    assert row["model"]  # provenance recorded
```

- [ ] **Step 2: Run to verify failure**

Run: `.venv/bin/python -m pytest tests/test_briefing_orchestrator.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'briefing.__main__'` (or attribute errors).

- [ ] **Step 3: Implement**

Create `briefing/__main__.py`:
```python
"""Weekly ALCO briefing orchestrator. Run: `python -m briefing`.

Flow: collect history -> freshness gate -> compute anomalies -> call Claude
(writer) -> validate -> assemble row -> upsert. Returns an exit code that
wrap_run maps to run_logs.status (0 ok / 1 fail / 2 stale).
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
import sys
from datetime import date, datetime, timedelta, timezone

from claude_max.max_client import MaxCallError, run_max
from utils.notifier import notify
from utils.supabase_reader import get_metric_history, get_recent_briefings, get_recent_run_ok
from utils.supabase_writer import upsert_briefing
from briefing import config
from briefing.anomalies import compute_candidates
from briefing.freshness import FreshnessResult, assess_freshness
from briefing.prompt import BriefingValidationError, build_prompt, validate_output

logger = logging.getLogger("briefing")

MODEL = os.environ.get("BRIEFING_MODEL", "opus[1m]")
EFFORT = os.environ.get("BRIEFING_EFFORT", "xhigh")
HISTORY_DAYS = 120
PRIOR_BRIEFINGS = 8
AGGREGATE_FRESH_HOURS = 48
RUN_MAX_TIMEOUT_S = 1800

# Thin indirections so tests can patch config loading cheaply.
def _indicators() -> list[dict]:
    return config.load_indicators()
def _thresholds(indicators): return config.thresholds_by_metric(indicators)
def _cadence(indicators): return config.cadence_by_metric(indicators)
def _labels(indicators): return config.label_by_metric(indicators)


def _monday_of(d: date) -> date:
    return d - timedelta(days=d.weekday())


def _collect_history(metric_ids: list[str]) -> dict[str, list[dict]]:
    out: dict[str, list[dict]] = {}
    for mid in metric_ids:
        rows = get_metric_history(mid, days=HISTORY_DAYS)
        if rows:
            out[mid] = rows
    return out


def _latest_as_of(history: dict[str, list[dict]]) -> dict[str, date]:
    out: dict[str, date] = {}
    for mid, rows in history.items():
        if rows:
            out[mid] = date.fromisoformat(rows[0]["as_of"])
    return out


def _build_digest(history: dict[str, list[dict]], labels: dict[str, str]) -> dict:
    digest = {}
    for mid, rows in history.items():
        vals = [float(r["value"]) for r in rows if r.get("value") is not None]
        if not vals:
            continue
        digest[mid] = {
            "label": labels.get(mid, mid),
            "latest": vals[0],
            "as_of": rows[0]["as_of"],
            "n": len(vals),
            "mean_recent": round(sum(vals[:30]) / len(vals[:30]), 4),
        }
    return digest


def main() -> int:
    today = datetime.now(timezone.utc).date()
    week_of = _monday_of(today)

    indicators = _indicators()
    tracked = config.tracked_metric_ids(indicators)
    history = _collect_history(tracked)
    if not history:
        notify("error", "Weekly briefing: no metric history", "metric_history read returned nothing.")
        return 1

    aggregate_ok = get_recent_run_ok("aggregate", within_hours=AGGREGATE_FRESH_HOURS)
    fresh = assess_freshness(_latest_as_of(history), _cadence(indicators),
                             set(config.CORE_METRIC_IDS), today, aggregate_ok)
    if fresh.core_stale:
        notify("warning", "Weekly briefing skipped — core data stale",
               "Did not generate this week; keeping last good briefing.\n" + "\n".join(fresh.reasons))
        return 2  # -> run_logs status 'stale'

    candidates = compute_candidates(history, _thresholds(indicators),
                                    _cadence(indicators), _labels(indicators))
    candidate_by_id = {c.candidate_id: c for c in candidates}
    candidate_payload = [
        {"candidate_id": c.candidate_id, "metric_id": c.metric_id, "label": c.label,
         "stat": c.stat, "value": c.value, "detail": c.detail, "severity": c.severity}
        for c in candidates
    ]

    prior = get_recent_briefings(limit=PRIOR_BRIEFINGS)
    open_threads = prior[0]["open_threads"] if prior and prior[0].get("open_threads") else []
    digest = _build_digest(history, _labels(indicators))
    prompt = build_prompt(digest=digest, candidates=candidate_payload,
                          prior_briefings=prior, open_threads=open_threads, week_of=week_of.isoformat())

    try:
        result = run_max(prompt=prompt, model=MODEL, effort=EFFORT, timeout_s=RUN_MAX_TIMEOUT_S)
    except MaxCallError as e:
        notify("error", "Weekly briefing: Claude call failed", str(e))
        return 1

    try:
        out = validate_output(result.parsed, set(candidate_by_id))
    except BriefingValidationError as e:
        notify("error", "Weekly briefing: invalid model output", f"{e}\nraw: {result.raw_text[:500]}")
        return 1

    # Merge Python's authoritative numbers with Claude's curation.
    featured = []
    for f in out["featured_anomalies"]:
        c = candidate_by_id[f["candidate_id"]]
        featured.append({
            "candidate_id": c.candidate_id, "label": c.label, "stat": c.stat,
            "value": c.value, "detail": c.detail, "severity": c.severity,
            "metric_id": c.metric_id, "why": f["why"],
        })

    row = {
        "week_of": week_of.isoformat(),
        "title": out["title"],
        "body": out["body"],
        "featured_anomalies": featured,
        "open_threads": out.get("updated_threads", []),
        "data_as_of": fresh.data_as_of.isoformat(),
        "stale_series": fresh.stale_series,
        "model": MODEL,
        "effort": EFFORT,
        "total_cost_usd": result.total_cost_usd,
        "inputs_hash": hashlib.sha256(json.dumps(digest, sort_keys=True, default=str).encode()).hexdigest()[:16],
    }
    upsert_briefing(row)
    logger.info("briefing written for week_of=%s (cost=%s)", week_of, result.total_cost_usd)
    return 0


if __name__ == "__main__":
    from utils.supabase_writer import wrap_run
    sys.exit(wrap_run("briefing", "econdelta-briefing.service", main))
```

NOTE on tests vs reality: the orchestrator calls `_thresholds(indicators)` etc. with the loaded indicators. The happy-path test patches `_thresholds`/`_cadence`/`_labels` to ignore their arg and return fixtures (MagicMock side-effect ignores the positional arg), and patches `_collect_history` so no network happens. That's why the indirection wrappers exist.

- [ ] **Step 4: Run to verify pass**

Run: `.venv/bin/python -m pytest tests/test_briefing_orchestrator.py -q`
Expected: PASS (3 tests). Then run the whole briefing suite:
`.venv/bin/python -m pytest tests/test_briefing_*.py -q` → all green.

- [ ] **Step 5: Commit**

```bash
git add briefing/__main__.py tests/test_briefing_orchestrator.py
git commit -m "feat(briefing): weekly orchestrator (gate -> claude -> validate -> upsert)"
```

---

## Task 9: systemd deploy units + install.sh

**Files:**
- Create: `deploy/econdelta-briefing.service`
- Create: `deploy/econdelta-briefing.timer`
- Create: `deploy/econdelta-briefing.service.d/10-claude-json-writable.conf`
- Modify: `deploy/install.sh` (enable loop)

No pytest here; verification is `systemd-analyze` + a dry run.

- [ ] **Step 1: Create the service** `deploy/econdelta-briefing.service`

```ini
[Unit]
Description=EconDelta — Weekly ALCO briefing (Opus 4.8 1M, xhigh)
Documentation=https://github.com/clauding-lab/econdelta
After=network-online.target
Wants=network-online.target
StartLimitIntervalSec=3600
StartLimitBurst=2

[Service]
Type=oneshot
User=adnan-local
Group=adnan-local
WorkingDirectory=/home/adnan-local/econdelta
EnvironmentFile=/etc/econdelta.env
Environment="CLAUDE_BINARY=/usr/bin/claude"
ExecStart=/home/adnan-local/econdelta/.venv/bin/python -m briefing

MemoryMax=1500M
MemoryHigh=1200M
CPUQuota=200%
TasksMax=512

PrivateTmp=true
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/home/adnan-local/econdelta/data /home/adnan-local/econdelta/logs /home/adnan-local/.claude

TimeoutStartSec=3600
Restart=on-failure
RestartSec=600

StandardOutput=append:/home/adnan-local/econdelta/logs/briefing-systemd.log
StandardError=append:/home/adnan-local/econdelta/logs/briefing-systemd.log
SyslogIdentifier=econdelta-briefing

[Install]
WantedBy=multi-user.target
```

- [ ] **Step 2: Create the timer** `deploy/econdelta-briefing.timer`

```ini
[Unit]
Description=Run EconDelta weekly ALCO briefing Mondays at 01:00 UTC (07:00 BDT) — uses the prior week's confirmed-fresh aggregate; freshness gate guards staleness
Requires=econdelta-briefing.service

[Timer]
OnCalendar=Mon *-*-* 01:00:00 UTC
Persistent=true
RandomizedDelaySec=120

[Install]
WantedBy=timers.target
```

- [ ] **Step 3: Create the EROFS drop-in** `deploy/econdelta-briefing.service.d/10-claude-json-writable.conf`

```ini
[Service]
# The claude CLI writes ~/.claude.json each run; ProtectHome=read-only blocks it
# (EROFS) and fails the briefing. The .claude/ dir is carved out in the unit body;
# this adds the sibling .json file. See AGENT_LEARNINGS 2026-05-29.
ReadWritePaths=/home/adnan-local/.claude.json
```

- [ ] **Step 4: Add the timer to install.sh's enable loop**

In `deploy/install.sh`, the enable loop (around lines 83-85) is a hardcoded list. Add `econdelta-briefing`:
```bash
for t in econdelta-forex econdelta-commodity econdelta-aggregate econdelta-dse econdelta-fetch econdelta-parse \
         econdelta-forex-retry econdelta-aggregate-retry econdelta-parse-retry econdelta-briefing; do
  systemctl enable --now "${t}.timer"
done
```
(The copy step is glob-based so the new unit + drop-in are auto-copied; only the enable loop needs the edit.)

- [ ] **Step 5: Verify locally (syntax + calendar)**

Run:
```bash
cd ~/Projects/clauding-lab/econdelta
systemd-analyze verify deploy/econdelta-briefing.service 2>&1 || echo "(verify needs systemd; run on the box if unavailable on macOS)"
systemd-analyze calendar 'Mon *-*-* 01:00:00 UTC' 2>&1 || echo "(run on the box)"
bash -n deploy/install.sh && echo "install.sh syntax OK"
```
Expected: `install.sh syntax OK`. `systemd-analyze` is Linux-only — if on macOS, defer those two to the box (they must be run there before enabling).

- [ ] **Step 6: Commit**

```bash
git add deploy/econdelta-briefing.service deploy/econdelta-briefing.timer \
        deploy/econdelta-briefing.service.d/10-claude-json-writable.conf deploy/install.sh
git commit -m "feat(deploy): weekly briefing systemd service + timer (Mon 01:00 UTC)"
```

---

## Task 10: AGENTS.md landmines + full-suite green

**Files:**
- Modify: `AGENTS.md` (append numbered landmines)
- (no new code)

- [ ] **Step 1: Append landmines to `AGENTS.md`**

Add three entries to the landmine list (match the file's existing numbered style):
1. *No Supabase read helper exists* — Python has only POST/PATCH writers; reads are hand-rolled GETs in `utils/supabase_reader.py`. Daily `metric_history` has no anon-read RLS → the briefing job reads with the **service-role** key.
2. *Any claude-calling unit needs the `~/.claude.json` drop-in* — copy `deploy/econdelta-briefing.service.d/10-claude-json-writable.conf` or the run fails with EROFS under `ProtectHome=read-only`.
3. *install.sh enable loop is hardcoded, not glob* — a new `econdelta-*.timer` is copied but NOT enabled unless added to the loop at install.sh:83-85.

- [ ] **Step 2: Run the entire suite**

Run: `.venv/bin/python -m pytest -q`
Expected: all tests pass (existing + the ~22 new briefing tests). If anything in the existing suite broke, fix the cause (do not edit unrelated tests).

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs(agents): briefing-job landmines (no read helper, claude-json drop-in, enable loop)"
```

---

## Deferred to deploy-time (not part of TDD; do with Adnan on the box)

These need the live VPS and are out of scope for the code tasks above:
- Apply `0008_briefings.sql` to the shared Supabase (Task 1 Step 3) if not already done.
- Confirm `claude --model opus[1m] --effort xhigh` is accepted by the box's pinned CLI version (per auto-memory `reference_opus_1m_model_alias.md`); if not, set `BRIEFING_MODEL` in `/etc/econdelta.env`.
- `git pull` on the box → `sudo bash deploy/install.sh` → `systemctl daemon-reload` → confirm `systemctl list-timers econdelta-briefing.timer`.
- One **live smoke run**: `sudo systemctl start econdelta-briefing.service` then tail `logs/briefing-systemd.log` and confirm a `briefings` row appears + a `run_logs` row with `source='briefing' status='ok'`.

---

## Self-Review

**1. Spec coverage:**
- Briefing generation by Claude on the VPS, weekly Monday → Task 8 + Task 9 (timer). ✔
- Real anomalies (hybrid: Python numbers, Claude curation) → Tasks 5 + 7 (integrity validator) + 8 (merge). ✔
- Persistent memory (prior briefings + open_threads) → Task 8 reads `get_recent_briefings`, injects threads, stores `updated_threads`. ✔
- Freshness gate (tiered) → Task 6 + wired in Task 8 (return 2 on core stale; `stale_series` carried to the row). ✔
- Honesty (`data_as_of`, `stale_series`) → stored in Task 1 columns, populated in Task 8. ✔ (Badge gating itself is Plan B / display.)
- Opus 4.8 (1M) xhigh → Task 8 `MODEL`/`EFFORT` passed to `run_max`. ✔
- Storage table + anon read → Task 1. ✔
- No regenerate/tone → N/A here (display concern, Plan B).
- New Supabase read helper (spec gap found in mapping) → Task 2. ✔

**2. Placeholder scan:** No "TBD/TODO/add error handling here". The one assumption (exact core metric_id strings) has an explicit verification (Step 0b) and a fix location (Task 4). Deploy-time items are explicitly carved out, not hidden placeholders.

**3. Type consistency:** `AnomalyCandidate` fields (Task 5) match what Task 8 reads (`c.candidate_id/metric_id/label/stat/value/detail/severity`). `FreshnessResult` fields (Task 6) match Task 8 usage (`.core_stale/.stale_series/.data_as_of/.reasons`). `validate_output(parsed, valid_ids)` signature (Task 7) matches the Task 8 call. `upsert_briefing(row, ...)` (Task 3) matches the Task 8 call. Reader function names (Task 2) match Task 8 imports. `run_max(prompt=, model=, effort=, timeout_s=)` matches the real keyword-only signature. ✔
