import { useState } from 'react'
import { useIsDesktop } from '../lib/hooks'
import { useBriefing } from '../hooks/useBriefing'
import type { Briefing } from '../lib/econdelta'
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

const DEMO_TITLE = 'The short end is rotating, not relaxing.'

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

interface DisplayAnomaly { key: string; label: string; sub: string; severity: AnomalySev }

// Live anomalies carry Python-computed numbers (the integrity guarantee); show
// the label + the concrete `detail` figure.
function liveAnomalies(b: Briefing): DisplayAnomaly[] {
  return b.featuredAnomalies.map(a => ({
    key: a.candidate_id, label: a.label, sub: a.detail, severity: a.severity,
  }))
}

function demoAnomalies(extra: { code: string; label: string; sev: AnomalySev }[]): DisplayAnomaly[] {
  return [...FX.intel.anomalies, ...extra].map((a, i) => ({
    key: a.code, label: a.label, sub: RECENT_RELATIVE[i] ?? '3d', severity: a.sev as AnomalySev,
  }))
}

// "data as of X — N series stale" honesty banner; null when the briefing is fully fresh.
function staleNote(b: Briefing | null): string | null {
  if (!b || b.staleSeries.length === 0) return null
  return `Data as of ${b.dataAsOf} · ${b.staleSeries.length} series stale`
}

interface HistoryPanelProps {
  briefings: Briefing[]
  activeWeek: string | null
  onSelect: (weekOf: string | null) => void
}

function HistoryPanel({ briefings, activeWeek, onSelect }: HistoryPanelProps) {
  if (briefings.length === 0) {
    return <div className="caption" style={{ padding: '8px 0' }}>No prior briefings yet.</div>
  }
  return (
    <div className="card-flat" style={{ padding: 8, marginTop: 12 }}>
      {briefings.map((b, i) => {
        const active = (activeWeek ?? briefings[0]?.weekOf) === b.weekOf
        return (
          <button
            key={b.weekOf}
            type="button"
            onClick={() => onSelect(i === 0 ? null : b.weekOf)}
            style={{
              display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none',
              cursor: 'pointer', padding: '10px 12px',
              borderBottom: i < briefings.length - 1 ? '1px solid var(--line)' : 'none',
              color: active ? 'var(--ink)' : 'var(--ink-2)',
            }}
          >
            <span className="caption">{b.weekOf}{i === 0 ? ' · latest' : ''}</span>
            <div style={{ fontSize: 13, marginTop: 2 }}>{b.title}</div>
          </button>
        )
      })}
    </div>
  )
}

interface AnomalyListProps { items: DisplayAnomaly[]; compact?: boolean }

function AnomalyList({ items, compact = false }: AnomalyListProps) {
  return (
    <>
      {items.map((a, i, arr) => (
        <div
          key={a.key}
          style={{
            padding: compact ? '14px 0' : '12px 0',
            borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: 99, marginTop: compact ? 8 : 6,
            background: SEV_DOT_COLOR[a.severity], flexShrink: 0,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: compact ? 14 : 13, color: 'var(--ink)', lineHeight: 1.5 }}>{a.label}</div>
            <div className="caption" style={{ marginTop: compact ? 3 : 2 }}>{a.sub}</div>
          </div>
        </div>
      ))}
    </>
  )
}

function IntelMobile() {
  const { briefings } = useBriefing()
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const latest = briefings[0] ?? null
  const shown = (selectedWeek && briefings.find(b => b.weekOf === selectedWeek)) || latest

  const anomalies = shown ? liveAnomalies(shown) : demoAnomalies(EXTRA_ANOMALIES)
  const banner = staleNote(shown)

  return (
    <>
      <SectionTitle kicker="Weekly read · drafted by Claude" title="Briefings" />
      {latest == null && (
        <div style={{ padding: '0 22px 12px' }}>
          <DemoBadge />
        </div>
      )}

      <div style={{ padding: '0 22px 24px' }}>
        <h2 className="display" style={{ fontSize: 28, margin: 0, lineHeight: 1.2 }}>
          {shown ? shown.title : DEMO_TITLE}
        </h2>
        <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
          <span className="chip">{shown ? shown.weekOf : 'Fresh · 6h ago'}</span>
          {banner && <span className="chip chip-warn">{banner}</span>}
        </div>
        <p className="body" style={{ marginTop: 18, fontSize: 15, lineHeight: 1.7 }}>
          {shown ? shown.body : FX.intel.weekly}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button type="button" className="btn btn-sm" onClick={() => setShowHistory(v => !v)}>
            {showHistory ? 'Hide history' : 'Read history'}
          </button>
        </div>
        {showHistory && (
          <HistoryPanel
            briefings={briefings}
            activeWeek={selectedWeek}
            onSelect={(w) => { setSelectedWeek(w); setShowHistory(false) }}
          />
        )}
      </div>

      <div style={{ padding: '0 22px 24px' }}>
        <div className="section-rule">Anomalies · 24h</div>
      </div>
      {shown == null && (
        <div style={{ padding: '0 22px 8px' }}>
          <DemoBadge />
        </div>
      )}
      <div style={{ padding: '0 22px 24px' }}>
        <AnomalyList items={anomalies} compact />
      </div>

      <div style={{ padding: '0 22px 16px' }}>
        <div className="section-rule">ALCO decisions</div>
      </div>
      <div style={{ padding: '0 16px 8px' }}>
        <DemoBadge />
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
    </>
  )
}

function IntelDesktop() {
  const { briefings } = useBriefing()
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const latest = briefings[0] ?? null
  const shown = (selectedWeek && briefings.find(b => b.weekOf === selectedWeek)) || latest

  const sidebarDemo = demoAnomalies([
    { code: 'X-RES', label: 'Repo borrowing +42% in 8w', sev: 'up'   as AnomalySev },
    { code: 'X-AUC', label: '364D under-sub 3 of 4',     sev: 'warn' as AnomalySev },
  ])
  const anomalies = shown ? liveAnomalies(shown) : sidebarDemo
  const banner = staleNote(shown)

  return (
    <>
      <DesktopHeader section="Briefings" breadcrumb="YieldScope · Weekly read & ALCO log" />
      {latest == null && (
        <div style={{ padding: '0 48px' }}>
          <DemoBadge />
        </div>
      )}

      <div style={{ padding: '40px 48px 0', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 56 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Weekly read · {shown ? shown.weekOf : 'Wednesday'} · drafted by Claude
          </div>
          <h2 className="display" style={{ fontSize: 44, margin: 0, lineHeight: 1.15 }}>
            {shown ? shown.title : DEMO_TITLE}
          </h2>
          {banner && (
            <div style={{ marginTop: 14 }}>
              <span className="chip chip-warn">{banner}</span>
            </div>
          )}
          <p className="body" style={{ marginTop: 22, fontSize: 17, lineHeight: 1.7, color: 'var(--ink)', maxWidth: 720 }}>
            {shown ? shown.body : FX.intel.weekly}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
            <button type="button" className="btn" onClick={() => setShowHistory(v => !v)}>
              {showHistory ? 'Hide history' : 'Read history'}
            </button>
          </div>
          {showHistory && (
            <div style={{ maxWidth: 720 }}>
              <HistoryPanel
                briefings={briefings}
                activeWeek={selectedWeek}
                onSelect={(w) => { setSelectedWeek(w); setShowHistory(false) }}
              />
            </div>
          )}
        </div>

        <aside>
          <div className="card-flat" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              Anomalies · 24h{shown == null && <DemoBadge />}
            </div>
            <AnomalyList items={anomalies} />
          </div>
        </aside>
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '40px 48px 0' }} />

      <div style={{ padding: '32px 48px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6, display: 'flex', gap: 10, alignItems: 'center' }}>
              What happened · 7 weeks <DemoBadge />
            </div>
            <h3 className="display" style={{ fontSize: 24, margin: 0 }}>The market through April–May</h3>
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
            <div className="eyebrow" style={{ marginBottom: 6, display: 'flex', gap: 10, alignItems: 'center' }}>
              ALCO decision log · Week 22 <DemoBadge />
            </div>
            <h3 className="display" style={{ fontSize: 24, margin: 0 }}>Six entries</h3>
          </div>
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
