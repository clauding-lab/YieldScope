import { useState, type ReactNode } from 'react'

interface CollapseProps {
  title: ReactNode
  eyebrow?: ReactNode
  summary?: ReactNode
  children?: ReactNode
  defaultOpen?: boolean
}

export function Collapse({ title, eyebrow, summary, children, defaultOpen = false }: CollapseProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '18px 22px',
          background: 'transparent',
          border: 0,
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          color: 'inherit',
        }}
      >
        <div style={{ flex: 1 }}>
          {eyebrow && <div className="eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div>}
          <div className="heading" style={{ fontSize: 15 }}>{title}</div>
          {!open && summary && <div className="body" style={{ marginTop: 6, fontSize: 13 }}>{summary}</div>}
        </div>
        <span
          style={{
            color: 'var(--ink-3)',
            fontSize: 13,
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
          }}
        >
          ⌄
        </span>
      </button>
      {open && <div style={{ padding: '0 22px 22px' }}>{children}</div>}
    </div>
  )
}
