export interface SlopeItem {
  label: string
  a: number
  b: number
  color?: string
}

interface SlopeChartProps {
  items: SlopeItem[]
  w?: number
  h?: number
  leftLabel?: string
  rightLabel?: string
  fmt?: (v: number) => string
}

export function SlopeChart({ items, w = 360, h = 220, leftLabel = 'Then', rightLabel = 'Now', fmt = v => v.toFixed(1) }: SlopeChartProps) {
  const allVals = items.flatMap(it => [it.a, it.b])
  const min = Math.min(...allVals)
  const max = Math.max(...allVals)
  const range = max - min || 1
  const padX = 60
  const padTop = 30
  const padBot = 24
  const yFor = (v: number) => padTop + (1 - (v - min) / range) * (h - padTop - padBot)

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <text
        x={padX}
        y={20}
        fontSize="10"
        fill="var(--ink-3)"
        fontFamily="var(--sans)"
        letterSpacing="0.06em"
        style={{ textTransform: 'uppercase' }}
      >
        {leftLabel}
      </text>
      <text
        x={w - padX}
        y={20}
        textAnchor="end"
        fontSize="10"
        fill="var(--ink-3)"
        fontFamily="var(--sans)"
        letterSpacing="0.06em"
        style={{ textTransform: 'uppercase' }}
      >
        {rightLabel}
      </text>
      <line x1={padX} x2={padX} y1={padTop} y2={h - padBot} stroke="var(--line)" />
      <line x1={w - padX} x2={w - padX} y1={padTop} y2={h - padBot} stroke="var(--line)" />
      {items.map(it => {
        const yA = yFor(it.a)
        const yB = yFor(it.b)
        const trend = it.b > it.a ? 'up' : it.b < it.a ? 'down' : 'flat'
        const color = it.color ?? (trend === 'up' ? 'var(--neg)' : trend === 'down' ? 'var(--pos)' : 'var(--ink-3)')
        return (
          <g key={it.label}>
            <line x1={padX} y1={yA} x2={w - padX} y2={yB} stroke={color} strokeWidth="1.5" opacity="0.6" />
            <circle cx={padX} cy={yA} r="3.5" fill={color} />
            <circle cx={w - padX} cy={yB} r="3.5" fill={color} />
            <text x={padX - 8} y={yA + 4} textAnchor="end" fontSize="11" fill="var(--ink-2)" fontFamily="var(--sans)" letterSpacing="-0.005em">{it.label}</text>
            <text x={padX + 6} y={yA - 6} fontSize="10" fill="var(--ink-3)" fontFamily="var(--sans)" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(it.a)}</text>
            <text x={w - padX - 6} y={yB - 6} textAnchor="end" fontSize="10.5" fontWeight="500" fill={color} fontFamily="var(--sans)" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(it.b)}</text>
          </g>
        )
      })}
    </svg>
  )
}
