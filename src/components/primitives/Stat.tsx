import { Delta } from './Delta'
import { Sparkline } from './Sparkline'

interface StatProps {
  label: string
  value: string | number
  unit?: string
  change?: number
  invert?: boolean
  sparkline?: number[]
  sparkColor?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero'
  sub?: string
}

const SIZE_MAP: Record<NonNullable<StatProps['size']>, number> = {
  sm: 22,
  md: 28,
  lg: 36,
  xl: 44,
  hero: 56,
}

export function Stat({ label, value, unit, change, invert = false, sparkline, sparkColor, size = 'md', sub }: StatProps) {
  const fs = SIZE_MAP[size]
  return (
    <div>
      <div className="label">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
        <span className="serif-num" style={{ fontSize: fs, color: 'var(--ink)' }}>{value}</span>
        {unit && <span className="caption">{unit}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
        {change != null && <Delta value={change} invert={invert} size={size === 'sm' ? 'sm' : 'md'} />}
        {sub && <span className="caption">{sub}</span>}
        {sparkline && <Sparkline data={sparkline} w={70} h={20} color={sparkColor} />}
      </div>
    </div>
  )
}
