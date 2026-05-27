import { useState, type MouseEvent, type TouchEvent } from 'react'
import { FX } from '../../data/fixtures'

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

export function YieldCurve({ w = 480, h = 240, showLegend = true, defaultOverlays = ['latest', 'weekAgo', 'yearAgo'] }: YieldCurveProps) {
  const tenors = FX.curve.tenors
  const [scrubIdx, setScrubIdx] = useState<number | null>(null)
  const [active, setActive] = useState<OverlayKey[]>(defaultOverlays)

  const series = SERIES.filter(s => active.includes(s.key))

  const padL = 38, padR = 16, padT = 14, padB = 30
  const allY = series.flatMap(s => FX.curve[s.key])
  const minY = Math.min(...allY)
  const maxY = Math.max(...allY)
  const range = maxY - minY || 1
  const dx = (w - padL - padR) / (tenors.length - 1)
  const xFor = (i: number) => padL + i * dx
  const yFor = (v: number) => padT + (1 - (v - minY) / range) * (h - padT - padB)

  function handleMove(e: MouseEvent<SVGSVGElement> | TouchEvent<SVGSVGElement>) {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as MouseEvent<SVGSVGElement>).clientX - rect.left
    const rel = (x / rect.width) * w
    const idx = Math.round((rel - padL) / dx)
    if (idx >= 0 && idx < tenors.length) setScrubIdx(idx)
  }

  return (
    <div>
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
              <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--ink-3)" fontFamily="var(--sans)">
                {v.toFixed(1)}
              </text>
            </g>
          )
        })}
        {tenors.map((t, i) => (
          <text key={t} x={xFor(i)} y={h - 10} textAnchor="middle" fontSize="10" fill="var(--ink-3)" fontFamily="var(--sans)">
            {t}
          </text>
        ))}
        {series.map(s => {
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
        {active.includes('latest') && FX.curve.latest.map((v, i) => (
          <circle key={i} cx={xFor(i)} cy={yFor(v)} r="2.5" fill="var(--accent)" />
        ))}
        {scrubIdx != null && (
          <g>
            <line x1={xFor(scrubIdx)} x2={xFor(scrubIdx)} y1={padT} y2={h - padB} stroke="var(--ink-3)" strokeDasharray="2 3" />
            {series.map(s => (
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
          </g>
        )}
      </svg>
      {scrubIdx != null ? (
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
      ) : showLegend && (
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
      )}
    </div>
  )
}
