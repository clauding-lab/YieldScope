import { useState, type ReactNode } from 'react'

interface IconButtonProps {
  children: ReactNode
  title?: string
  onClick?: () => void
  size?: number
  active?: boolean
}

export function IconButton({ children, title, onClick, size = 32, active = false }: IconButtonProps) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={title}
      aria-label={title}
      style={{
        width: size,
        height: size,
        borderRadius: 99,
        background: hover || active ? 'var(--accent-soft)' : 'transparent',
        border: '1px solid ' + (hover ? 'var(--line-2)' : 'transparent'),
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        transition: 'background 0.15s ease, border-color 0.15s ease',
        color: 'var(--ink-2)',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}
