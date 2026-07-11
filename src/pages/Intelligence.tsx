import { useState } from 'react'
import { useIsDesktop } from '../lib/hooks'
import { useBriefing } from '../hooks/useBriefing'
import type { Briefing } from '../lib/econdelta'
import { BriefingBody } from '../lib/briefingMarkdown'
import { dayMon } from '../lib/auctions'
import { SectionTitle } from '../components/primitives'
import { Timeline } from '../components/charts'
import { DesktopHeader } from '../components/layout/DesktopHeader'

type AnomalySev = 'warn' | 'up' | 'down'

const SEV_DOT_COLOR: Record<AnomalySev, string> = {
  warn: 'var(--warn)',
  up:   'var(--neg)',
  down: 'var(--pos)',
}

interface TimelineEvent { pct: number; label: string; sub: string; sev: 'info' | 'warn' | 'pos' | 'neg' }

/** Newest-first briefings → oldest-left timeline. Severity = anomaly count
 *  (0 info · 1–3 warn · 4+ neg). Null under 2 points — a one-dot timeline lies. */
// eslint-disable-next-line react-refresh/only-export-components -- exported for unit test coverage
export function briefingsToTimeline(briefings: Briefing[]): { axis: string[]; events: TimelineEvent[] } | null {
  const asc = briefings.slice(0, 7).reverse()
  if (asc.length < 2) return null
  const events = asc.map((b, i) => {
    const n = b.featuredAnomalies.length
    return {
      pct: Math.round((0.04 + (0.92 * i) / (asc.length - 1)) * 10000) / 10000,
      label: b.title.length > 44 ? `${b.title.slice(0, 43)}…` : b.title,
      sub: dayMon(b.weekOf, false),
      sev: (n === 0 ? 'info' : n <= 3 ? 'warn' : 'neg') as TimelineEvent['sev'],
    }
  })
  return { axis: asc.map(b => dayMon(b.weekOf, false)), events }
}

interface DisplayAnomaly { key: string; label: string; sub: string; severity: AnomalySev }

// Live anomalies carry Python-computed numbers (the integrity guarantee); show
// the label + the concrete `detail` figure.
function liveAnomalies(b: Briefing): DisplayAnomaly[] {
  return b.featuredAnomalies.map(a => ({
    key: a.candidate_id, label: a.label, sub: a.detail, severity: a.severity,
  }))
}

function NoBriefingYet() {
  return (
    <div className="card-flat" style={{ padding: '20px 18px' }}>
      <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>No briefing published yet</div>
      <div className="caption" style={{ marginTop: 4 }}>The weekly read is generated every Monday morning (BDT).</div>
    </div>
  )
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

  const anomalies = shown ? liveAnomalies(shown) : []
  const banner = staleNote(shown)

  return (
    <>
      <SectionTitle kicker="Weekly read · drafted by Claude" title="Briefings" />

      <div style={{ padding: '0 22px 24px' }}>
        {shown ? (
          <>
            <h2 className="display" style={{ fontSize: 28, margin: 0, lineHeight: 1.2 }}>
              {shown.title}
            </h2>
            <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
              <span className="chip">{shown.weekOf}</span>
              {banner && <span className="chip chip-warn">{banner}</span>}
            </div>
            <div style={{ marginTop: 18 }}>
              <BriefingBody markdown={shown.body} baseSize={15} />
            </div>
          </>
        ) : (
          <NoBriefingYet />
        )}
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
        <div className="section-rule">Anomalies · this week</div>
      </div>
      {shown != null && (
        <div style={{ padding: '0 22px 24px' }}>
          {anomalies.length === 0 ? (
            <div className="caption">No anomalies flagged this week.</div>
          ) : (
            <AnomalyList items={anomalies} compact />
          )}
        </div>
      )}
    </>
  )
}

function IntelDesktop() {
  const { briefings } = useBriefing()
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const latest = briefings[0] ?? null
  const shown = (selectedWeek && briefings.find(b => b.weekOf === selectedWeek)) || latest

  const anomalies = shown ? liveAnomalies(shown) : []
  const banner = staleNote(shown)

  return (
    <>
      <DesktopHeader section="Briefings" breadcrumb="YieldScope · Weekly read" />

      <div style={{ padding: '40px 48px 0', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 56 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Weekly read{shown ? ` · ${shown.weekOf}` : ''} · drafted by Claude
          </div>
          {shown ? (
            <>
              <h2 className="display" style={{ fontSize: 44, margin: 0, lineHeight: 1.15 }}>
                {shown.title}
              </h2>
              {banner && (
                <div style={{ marginTop: 14 }}>
                  <span className="chip chip-warn">{banner}</span>
                </div>
              )}
              <div style={{ marginTop: 22, color: 'var(--ink)', maxWidth: 720 }}>
                <BriefingBody markdown={shown.body} baseSize={17} />
              </div>
            </>
          ) : (
            <div style={{ marginTop: 14 }}>
              <NoBriefingYet />
            </div>
          )}
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
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              Anomalies · this week
            </div>
            {shown != null && (
              anomalies.length === 0 ? (
                <div className="caption">No anomalies flagged this week.</div>
              ) : (
                <AnomalyList items={anomalies} />
              )
            )}
          </div>
        </aside>
      </div>

      {(() => {
        const tl = briefingsToTimeline(briefings)
        if (!tl) return null
        return (
          <>
            <div style={{ height: 1, background: 'var(--line)', margin: '40px 48px 0' }} />
            <div style={{ padding: '32px 48px 48px' }}>
              <div style={{ marginBottom: 22 }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>What happened · last {tl.events.length} weeks</div>
                <h3 className="display" style={{ fontSize: 24, margin: 0 }}>The market, week by week</h3>
              </div>
              <div className="card-flat" style={{ padding: '24px 24px 16px' }}>
                <Timeline w={1100} h={150} axis={tl.axis} events={tl.events} />
              </div>
            </div>
          </>
        )
      })()}
    </>
  )
}

export default function Intelligence() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <IntelDesktop /> : <IntelMobile />
}
