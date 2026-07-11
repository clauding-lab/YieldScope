# Remove Always-Demo Panels — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the 7 always-fake panels that survived the de-demo batch (owner decision 2026-07-11: remove entirely, no empty-state, no layout backfill) across Banking, Fiscal, and Macro, plus their local fixture consts and orphaned imports.

**Architecture:** Frontend-only. Each panel uses HARDCODED consts inside its page file (`src/data/fixtures.ts` is already curve+auctions-only). Removal = delete the JSX section + its local const(s) + any now-orphaned import; `tsc`/`lint`/tests catch stragglers. One panel (Fiscal desktop) shares a grid cell with LIVE stats, so it reflows rather than plain-deletes.

**Tech Stack:** React 19 + Vite + TypeScript, Vitest + @testing-library/react. Deploy: GitHub Pages via `deploy.yml` on push to main.

## Global Constraints

- Gate for every task: `npm run test:run && npm run lint && npm run build` — run each bare, redirect to a file, check exit code. NEVER pipe a gate through `tail`/`head`/`grep` (house hook blocks it).
- Delete ONLY the always-demo panels. LEAVE untouched: conditional badges gated on a null live value, and the offline curve/auctions fixture fallbacks.
- After deleting a section, remove ONLY the imports/consts/helpers your deletion orphaned — verify each with grep + let lint/build confirm. Do not remove anything still used elsewhere.
- Run `git push` standalone (house push-guard). Branch → PR → per-action merge approval; never push main.
- Immutability, no `any`, interfaces for props (house TS rules).

## Delivery

One PR: `feat/remove-demo-panels` → main. Tasks 1–4 on one branch; final whole-branch review; visual verification of Banking/Fiscal/Macro at 320/768/1440 before merge.

---

### Task 1: Banking — remove NPL-by-segment, Top-10 heatmap, NPL trajectory, deposits donut

**Files:**
- Modify: `src/pages/Banking.tsx`
- Test: `src/pages/Banking.test.tsx` (extend)

**Interfaces:** none (deletions only).

- [ ] **Step 1: Write the failing test**

Add to `src/pages/Banking.test.tsx` (mirror its existing `useIsDesktop`/`useBanking` mock setup):

```tsx
describe('Banking · demo panels removed', () => {
  it.each([[false], [true]])('desktop=%s: no fixture panels', (desktop) => {
    vi.mocked(useIsDesktop).mockReturnValue(desktop)
    // arrange useBanking to return live-ish data (mirror the file's BASE fixture)
    render(<Banking />)
    expect(screen.queryByText(/NPL by segment/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Top 10 banks/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/NPL trajectory/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/deposits · by ownership/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/All 60 banks/i)).not.toBeInTheDocument() // dead Export/All-60 buttons went with the heatmap
    // a surviving live section still renders in BOTH views (the interbank-repo tile is present mobile + desktop):
    expect(screen.getAllByText(/Interbank repo · volume/i).length).toBeGreaterThanOrEqual(1)
  })
})
```

- [ ] **Step 2: Run it — must fail**

Run: `npx vitest run src/pages/Banking.test.tsx > /tmp/t1.out 2>&1; echo exit=$?` → `exit=1` (fixture panels still render).

- [ ] **Step 3: Delete the panels + consts**

In `src/pages/Banking.tsx`:
- **Mobile** (`BankingMobile`): delete the "NPL by segment" section — the `<div style={{ padding: '12px 22px 28px' }}>` block containing `<div className="eyebrow">NPL by segment</div>` + `<DemoBadge/>` + the `{NPL_BY_SEG.map(...)}` (currently ~lines 130-150). Leave the "Capital adequacy" prudential section that follows.
- **Desktop** (`BankingDesktop`): delete the "Top 10 banks · Basel-III & asset quality" section (the `<div style={{ height: 1 ... }}>` divider + the `<div style={{ padding: '36px 48px' }}>` block with the `<Heatmap rows={TOP_BANKS...}>` and the "All 60 banks"/"Export" buttons, ~lines 245-287). Then delete the following divider + the 2-column grid holding BOTH "NPL trajectory · by segment" (SlopeChart) and "System deposits · by ownership" (Donut) (~lines 289-331).
- Delete the top-of-file consts: `NPL_BY_SEG`, `TOP_BANKS`, `RANGES`, `bankColor`, `SLOPE_ITEMS`, `DEPOSIT_SEGMENTS`, `DEPOSIT_LEGEND`.
- Fix imports (line 4-5): remove `Donut`, `DonutLegend`, `Heatmap`, `SlopeChart` from `../components/charts` (KEEP `AreaChart`), and remove `import type { SlopeItem } from '../components/charts/SlopeChart'`. Grep for `severityColor` — if its only use was the deleted NPL_BY_SEG Bar, remove its import/definition too. KEEP `Bar` (still used by the prudential CAR bar).

- [ ] **Step 4: Run test + full gate**

```
npx vitest run src/pages/Banking.test.tsx > /tmp/t1b.out 2>&1; echo test=$?   # 0
npm run test:run > /tmp/g1.out 2>&1; echo alltests=$?                          # 0
npm run lint > /tmp/g1l.out 2>&1; echo lint=$?                                 # 0 (catches orphaned imports/consts)
npm run build > /tmp/g1b.out 2>&1; echo build=$?                               # 0
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/Banking.tsx src/pages/Banking.test.tsx
git commit -m "feat(banking): remove NPL-by-segment, top-10 heatmap, NPL trajectory, deposits donut (no per-bank source)"
```

---

### Task 2: Fiscal — remove the fiscal-pressure composite (mobile bar + desktop gauge)

**Files:**
- Modify: `src/pages/Fiscal.tsx`
- Test: `src/pages/Fiscal.test.tsx` (extend)

**Interfaces:** none new. The LIVE NBR-revenue / Debt-GDP / Net-dom-borrow ListRows that currently sit in the desktop gauge's right cell MUST survive.

- [ ] **Step 1: Write the failing test**

Add to `src/pages/Fiscal.test.tsx` (uses its existing `useFiscal`/`useIsDesktop` mocks + `BASE`):

```tsx
describe('Fiscal · pressure composite removed', () => {
  it.each([[false], [true]])('desktop=%s: no fiscal-pressure gauge, live stats survive', (desktop) => {
    vi.mocked(useIsDesktop).mockReturnValue(desktop)
    render(<Fiscal />)
    expect(screen.queryByText(/Fiscal pressure/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Elevated\.$/)).not.toBeInTheDocument()
    // live fiscal stats still render (they were nested in the gauge's right cell on desktop):
    expect(screen.getAllByText(/NBR revenue · FYTD/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Debt \/ GDP/i).length).toBeGreaterThanOrEqual(1)
  })
})
```

- [ ] **Step 2: Run it — must fail**

Run: `npx vitest run src/pages/Fiscal.test.tsx > /tmp/t2.out 2>&1; echo exit=$?` → `exit=1`.

- [ ] **Step 3: Implement**

In `src/pages/Fiscal.tsx`:
- **Mobile** (`FiscalMobile`): delete the "Fiscal pressure · composite" block — the `<div style={{ padding: '0 22px 28px' }}>` containing the "Fiscal pressure · composite" caption + `<DemoBadge/>` + the `68` / `100` number + the `<Bar value={68} .../>` + Low/Stress/Crisis labels (~lines 29-47).
- **Desktop** (`FiscalDesktop`): the gauge sits in a 2-column grid whose RIGHT cell holds the LIVE stats card. REFLOW it — replace the whole grid container (the `<div style={{ padding: '40px 48px 32px', display: 'grid', gridTemplateColumns: '1fr 1.2fr', ... }}>` ~lines 103-139) with a single-column section that keeps ONLY the live stats card, dropping the `<RadialGauge value={68} .../>` cell and the "Fiscal pressure index" eyebrow + `<DemoBadge/>` + `<h2 ...>Elevated.</h2>` verdict:

```tsx
      <div style={{ padding: '40px 48px 32px' }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Key fiscal metrics</div>
        <div className="card-flat" style={{ padding: 18, maxWidth: 540 }}>
          <ListRow
            label={nbrFytdCr == null ? demoLabel('NBR revenue · FYTD') : 'NBR revenue · FYTD'}
            value={nbrFytdCr != null ? `${(nbrFytdCr / 1000).toFixed(1)} k Cr` : '—'}
            sub={monthLabel(data?.nbrFytdAsOf ?? null) ?? undefined}
          />
          <ListRow
            label={debtGdpRatio == null ? demoLabel('Debt / GDP') : 'Debt / GDP'}
            value={debtGdpRatio != null ? `${debtGdpRatio}%` : '—'}
            sub={debtGdpRatio != null && debtGdpAsOf ? `FY${debtGdpAsOf.slice(0, 4)}` : undefined}
          />
          <ListRow
            label={domesticBorrowingCr == null ? demoLabel('Net dom. borrow') : 'Net dom. borrow'}
            value={domesticBorrowingCr != null ? `${(domesticBorrowingCr / 1000).toFixed(1)} k Cr` : '—'}
            last
          />
        </div>
      </div>
```

(Preserve the exact ListRow contents — copy them from the current right cell; only the wrapper grid + gauge + verdict change.)
- Fix imports: remove `RadialGauge` from `../components/charts` (KEEP `AreaChart`). Grep for `Bar` — if the mobile composite `<Bar value={68}>` was its only use in Fiscal, remove `Bar` from the primitives import too.

- [ ] **Step 4: Run test + full gate**

```
npx vitest run src/pages/Fiscal.test.tsx > /tmp/t2b.out 2>&1; echo test=$?   # 0
npm run test:run > /tmp/g2.out 2>&1; echo alltests=$?                          # 0
npm run lint > /tmp/g2l.out 2>&1; echo lint=$?                                 # 0
npm run build > /tmp/g2b.out 2>&1; echo build=$?                               # 0
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/Fiscal.tsx src/pages/Fiscal.test.tsx
git commit -m "feat(fiscal): remove fiscal-pressure composite gauge (methodology undefined); keep live stats"
```

---

### Task 3: Macro — remove Core CPI row + CPI-components heatmap; drop the "April" vintage

**Files:**
- Modify: `src/pages/Macro.tsx`
- Test: `src/pages/Macro.test.tsx` (extend or create, mirroring an existing page test's mock setup)

**Interfaces:** none new. The LIVE Food / Non-food CPI rows and the headline CPI number must survive.

- [ ] **Step 1: Write the failing test**

```tsx
describe('Macro · Core CPI + heatmap removed', () => {
  it.each([[false], [true]])('desktop=%s: no fabricated CPI surfaces', (desktop) => {
    vi.mocked(useIsDesktop).mockReturnValue(desktop)
    render(<Macro />)
    expect(screen.queryByText(/CPI components/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Core$/)).not.toBeInTheDocument()       // fabricated Core row gone
    expect(screen.queryByText(/· April/)).not.toBeInTheDocument()      // hardcoded vintage gone
  })
  it('keeps the live Food and Non-food CPI rows (mobile)', () => {
    vi.mocked(useIsDesktop).mockReturnValue(false)
    render(<Macro />)
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Non-food')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it — must fail**

Run: `npx vitest run src/pages/Macro.test.tsx > /tmp/t3.out 2>&1; echo exit=$?` → `exit=1`.

- [ ] **Step 3: Implement**

In `src/pages/Macro.tsx`:
- **Mobile** (`MacroMobile`): (a) in the CPI card, delete the middle `<ListRow label={<span ...>Core <DemoBadge /></span> ...} value="—" />` (~lines 128-131) — leave the `Food` and `Non-food` ListRows (Non-food keeps `last`). (b) Change the caption `<div className="caption">CPI · headline · April</div>` (~line 109) to `<div className="caption">CPI · headline</div>` (drop the hardcoded "· April"; if a live CPI as-of field exists on `data`, use `monthLabel(...)` instead — otherwise just drop it).
- **Desktop** (`MacroDesktop`): delete the "CPI components · 8-month trajectory" section — the `<div style={{ height: 1 ... }}>` divider + the `<div style={{ padding: '36px 48px' }}>` block with the `<Heatmap rows={CPI_ROWS} ...>` (~lines 269-293). Delete the local vars `const cpiHeatmapData = ...` and `const cpiHeatmapCols = ...` (~lines 199-200).
- Delete the top-of-file consts/helpers now orphaned: `CPI_ROWS`, `CORE_CPI_FIXTURE`, `CPI_COLS_FALLBACK`, `buildCpiHeatmapData`, `buildCpiHeatmapCols`, and `cpiColor` (the heatmap's `getColor`). Remove `Heatmap` from the `../components/charts` import (KEEP `AreaChart`). Grep to confirm none are referenced elsewhere before deleting.

- [ ] **Step 4: Run test + full gate**

```
npx vitest run src/pages/Macro.test.tsx > /tmp/t3b.out 2>&1; echo test=$?   # 0
npm run test:run > /tmp/g3.out 2>&1; echo alltests=$?                         # 0
npm run lint > /tmp/g3l.out 2>&1; echo lint=$?                                # 0
npm run build > /tmp/g3b.out 2>&1; echo build=$?                              # 0
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/Macro.tsx src/pages/Macro.test.tsx
git commit -m "feat(macro): remove Core CPI row + CPI-components heatmap; drop hardcoded April vintage"
```

---

### Task 4: Docs — reconcile AGENTS.md landmines + changelog

**Files:**
- Modify: `AGENTS.md`, `CHANGELOG.md`, `package.json`

- [ ] **Step 1: Update AGENTS.md**

- **Landmine 29** (the "Several panels stay Demo BY DESIGN" entry): move the now-removed panels out of the demo list and note they were REMOVED 2026-07-11 — NPL-by-segment, top-10-banks heatmap, NPL trajectory by segment, deposits-by-ownership donut, fiscal-pressure composite gauge, Core CPI, CPI-components 8-month heatmap. State the current truth: after this change, the ONLY remaining demo surfaces are the offline curve/auctions fixture fallbacks (everything else is live-or-honestly-empty). Preserve the landmine number.
- **Landmine 19** (if it references NPL/deposits/heatmap semantics as reasons to leave a panel demo): reconcile — those panels no longer exist. Leave the `interbank_repo_data` / `bop_summary` guidance intact.

- [ ] **Step 2: Changelog + version**

- `CHANGELOG.md`: add an entry — "Removed the 7 always-demo panels (Banking NPL-by-segment / top-10 heatmap / NPL trajectory / deposits donut; Fiscal pressure gauge; Macro Core CPI + CPI-components heatmap) and their fixtures; dropped the hardcoded Macro 'April' vintage. Also removed the dead 'All 60 banks'/'Export' buttons that lived on the top-10 heatmap."
- `package.json`: bump version by a MINOR (3.1.0 → 3.2.0).

- [ ] **Step 3: Full gate**

```
npm run test:run > /tmp/g4.out 2>&1; echo alltests=$?   # 0
npm run lint > /tmp/g4l.out 2>&1; echo lint=$?          # 0
npm run build > /tmp/g4b.out 2>&1; echo build=$?         # 0
```

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md CHANGELOG.md package.json
git commit -m "docs: reconcile AGENTS landmines + changelog for demo-panel removal; v3.2.0"
```

---

## Verification after implementation

1. Full gate green on the branch head.
2. **Visual verification** (discipline #3 — these are layout changes): serve the build and screenshot Banking, Fiscal, Macro at 320 / 768 / 1440. Confirm no gutted/broken layout — no orphaned grid cell, dangling divider, or empty section header where a panel was removed. Pay special attention to `BankingDesktop` (lost 4 panels → should end cleanly after the interbank-repo chart) and `FiscalDesktop` (the reflowed single-column stats card).
3. After merge: watch the Pages deploy to completion; spot-check prod with the PWA service worker bypassed (unregister SW + clear caches before reload — see the `reference_playwright_fullpage_demo_artifact` memory).
