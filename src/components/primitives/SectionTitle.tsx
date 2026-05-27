import type { ReactNode } from 'react'

interface SectionTitleProps {
  kicker?: ReactNode
  title: ReactNode
  action?: ReactNode
}

export function SectionTitle({ kicker, title, action }: SectionTitleProps) {
  return (
    <div
      style={{
        padding: '18px 22px 12px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div>
        {kicker && <div className="eyebrow" style={{ marginBottom: 6 }}>{kicker}</div>}
        <h2 className="display" style={{ margin: 0, fontSize: 32 }}>
          <span style={{ color: 'var(--ink)' }}>{title}</span>
        </h2>
      </div>
      {action}
    </div>
  )
}
