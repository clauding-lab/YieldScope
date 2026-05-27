import type { CSSProperties, ReactNode } from 'react'

interface CardProps {
  title?: ReactNode
  eyebrow?: ReactNode
  action?: ReactNode
  children?: ReactNode
  style?: CSSProperties
  flat?: boolean
  padding?: number
}

export function Card({ title, eyebrow, action, children, style, flat = false, padding = 22 }: CardProps) {
  return (
    <div className={flat ? 'card-flat' : 'card'} style={style}>
      {(title || eyebrow || action) && (
        <div
          style={{
            padding: `${padding - 4}px ${padding}px ${padding - 10}px`,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            {eyebrow && <div className="eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div>}
            {title && <div className="heading" style={{ fontSize: 15, color: 'var(--ink)' }}>{title}</div>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={{ padding: `0 ${padding}px ${padding}px` }}>{children}</div>
    </div>
  )
}
