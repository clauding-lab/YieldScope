import { useState, type MouseEvent, type TouchEvent } from 'react'
import { FX } from '../../data/fixtures'
import { useYields } from '../../hooks/useYields'
import { isLiveDataAvailable } from '../../lib/econdelta'
import { monthLabel } from '../../lib/dates'
import { DemoBadge } from '../primitives/DemoBadge'
import {
  LIVE_CURVE_AXIS,
  MIN_LIVE_POINTS,
  liveCurvePoints,
  liveCurveSegments,
  scrubValueAt,
  gapTenors,
} from '../../lib/curveLive'

type OverlayKey = 'yearAgo' | 'quarterAgo' | 'monthAgo' | 'weekAgo' | 'latest'

interface YieldCurveProps {
  w?: number
  h?: number
  showLegend?: boolean
  defaultOverlays?: OverlayKey[]
}

interface SeriesDef {
  key: OverlayKey
  label: string
  color: string
  dashed?: boolean
}

const SERIES: SeriesDef[] = [
  { key: 'yearAgo',    label: '1 year ago', color: 'var(--ink-4)', dashed: true },
  { key: 'quarterAgo', label: '3 months',   color: 'var(--ink-3)' },
  { key: 'monthAgo',   label: '1 month',    color: 'var(--info)' },
  { key: 'weekAgo',    label: '1 week',     color: 'var(--ink-2)' },
  { key: 'latest',     label: 'Today',      color: 'var(--accent)' },
]

/**
 * Sovereign yield curve. Option B (Adnan's revised axis decision, 2026-07-09,
 * superseding the same-day Option A): the LIVE axis is exactly the 7 EconDelta
 * tenors (91D–20Y) — the four never-live tenors (7D/14D/28D/15Y) are off the
 * axis entirely. The gap machinery survives for genuinely missing prints
 * WITHIN the 7: a tenor with no row renders as a labelled gap, any span
 * across it draws as a dashed bridge, and the scrub readout shows "— no live
 * print" — never interpolated, never a fabricated value (landmines 15/18).
 * The fixture curve keeps its own 11-tenor axis (with its 5 overlays) and
 * renders ONLY in no-credentials builds, self-badged with `Demo data`. The
 * component owns its own honesty chrome so every mount (Dashboard
 * mobile/desktop, Yields mobile/desktop) stays consistent — the F3 lesson.
 */
export function YieldCurve({ w = 480, h = 240, showLegend = true, defaultOverlays = ['latest', 'weekAgo', 'yearAgo'] }: YieldCurveProps) {
  const liveAvail = isLiveDataAvailable()
  const { data, loading, error } = useYields()
  const [scrubIdx, setScrubIdx] = useState<number | null>(null)
  const [active, setActive] = useState<OverlayKey[]>(defaultOverlays)

  const points = liveCurvePoints(LIVE_CURVE_AXIS, data?.yields ?? null)
  // live: enough real points · skeleton: creds present, fetch not settled ·
  // fixture: no creds (or a settled fetch with <2 live tenors — DB empty).
  const mode: 'live' | 'skeleton' | 'fixture' = liveAvail
    ? (loading ? 'skeleton' : points.length >= MIN_LIVE_POINTS ? 'live' : 'fixture')
    : 'fixture'

  // Live/skeleton use the 7-tenor live axis; fixture keeps its own 11-tenor
  // axis (deliberate: the fixture is a demo artefact, not a claim about live
  // coverage, and it stays badged — the two axes no longer need to match).
  const tenors: readonly string[] = mode === 'fixture' ? FX.curve.tenors : LIVE_CURVE_AXIS
  const series = SERIES.filter(s => active.includes(s.key))

  const padL = 38, padR = 16, padT = 14, padB = 30
  let minY: number, maxY: number
  if (mode === 'live') {
    const vals = points.map(p => p.value)
    minY = Math.min(...vals) - 0.25
    maxY = Math.max(...vals) + 0.25
  } else if (mode === 'fixture') {
    const allY = series.flatMap(s => FX.curve[s.key])
    minY = Math.min(...allY)
    maxY = Math.max(...allY)
  } else {
    // Skeleton: neutral scaffold range; y-value labels are suppressed below.
    minY = 8
    maxY = 12
  }
  const range = maxY - minY || 1
  const dx = (w - padL - padR) / (tenors.length - 1)
  const xFor = (i: number) => padL + i * dx
  const yFor = (v: number) => padT + (1 - (v - minY) / range) * (h - padT - padB)

  const liveTenorSet = new Set(points.map(p => p.tenor))
  const segments = mode === 'live' ? liveCurveSegments(points) : []

  // Compact vintage note for the lagged monthly rungs (2Y/20Y — landmine 21).
  const v2y = monthLabel(data?.tenorAsOf?.['2Y'])
  const v20y = monthLabel(data?.tenorAsOf?.['20Y'])
  const monthlyVintage = v2y && v20y
    ? (v2y === v20y ? `2Y/20Y ${v2y}` : `2Y ${v2y} · 20Y ${v20y}`)
    : v2y ? `2Y ${v2y}` : v20y ? `20Y ${v20y}` : null

  function handleMove(e: MouseEvent<SVGSVGElement> | TouchEvent<SVGSVGElement>) {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as MouseEvent<SVGSVGElement>).clientX - rect.left
    const rel = (x / rect.width) * w
    const idx = Math.round((rel - padL) / dx)
    if (idx >= 0 && idx < tenors.length) setScrubIdx(idx)
  }

  const scrubLive = scrubIdx != null && mode === 'live' ? scrubValueAt(points, scrubIdx) : null

  // Honest error note (#25 review MEDIUM, narrow wire): with credentials, a
  // rejected fetch lands in fixture mode — say so, don't let the badged demo
  // read as "settled, DB simply empty". The shared econdelta fetchers now THROW
  // on a Supabase error (mirroring lib/auctions.ts), so a live-data outage
  // reaches useYields' error state and this branch actually fires.
  const fetchErrored = liveAvail && !loading && error != null

  return (
    <div>
      {mode === 'fixture' && (
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <DemoBadge />
          {fetchErrored && (
            <span className="caption" style={{ color: 'var(--warn)' }}>Live fetch failed — showing demo data</span>
          )}
        </div>
      )}
      <svg
        width="100%"
        viewBox={`0 0 ${w} ${h}`}
        style={{ display: 'block', cursor: 'crosshair', touchAction: 'none' }}
        onMouseMove={handleMove}
        onMouseLeave={() => setScrubIdx(null)}
        onTouchMove={handleMove}
        onTouchEnd={() => setScrubIdx(null)}
      >
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = padT + t * (h - padT - padB)
          const v = maxY - t * range
          return (
            <g key={t}>
              <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="var(--line)" />
              {mode !== 'skeleton' && (
                <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--ink-3)" fontFamily="var(--sans)">
                  {v.toFixed(1)}
                </text>
              )}
            </g>
          )
        })}
        {tenors.map((t, i) => {
          const gapped = mode === 'live' && !liveTenorSet.has(t)
          return (
            <text
              key={t}
              x={xFor(i)}
              y={h - 10}
              textAnchor="middle"
              fontSize="10"
              fill="var(--ink-3)"
              fontFamily="var(--sans)"
              opacity={gapped ? 0.45 : 1}
            >
              {t}
            </text>
          )
        })}
        {mode === 'fixture' && series.map(s => {
          const path = FX.curve[s.key].map((v, i) => `${i === 0 ? 'M' : 'L'}${xFor(i)},${yFor(v)}`).join(' ')
          const isLatest = s.key === 'latest'
          return (
            <path
              key={s.key}
              d={path}
              fill="none"
              stroke={s.color}
              strokeWidth={isLatest ? 1.8 : 1.2}
              strokeDasharray={s.dashed ? '3 3' : undefined}
              strokeLinecap="round"
            />
          )
        })}
        {mode === 'fixture' && active.includes('latest') && FX.curve.latest.map((v, i) => (
          <circle key={i} cx={xFor(i)} cy={yFor(v)} r="2.5" fill="var(--accent)" />
        ))}
        {mode === 'live' && segments.map(seg => (
          <path
            key={`${seg.from.tenor}-${seg.to.tenor}`}
            d={`M${xFor(seg.from.index)},${yFor(seg.from.value)} L${xFor(seg.to.index)},${yFor(seg.to.value)}`}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={seg.bridged ? 1.4 : 1.8}
            strokeDasharray={seg.bridged ? '3 4' : undefined}
            opacity={seg.bridged ? 0.65 : 1}
            strokeLinecap="round"
            data-bridged={seg.bridged || undefined}
          />
        ))}
        {mode === 'live' && points.map(p => (
          <circle key={p.tenor} cx={xFor(p.index)} cy={yFor(p.value)} r="2.5" fill="var(--accent)" />
        ))}
        {scrubIdx != null && mode !== 'skeleton' && (
          <g>
            <line x1={xFor(scrubIdx)} x2={xFor(scrubIdx)} y1={padT} y2={h - padB} stroke="var(--ink-3)" strokeDasharray="2 3" />
            {mode === 'fixture' && series.map(s => (
              <circle
                key={s.key}
                cx={xFor(scrubIdx)}
                cy={yFor(FX.curve[s.key][scrubIdx])}
                r="4"
                fill="var(--paper)"
                stroke={s.color}
                strokeWidth="1.5"
              />
            ))}
            {mode === 'live' && scrubLive != null && (
              <circle cx={xFor(scrubIdx)} cy={yFor(scrubLive)} r="4" fill="var(--paper)" stroke="var(--accent)" strokeWidth="1.5" />
            )}
          </g>
        )}
      </svg>
      {scrubIdx != null && mode === 'live' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 14, fontSize: 13 }}>
          <span style={{ fontSize: 18, color: 'var(--accent)' }}>{tenors[scrubIdx]}</span>
          {scrubLive != null ? (
            <span className="num" style={{ color: 'var(--accent)', fontWeight: 500 }}>{scrubLive.toFixed(2)}</span>
          ) : (
            <span className="caption">— no live print</span>
          )}
        </div>
      ) : scrubIdx != null && mode === 'fixture' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 14, fontSize: 13 }}>
          <span style={{ fontSize: 18, color: 'var(--accent)' }}>{tenors[scrubIdx]}</span>
          {series.map(s => (
            <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--ink-3)' }}>{s.label}</span>
              <span className="num" style={{ color: s.color, fontWeight: 500 }}>
                {FX.curve[s.key][scrubIdx].toFixed(2)}
              </span>
            </span>
          ))}
        </div>
      ) : mode === 'live' ? (
        <div className="caption" style={{ paddingTop: 14 }}>
          {/* Full coverage reads "Live · 91D–20Y"; a missing print downgrades
              to an explicit count + names the gap (Option B keeps gap honesty). */}
          Live · {points.length === LIVE_CURVE_AXIS.length
            ? `${LIVE_CURVE_AXIS[0]}–${LIVE_CURVE_AXIS[LIVE_CURVE_AXIS.length - 1]}`
            : `${points.length} of ${LIVE_CURVE_AXIS.length} tenors`}
          {gapTenors(LIVE_CURVE_AXIS, points).length > 0 && ` · no print: ${gapTenors(LIVE_CURVE_AXIS, points).join(' · ')}`}
          {monthlyVintage && ` · ${monthlyVintage}`}
        </div>
      ) : mode === 'fixture' && showLegend ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 14, flexWrap: 'wrap' }}>
          {SERIES.map(s => {
            const isOn = active.includes(s.key)
            return (
              <button
                key={s.key}
                onClick={() => setActive(a => a.includes(s.key) ? a.filter(k => k !== s.key) : [...a, s.key])}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  opacity: isOn ? 1 : 0.4,
                  fontSize: 12,
                  color: 'var(--ink-2)',
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  fontFamily: 'inherit',
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 2,
                    background: s.color,
                    display: 'inline-block',
                    borderRadius: 2,
                    borderTop: s.dashed ? `1px dashed ${s.color}` : undefined,
                  }}
                />
                {s.label}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
