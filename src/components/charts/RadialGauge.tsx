interface RadialGaugeProps {
  value: number
  max?: number
  label?: string
  unit?: string
  size?: number
  thresholds?: [number, number]
}

export function RadialGauge({ value, max = 100, label, unit = '', size = 200, thresholds = [33, 66] }: RadialGaugeProps) {
  const r = (size - 28) / 2
  const c = size / 2
  const cy = size * 0.62
  const pct = Math.max(0, Math.min(1, value / max))
  const alpha = Math.PI + Math.PI * pct
  const endX = c + r * Math.cos(alpha)
  const endY = cy + r * Math.sin(alpha)
  const bgArc = `M ${c - r} ${cy} A ${r} ${r} 0 0 1 ${c + r} ${cy}`
  const fgArc = pct > 0.001 ? `M ${c - r} ${cy} A ${r} ${r} 0 0 1 ${endX} ${endY}` : null
  const fillColor =
    value >= thresholds[1] ? 'var(--neg)' :
    value >= thresholds[0] ? 'var(--warn)' :
    'var(--pos)'

  return (
    <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
      <path d={bgArc} stroke="var(--sunken)" strokeWidth="12" fill="none" strokeLinecap="round" />
      {fgArc && <path d={fgArc} stroke={fillColor} strokeWidth="12" fill="none" strokeLinecap="round" />}
      {[0.33, 0.66].map(t => {
        const ta = Math.PI + Math.PI * t
        const tx = c + (r + 12) * Math.cos(ta)
        const ty = cy + (r + 12) * Math.sin(ta)
        return <circle key={t} cx={tx} cy={ty} r="1.5" fill="var(--ink-3)" />
      })}
      <text
        x={c}
        y={cy - 12}
        textAnchor="middle"
        fontSize={size * 0.18}
        fontWeight="500"
        fill="var(--ink)"
        fontFamily="var(--sans)"
        letterSpacing="-0.03em"
      >
        {value}{unit}
      </text>
      {label && (
        <text
          x={c}
          y={cy + 6}
          textAnchor="middle"
          fontSize="10"
          fill="var(--ink-3)"
          fontFamily="var(--sans)"
          letterSpacing="0.06em"
          style={{ textTransform: 'uppercase' }}
        >
          {label}
        </text>
      )}
      <text x={c - r} y={cy + 18} textAnchor="middle" fontSize="9" fill="var(--ink-4)" fontFamily="var(--sans)">0</text>
      <text x={c + r} y={cy + 18} textAnchor="middle" fontSize="9" fill="var(--ink-4)" fontFamily="var(--sans)">{max}</text>
    </svg>
  )
}
