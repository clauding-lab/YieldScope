import type { ReactNode } from 'react'
import { useIsDesktop } from '../lib/hooks'
import { Delta, DemoBadge, ListRow, SectionTitle, Sparkline } from '../components/primitives'
import { AreaChart, Heatmap } from '../components/charts'
import { DesktopHeader } from '../components/layout/DesktopHeader'
import { useMacro } from '../hooks/useMacro'
import { monthLabel } from '../lib/dates'
import { roundTo } from '../lib/yieldMath'

const CPI_ROWS = ['Food', 'Non-food', 'Core', 'Headline']
const CORE_CPI_FIXTURE = [8.40, 8.32, 8.18, 8.04, 7.94, 7.82, 7.74, 7.62]
const CPI_COLS_FALLBACK = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']

function padOrTrim<T>(arr: T[], len: number, fill: T): T[] {
  if (arr.length === len) return arr
  if (arr.length > len) return arr.slice(-len)
  return [...Array(len - arr.length).fill(fill), ...arr]
}

function buildCpiHeatmapData(data: ReturnType<typeof useMacro>['data']): number[][] {
  const food = data?.foodHist?.length ? padOrTrim(data.foodHist, 8, NaN) : CORE_CPI_FIXTURE
  const nonFood = data?.nonFoodHist?.length ? padOrTrim(data.nonFoodHist, 8, NaN) : CORE_CPI_FIXTURE
  const headline = data?.cpiHist?.length ? padOrTrim(data.cpiHist, 8, NaN) : CORE_CPI_FIXTURE
  return [food, nonFood, CORE_CPI_FIXTURE, headline]
}

function buildCpiHeatmapCols(data: ReturnType<typeof useMacro>['data']): string[] {
  const months = data?.cpiMonths?.filter(Boolean) ?? []
  return months.length === 8 ? months : CPI_COLS_FALLBACK
}

function cpiColor(v: number) {
  const pct = Math.max(0, Math.min(1, (v - 7.5) / (11.5 - 7.5)))
  if (pct > 0.66) return { bg: `rgba(213, 143, 118, ${0.25 + pct * 0.4})`,  fg: 'var(--neg)' }
  if (pct > 0.33) return { bg: `rgba(215, 184, 114, ${0.22 + pct * 0.35})`, fg: 'var(--warn)' }
  return { bg: `rgba(146, 176, 149, ${0.18 + (1 - pct) * 0.25})`, fg: 'var(--pos)' }
}

interface BopItem {
  lbl: string
  v: string
  u: string
  d: string
}

function fmtUsdBn(n: number | null | undefined): string {
  return n != null ? n.toFixed(2) : '—'
}

type MacroDataT = ReturnType<typeof useMacro>['data']

function buildBopItems(data: MacroDataT): BopItem[] {
  return [
    { lbl: 'Remittances',  v: fmtUsdBn(data?.remitMonthlyUsdBn),  u: 'USD bn · monthly', d: '' },
    { lbl: 'Exports',      v: fmtUsdBn(data?.exportMonthlyUsdBn), u: 'USD bn · monthly', d: '' },
    { lbl: 'Imports',      v: fmtUsdBn(data?.importMonthlyUsdBn), u: 'USD bn · monthly', d: '' },
    // current_account_balance — NOT bop_summary (landmine 19); negative = deficit is valid.
    { lbl: 'Current acct', v: fmtUsdBn(data?.currentAccountUsdBn), u: 'USD bn', d: '' },
  ]
}

// All four BoP legs live → the panel is no longer demo.
function bopAllLive(data: MacroDataT): boolean {
  return data?.remitMonthlyUsdBn != null && data?.exportMonthlyUsdBn != null
    && data?.importMonthlyUsdBn != null && data?.currentAccountUsdBn != null
}

interface CommodityRow {
  c: string
  v: string
  u: string
  d: number | null   // price delta vs prior point; null when no real history (no fabricated trend)
  spark: number[]     // live history only; sparkline renders only when length >= 2
}

function buildCommodities(data: MacroDataT): CommodityRow[] {
  const brentVal = data?.brentUsdBarrel
  const brentSpark = data?.brentHist ?? []
  // Round at source — <Delta /> renders the value verbatim, so a raw float
  // subtraction leaks artifacts like +0.350006103515625 (landmine 17).
  const brentDelta = brentSpark.length >= 2
    ? roundTo(brentSpark[brentSpark.length - 1] - brentSpark[brentSpark.length - 2], 2)
    : null
  // LNG / Wheat / Palm: World Bank pink sheet, USD. Only one monthly point lands today,
  // so there's no live history → no sparkline, no delta (never fabricated).
  return [
    { c: 'Brent',    v: brentVal != null ? brentVal.toFixed(2) : '—',        u: 'USD/bbl',   d: brentDelta, spark: brentSpark },
    { c: 'LNG',      v: data?.lngUsd != null ? data.lngUsd.toFixed(2) : '—', u: 'USD/MMBtu', d: null,       spark: [] },
    { c: 'Wheat',    v: data?.wheatUsd != null ? data.wheatUsd.toFixed(2) : '—', u: 'USD/MT', d: null,       spark: [] },
    { c: 'Palm oil', v: data?.palmOilUsd != null ? data.palmOilUsd.toFixed(2) : '—', u: 'USD/MT', d: null,   spark: [] },
  ]
}

function commoditiesAllLive(data: MacroDataT): boolean {
  return data?.brentUsdBarrel != null && data?.lngUsd != null
    && data?.wheatUsd != null && data?.palmOilUsd != null
}

function MacroMobile() {
  const { data } = useMacro()
  const bopItems = buildBopItems(data)
  const importVintage = monthLabel(data?.importCoverAsOf)
  const fmtPct = (n: number | null | undefined) => n != null ? `${n.toFixed(2)}%` : '—'
  return (
    <>
      <SectionTitle kicker="Inflation · reserves · BoP" title="Macro" />

      <div style={{ padding: '0 22px 28px' }}>
        <div className="caption">CPI · headline · April</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
          <span className="serif-num" style={{ fontSize: 64 }}>{data?.cpiHeadline?.toFixed(2) ?? '—'}</span>
          <span className="caption">% YoY</span>
        </div>
        {data?.cpiHist?.length ? (
          <div style={{ marginTop: 18 }}>
            <AreaChart data={data.cpiHist} w={346} h={80} color="var(--accent)" />
          </div>
        ) : null}
      </div>

      <div style={{ padding: '0 16px 24px' }}>
        <div className="card-flat">
          <ListRow
            label="Food"
            value={fmtPct(data?.cpiFood)}
            sub={data?.foodHist?.length ? <Sparkline data={data.foodHist} w={80} h={16} color="var(--neg)" /> as ReactNode : undefined}
          />
          <ListRow
            label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>Core <DemoBadge /></span> as ReactNode}
            value="—"
          />
          <ListRow
            label="Non-food"
            value={fmtPct(data?.cpiNonFood)}
            sub={data?.nonFoodHist?.length ? <Sparkline data={data.nonFoodHist} w={80} h={16} color="var(--pos)" /> as ReactNode : undefined}
            last
          />
        </div>
      </div>

      <div style={{ padding: '12px 22px 28px' }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>FX reserves · BPM6</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="serif-num" style={{ fontSize: 36, color: 'var(--neg)' }}>{data?.fxReservesUsdBn?.toFixed(2) ?? '—'}</span>
              <span className="caption">USD bn</span>
            </div>
          </div>
        </div>
        {data?.importCoverMonths != null && (
          <div className="caption" style={{ marginTop: 8 }}>{data.importCoverMonths.toFixed(1)} mo import cover{importVintage ? ` · ${importVintage}` : ''}</div>
        )}
        {data?.fxResHist?.length ? (
          <div style={{ marginTop: 16 }}>
            <AreaChart data={data.fxResHist} w={346} h={80} color="var(--neg)" />
          </div>
        ) : null}
      </div>

      <div style={{ padding: '0 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 22px 10px' }}>
          <div className="caption">Balance of payments</div>
          {!bopAllLive(data) && <DemoBadge />}
        </div>
        <div className="card-flat">
          {bopItems.map((b, i, arr) => (
            <div
              key={b.lbl}
              style={{
                padding: '16px 22px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div>
                <div className="caption">{b.lbl}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                  <span className="serif-num" style={{ fontSize: 22 }}>{b.v}</span>
                  <span className="caption">{b.u}</span>
                </div>
              </div>
              {b.d && <span className="caption">{b.d}</span>}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function MacroDesktop() {
  const { data } = useMacro()
  const bopItems = buildBopItems(data)
  const commodities = buildCommodities(data)
  const cpiHeatmapData = buildCpiHeatmapData(data)
  const cpiHeatmapCols = buildCpiHeatmapCols(data)
  const usdBdtChartData = data?.usdBdtHist?.length ? data.usdBdtHist : null
  const usdDelta = (data?.usdBdtHist && data.usdBdtHist.length >= 2)
    ? roundTo(data.usdBdtHist[data.usdBdtHist.length - 1] - data.usdBdtHist[data.usdBdtHist.length - 2], 2)
    : null
  const reerVintage = monthLabel(data?.reerAsOf)
  const importVintage = monthLabel(data?.importCoverAsOf)
  return (
    <>
      <DesktopHeader section="Macro" breadcrumb="YieldScope · Inflation, reserves, balance of payments" />

      <div
        style={{
          padding: '40px 48px 32px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 48,
        }}
      >
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Inflation · April</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="serif-num" style={{ fontSize: 72 }}>{data?.cpiHeadline?.toFixed(2) ?? '—'}</span>
            <span className="caption">% YoY</span>
          </div>
          {data?.cpiHist?.length ? (
            <div style={{ marginTop: 20 }}>
              <AreaChart data={data.cpiHist} w={540} h={140} color="var(--accent)" />
            </div>
          ) : null}
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>FX reserves · BPM6</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="serif-num" style={{ fontSize: 72, color: 'var(--neg)' }}>{data?.fxReservesUsdBn?.toFixed(2) ?? '—'}</span>
            <span className="caption">USD bn</span>
          </div>
          {data?.importCoverMonths != null && (
            <div className="caption" style={{ marginTop: 6 }}>{data.importCoverMonths.toFixed(1)} mo import cover{importVintage ? ` · ${importVintage}` : ''}</div>
          )}
          {data?.fxResHist?.length ? (
            <div style={{ marginTop: 20 }}>
              <AreaChart data={data.fxResHist} w={540} h={140} color="var(--neg)" />
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div style={{ padding: '36px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <div className="eyebrow">Balance of payments · monthly flows</div>
          {!bopAllLive(data) && <DemoBadge />}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
          {bopItems.map(b => (
            <div key={b.lbl}>
              <div className="caption">{b.lbl}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                <span className="serif-num" style={{ fontSize: 40 }}>{b.v}</span>
                <span className="caption">{b.u}</span>
              </div>
              {b.d && <div className="caption" style={{ marginTop: 4 }}>{b.d}</div>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div style={{ padding: '36px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div className="eyebrow">CPI components · 8-month trajectory</div>
              <DemoBadge />
            </div>
            <h3 className="display" style={{ fontSize: 22, margin: 0 }}>Where the heat is leaving</h3>
          </div>
          <div className="caption">YoY %, by month</div>
        </div>
        <div className="card-flat" style={{ padding: '22px 24px' }}>
          <Heatmap
            rows={CPI_ROWS}
            cols={cpiHeatmapCols}
            data={cpiHeatmapData}
            leftW={100}
            cellH={36}
            fmt={v => Number.isFinite(v) ? v.toFixed(2) : '—'}
            getColor={cpiColor}
          />
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div
        style={{
          padding: '36px 48px 48px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div className="eyebrow">Commodity exposure · import bill</div>
            {!commoditiesAllLive(data) && <DemoBadge />}
          </div>
          <div className="card-flat">
            {commodities.map((c, i, arr) => (
              <div
                key={c.c}
                style={{
                  padding: '14px 22px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
                  display: 'grid',
                  gridTemplateColumns: '90px 1fr 90px 70px',
                  gap: 16,
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 14, color: 'var(--ink)' }}>{c.c}</span>
                {c.spark.length >= 2
                  ? <Sparkline data={c.spark} w={200} h={20} />
                  : <span />}
                <div style={{ textAlign: 'right' }}>
                  <div className="serif-num" style={{ fontSize: 18 }}>{c.v}</div>
                  <div className="caption">{c.u}</div>
                </div>
                <Delta value={c.d} invert size="sm" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div className="eyebrow">USD / BDT · mid-rate</div>
            {data?.usdBdt == null && <DemoBadge />}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="serif-num" style={{ fontSize: 56 }}>{data?.usdBdt?.toFixed(2) ?? '—'}</span>
            {usdDelta != null && <Delta value={usdDelta} size="md" />}
          </div>
          {data?.reer != null && (
            <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
              <span className="caption">REER {data.reer.toFixed(1)}{reerVintage ? ` · ${reerVintage}` : ''}</span>
            </div>
          )}
          {usdBdtChartData ? (
            <div style={{ marginTop: 20 }}>
              <AreaChart data={usdBdtChartData} w={540} h={130} color="var(--info)" />
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

export default function Macro() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <MacroDesktop /> : <MacroMobile />
}
