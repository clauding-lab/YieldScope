export interface DonutSegment {
  value: number
  color: string
  label: string
}

interface DonutProps {
  segments: DonutSegment[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerValue?: string | number
}

export function Donut({ segments, size = 160, thickness = 24, centerLabel, centerValue }: DonutProps) {
  const r = size / 2 - thickness / 2 - 2
  const c = size / 2
  const circ = 2 * Math.PI * r
  const total = segments.reduce((s, x) => s + x.value, 0) || 1

  const arcs = segments.reduce<{ color: string; len: number; offset: number }[]>((acc, seg) => {
    const len = (seg.value / total) * circ
    const offset = acc.length === 0 ? 0 : acc[acc.length - 1].offset + acc[acc.length - 1].len
    acc.push({ color: seg.color, len, offset })
    return acc
  }, [])

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--sunken)" strokeWidth={thickness} />
      {arcs.map((seg, i) => (
        <circle
          key={i}
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={thickness}
          strokeDasharray={`${seg.len} ${circ - seg.len}`}
          strokeDashoffset={-seg.offset}
          transform={`rotate(-90 ${c} ${c})`}
        />
      ))}
      {centerValue != null && (
        <text
          x={c}
          y={c - 2}
          textAnchor="middle"
          fontSize={size * 0.18}
          fontWeight="500"
          fill="var(--ink)"
          fontFamily="var(--sans)"
          letterSpacing="-0.025em"
        >
          {centerValue}
        </text>
      )}
      {centerLabel && (
        <text
          x={c}
          y={c + size * 0.12}
          textAnchor="middle"
          fontSize="9.5"
          fill="var(--ink-3)"
          fontFamily="var(--sans)"
          letterSpacing="0.06em"
          style={{ textTransform: 'uppercase' }}
        >
          {centerLabel}
        </text>
      )}
    </svg>
  )
}

interface DonutLegendItem {
  value: string | number
  color: string
  label: string
}

export function DonutLegend({ segments }: { segments: DonutLegendItem[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {segments.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 13, color: 'var(--ink)', flex: 1 }}>{s.label}</span>
          <span className="num" style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{s.value}</span>
        </div>
      ))}
    </div>
  )
}
