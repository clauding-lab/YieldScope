import { useIsDesktop } from '../lib/hooks'
import { FX } from '../data/fixtures'
import { Collapse, Delta, SectionTitle, Sparkline } from '../components/primitives'
import { YieldCurve } from '../components/charts'
import { DesktopHeader } from '../components/layout/DesktopHeader'
import { useDashboard } from '../hooks/useDashboard'

interface MetricRow {
  lbl: string
  v: string
  u: string
  ch: number
  inv: boolean
  hint?: string
  spark?: number[]
}

interface MovingItem {
  tag: string
  text: string
  sev: 'warn' | 'neg' | 'pos'
  when?: string
}

const HERO_LINE =
  'The short end is easing — but call money has now pierced the repo for a second session, and reserves slipped through the IMF floor.'

const MOVING: MovingItem[] = [
  { tag: 'Liquidity', text: 'Call rate breached the repo for a 2nd session — VAT outflow not fully sterilised.',  sev: 'warn', when: '09:42' },
  { tag: 'Auctions',  text: '364-day undersubscribed in 3 of last 4 prints. Cover at 1.17x. Devolvement risk.',   sev: 'warn', when: '08:15' },
  { tag: 'Reserves',  text: 'FX reserves through USD 21Bn floor. Import cover 2.94 months — below IMF EFF.',      sev: 'neg',  when: 'EOD' },
  { tag: 'Inflation', text: 'Headline CPI down 18 bps to 9.20%. Food easing faster than core.',                   sev: 'pos',  when: 'M-1' },
]

function sevColor(sev: 'warn' | 'neg' | 'pos') {
  return sev === 'warn' ? 'var(--warn)' : sev === 'neg' ? 'var(--neg)' : 'var(--pos)'
}

function DashboardMobile() {
  const { data } = useDashboard()

  const metrics: MetricRow[] = [
    { lbl: '91-day T-Bill',    v: data?.tbill91     != null ? data.tbill91.toFixed(2)     : '11.42', u: '%',   ch: -0.08, inv: true, spark: FX.snapshots[0].spark },
    { lbl: '10-year BGTB',     v: data?.tbond10     != null ? data.tbond10.toFixed(2)     : '12.18', u: '%',   ch: -0.02, inv: true, spark: FX.snapshots[2].spark },
    { lbl: 'Call money · o/n', v: data?.callMoney   != null ? data.callMoney.toFixed(2)   : '9.34',  u: '%',   ch:  0.12, inv: true, spark: FX.snapshots[3].spark, hint: 'Above repo' },
    { lbl: 'CPI · headline',   v: data?.cpiHeadline != null ? data.cpiHeadline.toFixed(2) : '9.20',  u: '%·y', ch: -0.18, inv: true, spark: FX.snapshots[5].spark, hint: 'April' },
  ]

  return (
    <>
      <SectionTitle kicker="Wednesday, 27 May" title="Today" />

      <div style={{ padding: '0 22px 24px' }}>
        <p
          style={{
            margin: 0,
            fontSize: 22,
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
            color: 'var(--ink)',
          }}
        >
          {HERO_LINE}
        </p>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div className="card-flat">
          {metrics.map((m, i, arr) => (
            <div
              key={m.lbl}
              style={{
                padding: '18px 22px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>{m.lbl}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                  <span className="serif-num" style={{ fontSize: 28 }}>{m.v}</span>
                  <span className="caption">{m.u}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Delta value={m.ch} invert={m.inv} size="md" />
                {m.hint && <div className="caption" style={{ marginTop: 4 }}>{m.hint}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '32px 22px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="eyebrow">Yield curve</div>
          <span className="caption">
            Slope 10y – 91d ·{' '}
            <span className="num" style={{ color: 'var(--accent)' }}>
              {data?.spread10Y_91D_bps != null ? `+${data.spread10Y_91D_bps} bps` : '+76 bps'}
            </span>
          </span>
        </div>
      </div>
      <div style={{ padding: '0 22px' }}>
        <YieldCurve w={346} h={170} showLegend defaultOverlays={['latest', 'weekAgo', 'yearAgo']} />
      </div>

      <div style={{ padding: '32px 22px 16px' }}>
        <div className="eyebrow">What's moving</div>
      </div>
      <div style={{ padding: '0 22px 16px' }}>
        {MOVING.slice(0, 3).map((a, i, arr) => (
          <div
            key={i}
            style={{
              padding: '14px 0',
              borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: 99,
                marginTop: 8,
                background: sevColor(a.sev),
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div className="caption" style={{ marginBottom: 3 }}>{a.tag}</div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink)' }}>{a.text}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 16px 24px' }}>
        <Collapse
          eyebrow="Weekly briefing"
          title="The short end is rotating, not relaxing"
          summary="Three forces are squeezing the front — read full analysis."
        >
          <p className="body" style={{ fontSize: 14, lineHeight: 1.7 }}>{FX.intel.weekly}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button type="button" className="btn btn-sm">Open full notes</button>
            <button type="button" className="btn btn-sm btn-ghost">Regenerate</button>
          </div>
        </Collapse>
      </div>
    </>
  )
}

function DashboardDesktop() {
  const { data } = useDashboard()

  const metrics: MetricRow[] = [
    { lbl: '91-day T-Bill',    v: data?.tbill91     != null ? data.tbill91.toFixed(2)     : '11.42', u: '%',   ch: -0.08, inv: true, spark: FX.snapshots[0].spark },
    { lbl: '10-year BGTB',     v: data?.tbond10     != null ? data.tbond10.toFixed(2)     : '12.18', u: '%',   ch: -0.02, inv: true, spark: FX.snapshots[2].spark },
    { lbl: 'Call money · o/n', v: data?.callMoney   != null ? data.callMoney.toFixed(2)   : '9.34',  u: '%',   ch:  0.12, inv: true, spark: FX.snapshots[3].spark, hint: 'Above repo' },
    { lbl: 'CPI · headline',   v: data?.cpiHeadline != null ? data.cpiHeadline.toFixed(2) : '9.20',  u: '%·y', ch: -0.18, inv: true, spark: FX.snapshots[5].spark, hint: 'April' },
  ]

  return (
    <>
      <DesktopHeader section="Today" breadcrumb="YieldScope · ALCO Intelligence · Wednesday" />

      <div style={{ padding: '40px 48px 24px' }}>
        <p
          style={{
            margin: 0,
            fontSize: 38,
            lineHeight: 1.2,
            letterSpacing: '-0.015em',
            color: 'var(--ink)',
            maxWidth: 880,
          }}
        >
          {HERO_LINE}
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <span className="chip chip-warn">2 alerts</span>
          <span className="chip">Refreshed 06:00 BST</span>
        </div>
      </div>

      <div
        style={{
          padding: '8px 48px 36px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 24,
        }}
      >
        {metrics.map(m => (
          <div key={m.lbl}>
            <div className="label">{m.lbl}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
              <span className="serif-num" style={{ fontSize: 48 }}>{m.v}</span>
              <span className="caption">{m.u}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
              <Delta value={m.ch} invert={m.inv} size="md" />
              {m.hint && <span className="caption">· {m.hint}</span>}
            </div>
            {m.spark && (
              <div style={{ marginTop: 14 }}>
                <Sparkline data={m.spark} w={220} h={32} strokeWidth={1.5} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div
        style={{
          padding: '32px 48px',
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 32,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Sovereign curve</div>
              <h3 className="display" style={{ fontSize: 26, margin: 0 }}>
                {data?.spread10Y_91D_bps != null ? `+${data.spread10Y_91D_bps} bps` : '+76 bps'}
              </h3>
              <div className="caption" style={{ marginTop: 4 }}>Slope 10y over 91d · flatter by 12 bps vs last month</div>
            </div>
          </div>
          <YieldCurve w={620} h={280} showLegend defaultOverlays={['latest', 'weekAgo', 'monthAgo', 'yearAgo']} />
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 14 }}>What's moving</div>
          {MOVING.map((a, i, arr) => (
            <div
              key={i}
              style={{
                padding: '16px 0',
                borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 99,
                  marginTop: 8,
                  background: sevColor(a.sev),
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span className="caption" style={{ color: 'var(--ink)', fontWeight: 500 }}>{a.tag}</span>
                  <span className="caption">{a.when}</span>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink)', marginTop: 4 }}>{a.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div
        style={{
          padding: '32px 48px 48px',
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 32,
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Weekly briefing · drafted by Claude</div>
          <h3 className="display" style={{ fontSize: 28, margin: 0 }}>The short end is rotating, not relaxing.</h3>
          <p className="body" style={{ marginTop: 14, fontSize: 15, lineHeight: 1.65, maxWidth: 640 }}>
            {FX.intel.weekly}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn">Open full briefing</button>
            <button type="button" className="btn btn-ghost">Regenerate</button>
            <button type="button" className="btn btn-ghost">Edit tone</button>
          </div>
        </div>

        <div className="card-flat" style={{ padding: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Recent auctions</div>
          {FX.auctions.slice(0, 4).map((a, i, arr) => (
            <div
              key={i}
              style={{
                padding: '12px 0',
                borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <div>
                <span style={{ fontSize: 14, color: 'var(--ink)' }}>{a.tenor}</span>
                <span className="caption" style={{ marginLeft: 10 }}>{a.date} · cover {a.cover}x</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span className="serif-num" style={{ fontSize: 18 }}>{a.cutoff}</span>
                <Delta value={a.delta} invert size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default function Dashboard() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DashboardDesktop /> : <DashboardMobile />
}
