import { useIsDesktop } from '../lib/hooks'
import { FX } from '../data/fixtures'
import { DemoBadge, ListRow, SectionTitle } from '../components/primitives'
import { Timeline } from '../components/charts'
import { DesktopHeader } from '../components/layout/DesktopHeader'

type AnomalySev = 'warn' | 'up' | 'down'

const SEV_DOT_COLOR: Record<AnomalySev, string> = {
  warn: 'var(--warn)',
  up:   'var(--neg)',
  down: 'var(--pos)',
}

const TIMELINE_EVENTS = [
  { pct: 0.04, label: 'Repo held at 9.00%',       sub: 'MPC · 8 Apr',     sev: 'info' as const },
  { pct: 0.18, label: 'CPI prints 9.94',          sub: 'April release',   sev: 'warn' as const },
  { pct: 0.30, label: 'IMF EFF review',           sub: 'Tranche cleared', sev: 'pos'  as const },
  { pct: 0.46, label: 'Reserves below USD 22Bn',  sub: 'BB weekly',       sev: 'neg'  as const },
  { pct: 0.60, label: '364D under-sub',           sub: 'Cover 1.04x',     sev: 'warn' as const },
  { pct: 0.74, label: 'CPI eases to 9.20',        sub: 'April final',     sev: 'pos'  as const },
  { pct: 0.86, label: 'Reserves below USD 21Bn',  sub: 'IMF floor',       sev: 'neg'  as const },
  { pct: 0.96, label: 'Call breach',              sub: 'O/N 9.34',        sev: 'neg'  as const },
]

const EXTRA_ANOMALIES = [
  { code: 'X-RES', label: 'Repo borrowing from BB +42% in 8 weeks', sev: 'up'   as AnomalySev },
  { code: 'X-CPI', label: 'CPI food deceleration below trend',       sev: 'down' as AnomalySev },
]

const RECENT_RELATIVE = ['Just now', '2h', '8h', '1d', '2d']

const EXTRA_DECISIONS = [
  { code: 'D-04', topic: 'Cross-currency swap window (USD/BDT)',    status: 'DRAFT' },
  { code: 'D-05', topic: 'Deposit pricing — Tier-1 corporates',     status: 'SIGNED' },
  { code: 'D-06', topic: 'IFRS-9 stage 2 reclassification batch',   status: 'PENDING' },
]

function chipForStatus(status: string): string {
  if (status === 'SIGNED') return 'chip chip-pos'
  if (status === 'PENDING') return 'chip chip-warn'
  return 'chip'
}

function IntelMobile() {
  const anomalies = [...FX.intel.anomalies, ...EXTRA_ANOMALIES]

  return (
    <>
      <SectionTitle kicker="Weekly read · drafted by Claude" title="Briefings" />
      <div style={{ padding: '0 22px 12px' }}>
        <DemoBadge />
      </div>

      <div style={{ padding: '0 22px 24px' }}>
        <h2 className="display" style={{ fontSize: 28, margin: 0, lineHeight: 1.2 }}>
          The short end is rotating, not relaxing.
        </h2>
        <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
          <span className="chip">Fresh · 6h ago</span>
          <span className="chip">Week 22</span>
        </div>
        <p className="body" style={{ marginTop: 18, fontSize: 15, lineHeight: 1.7 }}>{FX.intel.weekly}</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button type="button" className="btn btn-sm">Regenerate</button>
          <button type="button" className="btn btn-sm btn-ghost">Edit tone</button>
        </div>
      </div>

      <div style={{ padding: '0 22px 24px' }}>
        <div className="section-rule">Anomalies · 24h</div>
      </div>
      <div style={{ padding: '0 22px 24px' }}>
        {anomalies.map((a, i, arr) => (
          <div
            key={a.code}
            style={{
              padding: '14px 0',
              borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 99,
                marginTop: 8,
                background: SEV_DOT_COLOR[a.sev as AnomalySev],
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>{a.label}</div>
              <div className="caption" style={{ marginTop: 3 }}>{RECENT_RELATIVE[i] ?? '3d'}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 22px 16px' }}>
        <div className="section-rule">ALCO decisions</div>
      </div>
      <div style={{ padding: '0 16px 24px' }}>
        <div className="card-flat">
          {FX.intel.decisions.map((d, i, arr) => (
            <ListRow
              key={d.code}
              label={d.topic}
              sub={d.code}
              value={<span className={chipForStatus(d.status)}>{d.status.toLowerCase()}</span>}
              last={i === arr.length - 1}
            />
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px 28px' }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Export</div>
          <h3 className="display" style={{ fontSize: 22, margin: 0 }}>Weekly ALCO brief</h3>
          <div className="caption" style={{ marginTop: 4 }}>3 pages · charts & commentary</div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}
          >
            Generate PDF
          </button>
        </div>
      </div>
    </>
  )
}

function IntelDesktop() {
  const sidebarAnomalies = [
    ...FX.intel.anomalies,
    { code: 'X-RES', label: 'Repo borrowing +42% in 8w', sev: 'up'   as AnomalySev },
    { code: 'X-AUC', label: '364D under-sub 3 of 4',     sev: 'warn' as AnomalySev },
  ]

  return (
    <>
      <DesktopHeader section="Briefings" breadcrumb="YieldScope · Weekly read & ALCO log" />
      <div style={{ padding: '0 48px' }}>
        <DemoBadge />
      </div>

      <div style={{ padding: '40px 48px 0', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 56 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Weekly read · Wednesday · drafted by Claude</div>
          <h2 className="display" style={{ fontSize: 44, margin: 0, lineHeight: 1.15 }}>
            The short end is rotating, not relaxing.
          </h2>
          <p className="body" style={{ marginTop: 22, fontSize: 17, lineHeight: 1.7, color: 'var(--ink)', maxWidth: 720 }}>
            {FX.intel.weekly}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
            <button type="button" className="btn">Regenerate</button>
            <button type="button" className="btn btn-ghost">Edit tone</button>
            <button type="button" className="btn btn-ghost">Read history</button>
            <button type="button" className="btn btn-ghost">Share</button>
          </div>
        </div>

        <aside>
          <div className="card-flat" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Anomalies · 24h</div>
            {sidebarAnomalies.map((a, i, arr) => (
              <div
                key={a.code}
                style={{
                  padding: '12px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 99,
                    marginTop: 6,
                    background: SEV_DOT_COLOR[a.sev],
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.45 }}>{a.label}</div>
                  <div className="caption" style={{ marginTop: 2 }}>{['Now', '2h', '8h', '1d', '2d'][i] ?? '3d'}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 22, marginTop: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Export</div>
            <h3 className="display" style={{ fontSize: 26, margin: 0 }}>Weekly ALCO brief</h3>
            <div className="caption" style={{ marginTop: 6 }}>3 pages · PDF · ready in ~10s</div>
            <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Dashboard', 'Curve', 'Auctions', 'Liquidity', 'Macro', 'Commentary'].map(s => (
                <span key={s} className="chip">{s} ✓</span>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 18, width: '100%', justifyContent: 'center' }}
            >
              Generate PDF
            </button>
          </div>
        </aside>
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '40px 48px 0' }} />

      <div style={{ padding: '32px 48px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>What happened · 7 weeks</div>
            <h3 className="display" style={{ fontSize: 24, margin: 0 }}>The market through April–May</h3>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-sm">Filter</button>
            <button type="button" className="btn btn-sm">Add event</button>
          </div>
        </div>
        <div className="card-flat" style={{ padding: '24px 24px 16px' }}>
          <Timeline
            w={1100}
            h={150}
            axis={['W16', 'W17', 'W18', 'W19', 'W20', 'W21', 'W22']}
            events={TIMELINE_EVENTS}
          />
        </div>
      </div>

      <div style={{ padding: '32px 48px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>ALCO decision log · Week 22</div>
            <h3 className="display" style={{ fontSize: 24, margin: 0 }}>Six entries</h3>
          </div>
          <button type="button" className="btn btn-sm">New decision</button>
        </div>
        <div className="card-flat">
          {[...FX.intel.decisions, ...EXTRA_DECISIONS].map((d, i, arr) => (
            <div
              key={d.code}
              style={{
                padding: '16px 22px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
                display: 'grid',
                gridTemplateColumns: '70px 1fr 160px 110px',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <span className="caption">{d.code}</span>
              <span style={{ fontSize: 14, color: 'var(--ink)' }}>{d.topic}</span>
              <span className="caption">Jane D · Desk 04</span>
              <span className={chipForStatus(d.status)} style={{ justifySelf: 'flex-end' }}>
                {d.status.toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default function Intelligence() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <IntelDesktop /> : <IntelMobile />
}
