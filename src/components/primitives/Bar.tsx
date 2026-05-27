interface BarProps {
  value: number
  max?: number
  color?: string
  track?: string
  h?: number
  thresholds?: [number, number]
}

export function Bar({ value, max = 100, color = 'var(--accent)', track = 'var(--sunken)', h = 4, thresholds }: BarProps) {
  const pct = Math.max(0, Math.min(1, value / max))
  let c = color
  if (thresholds) {
    if (pct >= thresholds[1]) c = 'var(--neg)'
    else if (pct >= thresholds[0]) c = 'var(--warn)'
    else c = 'var(--pos)'
  }
  return (
    <div style={{ height: h, background: track, borderRadius: h, overflow: 'hidden', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${pct * 100}%`,
          background: c,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  )
}
