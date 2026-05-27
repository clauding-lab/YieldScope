export interface CandleDatum {
  label: string
  open: number
  high: number
  low: number
  close: number
}

interface CandleProps {
  data: CandleDatum[]
  w?: number
  h?: number
}

export function Candle({ data, w = 420, h = 180 }: CandleProps) {
  if (!data.length) return null
  const allY = data.flatMap(d => [d.high, d.low])
  const min = Math.min(...allY)
  const max = Math.max(...allY)
  const range = max - min || 1
  const padX = 22
  const padTop = 12
  const padBot = 24
  const slot = (w - padX * 2) / data.length
  const bodyW = Math.min(14, slot - 6)
  const yFor = (v: number) => padTop + (1 - (v - min) / range) * (h - padTop - padBot)

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {[0, 0.5, 1].map(t => {
        const y = padTop + t * (h - padTop - padBot)
        const v = max - t * range
        return (
          <g key={t}>
            <line x1={padX} x2={w - padX} y1={y} y2={y} stroke="var(--line)" strokeDasharray="2 3" />
            <text
              x={padX - 6}
              y={y + 3}
              textAnchor="end"
              fontSize="9"
              fill="var(--ink-3)"
              fontFamily="var(--sans)"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {v.toFixed(2)}
            </text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const x = padX + i * slot + slot / 2
        const isUp = d.close >= d.open
        const color = isUp ? 'var(--neg)' : 'var(--pos)'
        const yH = yFor(d.high)
        const yL = yFor(d.low)
        const yO = yFor(d.open)
        const yC = yFor(d.close)
        const top = Math.min(yO, yC)
        const bot = Math.max(yO, yC)
        return (
          <g key={d.label}>
            <line x1={x} x2={x} y1={yH} y2={yL} stroke={color} strokeWidth="1.2" />
            <rect x={x - bodyW / 2} y={top} width={bodyW} height={Math.max(1.5, bot - top)} fill={color} rx={1.5} />
            <text x={x} y={h - 8} textAnchor="middle" fontSize="9.5" fill="var(--ink-3)" fontFamily="var(--sans)">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}
