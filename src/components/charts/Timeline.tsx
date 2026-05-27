type Severity = 'warn' | 'neg' | 'pos' | 'info'

interface TimelineEvent {
  pct: number
  label: string
  sub?: string
  sev?: Severity
}

interface TimelineProps {
  events: TimelineEvent[]
  axis: string[]
  w?: number
  h?: number
}

const SEV_COLOR: Record<Severity, string> = {
  warn: 'var(--warn)',
  neg:  'var(--neg)',
  pos:  'var(--pos)',
  info: 'var(--accent)',
}

export function Timeline({ events, axis, w = 720, h = 130 }: TimelineProps) {
  const padX = 28
  const axisY = h - 30
  const innerW = w - 2 * padX

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <line x1={padX} x2={w - padX} y1={axisY} y2={axisY} stroke="var(--line-2)" />
      {axis.map((t, i) => {
        const x = padX + innerW * (i / (axis.length - 1))
        return (
          <g key={t}>
            <line x1={x} x2={x} y1={axisY - 3} y2={axisY + 3} stroke="var(--ink-3)" />
            <text x={x} y={h - 8} textAnchor="middle" fontSize="10" fill="var(--ink-3)" fontFamily="var(--sans)">{t}</text>
          </g>
        )
      })}
      {events.map((e, i) => {
        const x = padX + innerW * e.pct
        const above = i % 2 === 0
        const color = SEV_COLOR[e.sev ?? 'info']
        const labelY = above ? axisY - 24 : axisY + 26
        const subY = above ? axisY - 38 : axisY + 38
        return (
          <g key={i}>
            <line
              x1={x}
              x2={x}
              y1={above ? labelY + 6 : labelY - 12}
              y2={axisY}
              stroke={color}
              opacity="0.4"
              strokeDasharray="2 3"
            />
            <circle cx={x} cy={axisY} r="4.5" fill={color} stroke="var(--bg)" strokeWidth="2" />
            <text x={x} y={labelY} textAnchor="middle" fontSize="11" fontWeight="500" fill={color} fontFamily="var(--sans)" letterSpacing="-0.005em">{e.label}</text>
            {e.sub && (
              <text x={x} y={subY} textAnchor="middle" fontSize="9.5" fill="var(--ink-3)" fontFamily="var(--sans)">{e.sub}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
