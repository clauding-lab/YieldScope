import type { ReactNode } from 'react'
import { useIsDesktop } from '../lib/hooks'
import { FX } from '../data/fixtures'
import { useFiscal } from '../hooks/useFiscal'
import { Bar, DemoBadge, ListRow, SectionTitle } from '../components/primitives'
import { AreaChart, Donut, DonutLegend, DotMatrix, RadialGauge } from '../components/charts'
import { DesktopHeader } from '../components/layout/DesktopHeader'
import type { DonutSegment } from '../components/charts/Donut'

const REVENUE_SEGMENTS: DonutSegment[] = [
  { value: 274.2, color: 'var(--accent)', label: 'NBR tax' },
  { value: 38.2,  color: 'var(--info)',   label: 'Non-NBR' },
  { value: 22.4,  color: 'var(--warn)',   label: 'Non-tax' },
]

const ISSUANCE_T_BILL = [50, 38, 32, 45, 30, 40, 50, 35, 32, 40, 38, 45]
const ISSUANCE_T_BOND = [ 0, 15,  0,  0, 12,  0,  0, 18,  0,  0, 14,  0]

function FiscalMobile() {
  const F = FX.fiscal
  const { data } = useFiscal()
  const revenuePct = data?.revenuePct ?? null
  const adpPct = data?.adpPct ?? null
  const fmtPct = (n: number | null) => n != null ? `${n}%` : '—'
  const demoLabel = (label: string): ReactNode => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {label}
      <DemoBadge />
    </span>
  )
  return (
    <>
      <SectionTitle kicker="Sovereign balance sheet" title="Fiscal" />

      <div style={{ padding: '0 22px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div className="caption">Fiscal pressure · composite</div>
          <DemoBadge />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
          <span className="serif-num" style={{ fontSize: 64, color: 'var(--warn)' }}>68</span>
          <span className="caption">/ 100</span>
        </div>

        <div style={{ marginTop: 18 }}>
          <Bar value={68} thresholds={[0.33, 0.66]} h={8} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span className="caption">Low</span>
            <span className="caption">Stress</span>
            <span className="caption">Crisis</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px 24px' }}>
        <div className="card-flat">
          <ListRow label="Revenue / target" value={fmtPct(revenuePct)} />
          <ListRow label={demoLabel('Debt / GDP')}        value={`${F.debtToGdp}%`} />
          <ListRow label={demoLabel('Net dom. borrow')}   value={`${F.netDomesticBorrowingYTD} k Cr`} />
          <ListRow label={demoLabel('Ways & Means')}      value={`${F.waysMeans} k Cr`} />
          <ListRow label="ADP implementation" value={fmtPct(adpPct)} last />
        </div>
      </div>

      <div style={{ padding: '12px 22px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div className="eyebrow">Revenue progress</div>
          {revenuePct == null && <DemoBadge />}
        </div>
        <div style={{ position: 'relative', height: 8, background: 'var(--sunken)', borderRadius: 99 }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${revenuePct ?? 0}%`,
              background: 'var(--accent)',
              borderRadius: 99,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '83%',
              top: -4,
              bottom: -4,
              width: 2,
              background: 'var(--ink-2)',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span className="caption">0</span>
          <span className="caption">Expected 83%</span>
          <span className="caption">100%</span>
        </div>
      </div>

      <div style={{ padding: '0 22px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div className="eyebrow">Public debt / GDP</div>
          <DemoBadge />
        </div>
        <AreaChart data={F.debtHist} w={346} h={90} color="var(--neg)" />
      </div>
    </>
  )
}

function FiscalDesktop() {
  const F = FX.fiscal
  const { data } = useFiscal()
  const revenuePct = data?.revenuePct ?? null
  const adpPct = data?.adpPct ?? null
  const fmtPct = (n: number | null) => n != null ? `${n}%` : '—'
  const demoLabel = (label: string): ReactNode => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {label}
      <DemoBadge />
    </span>
  )
  return (
    <>
      <DesktopHeader section="Fiscal" breadcrumb="YieldScope · Sovereign balance sheet" />

      <div
        style={{
          padding: '40px 48px 32px',
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: 48,
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <RadialGauge value={68} max={100} label="Fiscal pressure · 0–100" thresholds={[33, 66]} size={280} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div className="eyebrow">Fiscal pressure index</div>
            <DemoBadge />
          </div>
          <h2 className="display" style={{ fontSize: 36, margin: 0, color: 'var(--warn)' }}>Elevated.</h2>
          <div className="card-flat" style={{ padding: 18, marginTop: 22, maxWidth: 540 }}>
            <ListRow label="Revenue / target" value={fmtPct(revenuePct)} />
            <ListRow label={demoLabel('Debt / GDP')}        value={`${F.debtToGdp}%`} />
            <ListRow label={demoLabel('W&M usage')}         value="46%" />
            <ListRow label="ADP implementation" value={fmtPct(adpPct)} last />
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div style={{ padding: '36px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div className="eyebrow">Revenue · YTD composition</div>
            <DemoBadge />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Donut
              size={140}
              thickness={22}
              segments={REVENUE_SEGMENTS}
              centerValue={F.revenueYTD}
              centerLabel="k Cr · YTD"
            />
            <div style={{ flex: 1 }}>
              <DonutLegend
                segments={[
                  { value: 274.2, color: 'var(--accent)', label: 'NBR tax' },
                  { value: 38.2,  color: 'var(--info)',   label: 'Non-NBR' },
                  { value: 22.4,  color: 'var(--warn)',   label: 'Non-tax' },
                ]}
              />
            </div>
          </div>
          <div className="caption" style={{ marginTop: 14 }}>
            <span className="num" style={{ color: 'var(--ink)' }}>{fmtPct(revenuePct)}</span> of target · expected pace 83%
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div className="eyebrow">Public debt / GDP</div>
            <DemoBadge />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="serif-num" style={{ fontSize: 44, color: 'var(--neg)' }}>{F.debtToGdp}</span>
            <span className="caption">%</span>
          </div>
          <div className="caption" style={{ marginTop: 4 }}>↑ 260 bps in 24m</div>
          <div style={{ marginTop: 14 }}>
            <AreaChart data={F.debtHist} w={360} h={100} color="var(--neg)" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <div><div className="caption">Domestic</div><div className="serif-num" style={{ fontSize: 18 }}>23.8%</div></div>
            <div><div className="caption">External</div><div className="serif-num" style={{ fontSize: 18 }}>17.4%</div></div>
            <div><div className="caption">IMF EFF</div><div className="serif-num" style={{ fontSize: 18 }}>4.7B</div></div>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div className="eyebrow">Ways & Means · BB</div>
            <DemoBadge />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="serif-num" style={{ fontSize: 44, color: 'var(--warn)' }}>46</span>
            <span className="caption">% of limit</span>
          </div>
          <div className="caption" style={{ marginTop: 4 }}>{F.waysMeans} of {F.waysMeansLimit} k Cr drawn</div>
          <div style={{ marginTop: 18 }}>
            <DotMatrix cols={10} total={100} dotSize={11} gap={4} segments={[{ value: 46, color: 'var(--warn)' }]} />
          </div>
          <div className="caption" style={{ marginTop: 12, color: 'var(--warn)' }}>Monetary financing active</div>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div style={{ padding: '36px 48px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <div className="eyebrow">Gross issuance calendar · next 12 weeks</div>
          <DemoBadge />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 8 }}>
          {Array.from({ length: 12 }, (_, i) => {
            const week = `W${23 + i}`
            const tbill = ISSUANCE_T_BILL[i]
            const bond = ISSUANCE_T_BOND[i]
            return (
              <div key={week} style={{ textAlign: 'center' }}>
                <div style={{ height: 80, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 2 }}>
                  <div style={{ height: `${(tbill / 65) * 100}%`, background: 'var(--accent)', borderRadius: '2px 2px 0 0' }} />
                  {bond > 0 && (
                    <div style={{ height: `${(bond / 65) * 100}%`, background: 'var(--info)', borderRadius: '2px 2px 0 0' }} />
                  )}
                </div>
                <div style={{ marginTop: 8 }}>
                  <div className="caption">{week}</div>
                  <div className="serif-num" style={{ fontSize: 14, marginTop: 2 }}>{tbill + bond}</div>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 12, height: 12, background: 'var(--accent)', borderRadius: 3 }} />
            <span className="caption">T-bills</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 12, height: 12, background: 'var(--info)', borderRadius: 3 }} />
            <span className="caption">BGTB</span>
          </span>
          <span className="caption" style={{ marginLeft: 'auto' }}>k Cr</span>
        </div>
      </div>
    </>
  )
}

export default function Fiscal() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <FiscalDesktop /> : <FiscalMobile />
}
