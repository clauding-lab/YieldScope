interface BarDatum {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  data: BarDatum[]
  w?: number
  h?: number
  color?: string
  fmt?: (v: number) => string
  threshold?: number
}

export function BarChart({ data, w = 420, h = 180, color = 'var(--accent)', fmt = v => v.toFixed(1), threshold }: BarChartProps) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.value))
  const min = Math.min(0, ...data.map(d => d.value))
  const padX = 14
  const padTop = 22
  const padBot = 28
  const slot = (w - padX * 2) / data.length
  const barW = Math.min(34, slot - 8)
  const range = max - min || 1

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {threshold != null && (
        <g>
          <line
            x1={padX}
            x2={w - padX}
            y1={h - padBot - ((threshold - min) / range) * (h - padTop - padBot)}
            y2={h - padBot - ((threshold - min) / range) * (h - padTop - padBot)}
            stroke="var(--ink-3)"
            strokeDasharray="3 3"
          />
          <text
            x={w - padX}
            y={h - padBot - ((threshold - min) / range) * (h - padTop - padBot) - 4}
            textAnchor="end"
            fontSize="9"
            fill="var(--ink-3)"
            fontFamily="var(--sans)"
          >
            {fmt(threshold)}
          </text>
        </g>
      )}
      {data.map((d, i) => {
        const x = padX + i * slot + (slot - barW) / 2
        const barH = (Math.abs(d.value - Math.max(0, min)) / range) * (h - padTop - padBot)
        const y = h - padBot - barH
        const c = d.color ?? color
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={barH} fill={c} rx={3} />
            <text
              x={x + barW / 2}
              y={y - 6}
              textAnchor="middle"
              fontSize="10.5"
              fill="var(--ink-2)"
              fontFamily="var(--sans)"
              fontWeight="500"
              letterSpacing="-0.01em"
            >
              {fmt(d.value)}
            </text>
            <text
              x={x + barW / 2}
              y={h - 10}
              textAnchor="middle"
              fontSize="10"
              fill="var(--ink-3)"
              fontFamily="var(--sans)"
            >
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
