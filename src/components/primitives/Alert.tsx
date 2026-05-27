import type { ReactNode } from 'react'

type Severity = 'info' | 'warn' | 'neg' | 'pos'

interface AlertProps {
  severity?: Severity
  label?: ReactNode
  title: ReactNode
  when?: ReactNode
}

const SEV_COLOR: Record<Severity, string> = {
  info: 'var(--info)',
  warn: 'var(--warn)',
  neg:  'var(--neg)',
  pos:  'var(--pos)',
}

export function Alert({ severity = 'info', label, title, when }: AlertProps) {
  const color = SEV_COLOR[severity]
  return (
    <div
      style={{
        padding: '14px 18px',
        background: 'var(--paper)',
        borderRadius: 10,
        border: '1px solid var(--line)',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 99,
          background: color,
          marginTop: 8,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        {label && <div className="eyebrow" style={{ color, marginBottom: 2 }}>{label}</div>}
        <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>{title}</div>
      </div>
      {when && <span className="caption" style={{ flexShrink: 0 }}>{when}</span>}
    </div>
  )
}
