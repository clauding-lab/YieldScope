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

interface BopItem {
  lbl: string
  v: string
  u: string
  d: string
  spark: number[]
  col: string
  demo?: boolean
}

function fmtUsdBn(n: number | null | undefined): string {
  return n != null ? n.toFixed(2) : '—'
}

function buildBopItems(data: ReturnType<typeof useMacro>['data']): BopItem[] {
  return [
    { lbl: 'Remittances',  v: fmtUsdBn(data?.remitMonthlyUsdBn),  u: 'USD bn · monthly', d: '',  spark: FX.macro.remitHist,  col: 'var(--pos)', demo: true },
    { lbl: 'Exports',      v: fmtUsdBn(data?.exportMonthlyUsdBn), u: 'USD bn · monthly', d: '',  spark: FX.macro.exportHist, col: 'var(--pos)', demo: true },
    { lbl: 'Imports',      v: fmtUsdBn(data?.importMonthlyUsdBn), u: 'USD bn · monthly', d: '',  spark: FX.macro.importHist, col: 'var(--neg)', demo: true },
    { lbl: 'Current acct', v: '−2.8', u: 'USD bn', d: '−1.9% of GDP', spark: [-4.2, -3.8, -3.4, -3.2, -3.0, -2.9, -2.8, -2.8], col: 'var(--neg)', demo: true },
  ]
}

const COMMODITIES: { c: string; v: string; u: string; d: number; spark: number[] }[] = [
  { c: 'Brent',    v: '84.20', u: 'USD/bbl',   d:  1.4, spark: [78, 80, 82, 81, 83, 84, 83.5, 84.20] },
  { c: 'LNG',      v: '11.40', u: 'USD/MMBtu', d: -2.1, spark: [13, 12.8, 12.4, 12.0, 11.8, 11.7, 11.5, 11.40] },
  { c: 'Wheat',    v: '612',   u: 'USD/MT',    d:  0.6, spark: [598, 602, 605, 608, 610, 611, 610, 612] },
  { c: 'Palm oil', v: '3,840', u: 'MYR/MT',    d: -0.4, spark: [3900, 3880, 3860, 3850, 3845, 3850, 3845, 3840] },
]

function MacroMobile() {
  const { data } = useMacro()
  const bopItems = buildBopItems(data)
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
        {data?.fxResHist?.length ? (
          <div style={{ marginTop: 16 }}>
            <AreaChart data={data.fxResHist} w={346} h={80} color="var(--neg)" />
          </div>
        ) : null}
      </div>

      <div style={{ padding: '0 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 22px 10px' }}>
          <div className="caption">Balance of payments</div>
          <DemoBadge />
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
          <DemoBadge />
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
            cols={CPI_COLS}
            data={CPI_DATA}
            leftW={100}
            cellH={36}
            fmt={v => v.toFixed(2)}
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
