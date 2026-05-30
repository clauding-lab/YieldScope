import { IconButton } from './IconButton'
import { useTheme } from '../../theme/themeContext'

function ThemeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M8 2.5 A5.5 5.5 0 0 1 8 13.5 Z" fill="currentColor" />
    </svg>
  )
}

interface HeaderActionsProps {
  compact?: boolean
}

export function HeaderActions({ compact = false }: HeaderActionsProps) {
  const { toggleTheme } = useTheme()
  const btnSize = compact ? 32 : 34

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <IconButton title="Toggle theme" onClick={toggleTheme} size={btnSize}>
        <ThemeIcon size={compact ? 13 : 14} />
      </IconButton>
    </div>
  )
}
