import type { ReactNode } from 'react'

interface ListRowProps {
  label: ReactNode
  value: ReactNode
  sub?: ReactNode
  accent?: boolean
  last?: boolean
}

export function ListRow({ label, value, sub, accent = false, last = false }: ListRowProps) {
  return (
    <div
      style={{
        padding: '12px 0',
        borderBottom: last ? 'none' : '1px solid var(--line)',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 400 }}>{label}</div>
        {sub && <div className="caption" style={{ marginTop: 2 }}>{sub}</div>}
      </div>
      <div
        className="num"
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: accent ? 'var(--accent)' : 'var(--ink)',
          textAlign: 'right',
        }}
      >
        {value}
      </div>
    </div>
  )
}
