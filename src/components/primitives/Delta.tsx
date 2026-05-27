interface DeltaProps {
  value: number | null | undefined
  suffix?: string
  invert?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Delta({ value, suffix = '', invert = false, size = 'sm' }: DeltaProps) {
  if (value == null) return null
  const isUp = value > 0
  const isDown = value < 0
  const polarityGood = invert ? isDown : isUp
  const polarityBad  = invert ? isUp   : isDown
  const color = polarityGood ? 'var(--pos)' : polarityBad ? 'var(--neg)' : 'var(--ink-3)'
  const arrow = isUp ? '↑' : isDown ? '↓' : '·'
  const fontSize = size === 'lg' ? 15 : size === 'md' ? 13 : 12

  return (
    <span className="num" style={{ color, fontSize, fontWeight: 500, letterSpacing: 0 }}>
      {arrow} {value > 0 ? '+' : ''}{value}{suffix}
    </span>
  )
}
