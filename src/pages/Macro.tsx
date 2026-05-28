import type { ReactNode } from 'react'
import { useIsDesktop } from '../lib/hooks'
import { FX } from '../data/fixtures'
import { Delta, DemoBadge, ListRow, SectionTitle, Sparkline } from '../components/primitives'
import { AreaChart, Heatmap } from '../components/charts'
import { DesktopHeader } from '../components/layout/DesktopHeader'
import { useMacro } from '../hooks/useMacro'

const CPI_ROWS = ['Food', 'Non-food', 'Core', 'Headline']
const CPI_COLS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']
const CPI_DATA = [
  [11.20, 11.00, 10.80, 10.50, 10.20, 9.90, 9.70, 9.40],
  [9.00,  8.95,  8.90,  8.80,  8.75,  8.70, 8.65, 8.60],
  [8.40,  8.32,  8.18,  8.04,  7.94,  7.82, 7.74, 7.62],
  [9.94,  9.86,  9.74,  9.62,  9.58,  9.42, 9.38, 9.20],
]

function cpiColor(v: number) {
  const pct = Math.max(0, Math.min(1, (v - 7.5) / (11.5 - 7.5)))
  if (pct > 0.66) return { bg: `rgba(213, 143, 118, ${0.25 + pct * 0.4})`,  fg: 'var(--neg)' }
  if (pct > 0.33) return { bg: `rgba(215, 184, 114, ${0.22 + pct * 0.35})`, fg: 'var(--warn)' }
  return { bg: `rgba(146, 176, 149, ${0.18 + (1 - pct) * 0.25})`, fg: 'var(--pos)' }
}

const BOP_ITEMS: { lbl: string; v: string; u: string; d: string; spark: number[]; col: string }[] = [
  { lbl: 'Remittances',  v: '28.4', u: 'USD bn', d: '+8.2% YoY',     spark: FX.macro.remitHist,  col: 'var(--pos)' },
  { lbl: 'Exports',      v: '54.8', u: 'USD bn', d: '+4.2% YoY',     spark: FX.macro.exportHist, col: 'var(--pos)' },
  { lbl: 'Imports',      v: '68.1', u: 'USD bn', d: '−2.4% YoY',     spark: FX.macro.importHist, col: 'var(--neg)' },
  { lbl: 'Current acct', v: '−2.8', u: 'USD bn', d: '−1.9% of GDP',  spark: [-4.2, -3.8, -3.4, -3.2, -3.0, -2.9, -2.8, -2.8], col: 'var(--neg)' },
]

const COMMODITIES: { c: string; v: string; u: string; d: number; spark: number[] }[] = [
  { c: 'Brent',    v: '84.20', u: 'USD/bbl',   d:  1.4, spark: [78, 80, 82, 81, 83, 84, 83.5, 84.20] },
  { c: 'LNG',      v: '11.40', u: 'USD/MMBtu', d: -2.1, spark: [13, 12.8, 12.4, 12.0, 11.8, 11.7, 11.5, 11.40] },
  { c: 'Wheat',    v: '612',   u: 'USD/MT',    d:  0.6, spark: [598, 602, 605, 608, 610, 611, 610, 612] },
  { c: 'Palm oil', v: '3,840', u: 'MYR/MT',    d: -0.4, spark: [3900, 3880, 3860, 3850, 3845, 3850, 3845, 3840] },
]

function MacroMobile() {
  const { data } = useMacro()
  const M = FX.macro
  return (
    <>
      <SectionTitle kicker="Inflation · reserves · BoP" title="Macro" />

      <div style={{ padding: '0 22px 28px' }}>
        <div className="caption">CPI · headline · April</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
          <span className="serif-num" style={{ fontSize: 64 }}>{data?.cpiHeadline?.toFixed(2) ?? '—'}</span>
          <span className="caption">% YoY</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <Delta value={-0.18} invert size="md" />
          <span className="caption">target 7.50 · gap 170 bps</span>
        </div>
        <div style={{ marginTop: 18 }}>
          <AreaChart data={data?.cpiHist?.length ? data.cpiHist : M.cpiHist} w={346} h={80} color="var(--accent)" />
        </div>
      </div>

      <div style={{ padding: '0 16px 24px' }}>
        <div className="card-flat">
          <ListRow
            label="Food"
            value="9.40%"
            sub={<Sparkline data={data?.foodHist?.length ? data.foodHist : M.foodHist} w={80} h={16} color="var(--neg)" /> as ReactNode}
          />
          <ListRow
            label="Core"
            value="7.62%"
            sub={<Sparkline data={M.coreHist} w={80} h={16} color="var(--info)" /> as ReactNode}
          />
          <ListRow
            label="Non-food"
            value="8.60%"
            sub={<Sparkline data={data?.nonFoodHist?.length ? data.nonFoodHist : [9.0, 8.95, 8.9, 8.8, 8.75, 8.7, 8.65, 8.6]} w={80} h={16} color="var(--pos)" /> as ReactNode}
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
            <div className="caption" style={{ marginTop: 4 }}>Below USD 21bn floor</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="serif-num" style={{ fontSize: 26, color: 'var(--warn)' }}>2.94</div>
            <div className="caption">mo cover · IMF min 3.0</div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <AreaChart data={data?.fxResHist?.length ? data.fxResHist : M.fxResHist} w={346} h={80} color="var(--neg)" />
        </div>
      </div>

      <div style={{ padding: '0 16px 24px' }}>
        <div className="card-flat">
          {BOP_ITEMS.map((b, i, arr) => (
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
              <span className="caption">{b.d}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function MacroDesktop() {
  const { data } = useMacro()
  const M = FX.macro
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
          <p style={{ marginTop: 14, fontSize: 20, lineHeight: 1.4, color: 'var(--ink)' }}>
            Eight consecutive months of cooling. Food easing faster than core. Target 7.50 · gap 170 bps.
          </p>
          <div style={{ marginTop: 20 }}>
            <AreaChart data={data?.cpiHist?.length ? data.cpiHist : M.cpiHist} w={540} h={140} color="var(--accent)" />
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>FX reserves · BPM6</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="serif-num" style={{ fontSize: 72, color: 'var(--neg)' }}>{data?.fxReservesUsdBn?.toFixed(2) ?? '—'}</span>
            <span className="caption">USD bn</span>
          </div>
          <p style={{ marginTop: 14, fontSize: 20, lineHeight: 1.4, color: 'var(--ink)' }}>
            Below the USD 21bn floor. Import cover <span className="num">2.94</span> months — inside the IMF EFF
            threshold. Review due W24.
          </p>
          <div style={{ marginTop: 20 }}>
            <AreaChart data={data?.fxResHist?.length ? data.fxResHist : M.fxResHist} w={540} h={140} color="var(--neg)" />
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div style={{ padding: '36px 48px' }}>
        <div className="eyebrow" style={{ marginBottom: 18 }}>Balance of payments · 12-month flows</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
          {BOP_ITEMS.map(b => (
            <div key={b.lbl}>
              <div className="caption">{b.lbl}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                <span className="serif-num" style={{ fontSize: 40 }}>{b.v}</span>
                <span className="caption">{b.u}</span>
              </div>
              <div className="caption" style={{ marginTop: 4 }}>{b.d}</div>
              <div style={{ marginTop: 14 }}>
                <Sparkline data={b.spark} w={260} h={32} color={b.col} strokeWidth={1.4} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div style={{ padding: '36px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>CPI components · 8-month trajectory</div>
            <h3 className="display" style={{ fontSize: 22, margin: 0 }}>Where the heat is leaving</h3>
          </div>
          <div className="caption">YoY %, by month</div>
        </div>
        <div className="card-flat" style={{ padding: '22px 24px' }}>
          <Heatmap
            rows={CPI_ROWS}
            cols={CPI_COLS}
            data={CPI_DATA}
            leftW={100}
            cellH={36}
            fmt={v => v.toFixed(2)}
            getColor={cpiColor}
          />
          <div style={{ display: 'flex', gap: 20, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <span className="caption">
              All four series cooling — food fastest (−180 bps in 8 months), core slowest.
            </span>
            <span className="caption" style={{ marginLeft: 'auto' }}>Target band 6–7.5% · gap closing</span>
          </div>
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
            <DemoBadge />
          </div>
          <div className="card-flat">
            {COMMODITIES.map((c, i, arr) => (
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
                <Sparkline data={c.spark} w={200} h={20} />
                <div style={{ textAlign: 'right' }}>
                  <div className="serif-num" style={{ fontSize: 18 }}>{c.v}</div>
                  <div className="caption">{c.u}</div>
                </div>
                <Delta value={c.d} suffix="%" invert size="sm" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div className="eyebrow">USD / BDT · mid-rate</div>
            <DemoBadge />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="serif-num" style={{ fontSize: 56 }}>{data?.usdBdt?.toFixed(2) ?? '—'}</span>
            <Delta value={0.04} size="md" />
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
            <span className="caption">+1.2% YTD</span>
            <span className="caption">REER 108.4 · overvalued ~6%</span>
          </div>
          <div style={{ marginTop: 20 }}>
            <AreaChart
              data={[118.4, 118.8, 119.1, 119.3, 119.4, 119.5, 119.58, 119.62]}
              w={540}
              h={130}
              color="var(--info)"
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default function Macro() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <MacroDesktop /> : <MacroMobile />
}
