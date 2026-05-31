import { useIsDesktop } from '../lib/hooks'
import { FX } from '../data/fixtures'
import { Collapse, DemoBadge, SectionTitle } from '../components/primitives'
import { YieldCurve } from '../components/charts'
import { DesktopHeader } from '../components/layout/DesktopHeader'
import { useDashboard } from '../hooks/useDashboard'
import { useBriefing } from '../hooks/useBriefing'
import { BriefingBody } from '../lib/briefingMarkdown'
import { todayLabel, weekdayName } from '../lib/dates'

interface MetricRow {
  lbl: string
  v: string
  u: string
  hint?: string
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

// BriefingAnomaly.severity ('up'|'down'|'warn') -> MovingItem.sev ('warn'|'neg'|'pos')
function sevFromAnomaly(s: 'up' | 'down' | 'warn'): 'warn' | 'neg' | 'pos' {
  return s === 'up' ? 'neg' : s === 'down' ? 'pos' : 'warn'
}

function DashboardMobile() {
  const { data } = useDashboard()
  const { briefings } = useBriefing()
  const brief = briefings[0] ?? null
  const moving: MovingItem[] = brief
    ? brief.featuredAnomalies.map(a => ({ tag: a.label, text: a.why || a.detail, sev: sevFromAnomaly(a.severity) }))
    : MOVING

  const metrics: MetricRow[] = [
    { lbl: '91-day T-Bill',    v: data?.tbill91     != null ? data.tbill91.toFixed(2)     : '—', u: '%' },
    { lbl: '10-year BGTB',     v: data?.tbond10     != null ? data.tbond10.toFixed(2)     : '—', u: '%' },
    { lbl: 'Call money · o/n', v: data?.callMoney   != null ? data.callMoney.toFixed(2)   : '—', u: '%',   hint: 'Above repo' },
    { lbl: 'CPI · headline',   v: data?.cpiHeadline != null ? data.cpiHeadline.toFixed(2) : '—', u: '%·y', hint: 'April' },
  ]

  return (
    <>
      <SectionTitle kicker={todayLabel()} title="Today" />

      <div style={{ padding: '0 22px 24px' }}>
        {brief == null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <DemoBadge />
          </div>
        )}
        <p
          style={{
            margin: 0,
            fontSize: 22,
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
            color: 'var(--ink)',
          }}
        >
          {brief ? brief.title : HERO_LINE}
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
              {m.hint && <div className="caption" style={{ textAlign: 'right' }}>{m.hint}</div>}
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
              {data?.spread10Y_91D_bps != null ? `+${data.spread10Y_91D_bps} bps` : '—'}
            </span>
          </span>
        </div>
      </div>
      <div style={{ padding: '0 22px' }}>
        <YieldCurve w={346} h={170} showLegend defaultOverlays={['latest', 'weekAgo', 'yearAgo']} />
      </div>

      <div style={{ padding: '32px 22px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="eyebrow">What's moving</div>
          {brief == null && <DemoBadge />}
        </div>
      </div>
      <div style={{ padding: '0 22px 16px' }}>
        {moving.slice(0, 3).map((a, i, arr) => (
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
          eyebrow={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Weekly briefing
              {brief == null && <DemoBadge />}
            </span>
          }
          title={brief ? brief.title : 'The short end is rotating, not relaxing'}
          summary="Three forces are squeezing the front — read full analysis."
        >
          <BriefingBody markdown={brief ? brief.body : FX.intel.weekly} baseSize={14} />
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button type="button" className="btn btn-sm">Open full notes</button>
          </div>
        </Collapse>
      </div>
    </>
  )
}

function DashboardDesktop() {
  const { data } = useDashboard()
  const { briefings } = useBriefing()
  const brief = briefings[0] ?? null
  const moving: MovingItem[] = brief
    ? brief.featuredAnomalies.map(a => ({ tag: a.label, text: a.why || a.detail, sev: sevFromAnomaly(a.severity) }))
    : MOVING

  const metrics: MetricRow[] = [
    { lbl: '91-day T-Bill',    v: data?.tbill91     != null ? data.tbill91.toFixed(2)     : '—', u: '%' },
    { lbl: '10-year BGTB',     v: data?.tbond10     != null ? data.tbond10.toFixed(2)     : '—', u: '%' },
    { lbl: 'Call money · o/n', v: data?.callMoney   != null ? data.callMoney.toFixed(2)   : '—', u: '%',   hint: 'Above repo' },
    { lbl: 'CPI · headline',   v: data?.cpiHeadline != null ? data.cpiHeadline.toFixed(2) : '—', u: '%·y', hint: 'April' },
  ]

  return (
    <>
      <DesktopHeader section="Today" breadcrumb={`YieldScope · ALCO Intelligence · ${weekdayName()}`} />

      <div style={{ padding: '40px 48px 24px' }}>
        {brief == null && (
          <div style={{ marginBottom: 14 }}>
            <DemoBadge />
          </div>
        )}
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
          {brief ? brief.title : HERO_LINE}
        </p>
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
            {m.hint && (
              <div className="caption" style={{ marginTop: 10 }}>{m.hint}</div>
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
                {data?.spread10Y_91D_bps != null ? `+${data.spread10Y_91D_bps} bps` : '—'}
              </h3>
              <div className="caption" style={{ marginTop: 4 }}>Slope 10y over 91d</div>
            </div>
          </div>
          <YieldCurve w={620} h={280} showLegend defaultOverlays={['latest', 'weekAgo', 'monthAgo', 'yearAgo']} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div className="eyebrow">What's moving</div>
            {brief == null && <DemoBadge />}
          </div>
          {moving.map((a, i, arr) => (
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
                  {a.when && <span className="caption">{a.when}</span>}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div className="eyebrow">Weekly briefing · drafted by Claude</div>
            {brief == null && <DemoBadge />}
          </div>
          <h3 className="display" style={{ fontSize: 28, margin: 0 }}>
            {brief ? brief.title : 'The short end is rotating, not relaxing.'}
          </h3>
          <div style={{ marginTop: 14, maxWidth: 640 }}>
            <BriefingBody markdown={brief ? brief.body : FX.intel.weekly} baseSize={15} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn">Open full briefing</button>
          </div>
        </div>

        <div className="card-flat" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div className="eyebrow">Recent auctions</div>
            <DemoBadge />
          </div>
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
              <span className="serif-num" style={{ fontSize: 18 }}>{a.cutoff}</span>
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
