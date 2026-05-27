import { useId } from 'react'

interface AreaChartProps {
  data: number[]
  w?: number
  h?: number
  color?: string
  subtle?: boolean
}

export function AreaChart({ data, w = 320, h = 100, color = 'var(--accent)', subtle = false }: AreaChartProps) {
  const id = useId().replace(/[:]/g, '')
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const dx = w / (data.length - 1)
  const pad = 4
  const pts = data.map((v, i) => [i * dx, h - pad - ((v - min) / range) * (h - 2 * pad)] as const)
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('')

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity={subtle ? 0.12 : 0.22} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L${w},${h} L0,${h} Z`} fill={`url(#area-${id})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
