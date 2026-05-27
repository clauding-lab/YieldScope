import { useId } from 'react'

interface SparklineProps {
  data: number[]
  w?: number
  h?: number
  color?: string
  strokeWidth?: number
  fill?: boolean
}

export function Sparkline({ data, w = 80, h = 24, color, strokeWidth = 1.4, fill = false }: SparklineProps) {
  const id = useId().replace(/[:]/g, '')
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const dx = w / (data.length - 1)
  const pts = data.map((v, i) => [i * dx, h - 2 - ((v - min) / range) * (h - 4)] as const)
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('')
  const last = data[data.length - 1]
  const first = data[0]
  const stroke = color ?? (last > first ? 'var(--pos)' : last < first ? 'var(--neg)' : 'var(--ink-3)')

  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {fill && (
        <>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={stroke} stopOpacity="0.18" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${path} L${w},${h} L0,${h} Z`} fill={`url(#spark-${id})`} />
        </>
      )}
      <path d={path} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
