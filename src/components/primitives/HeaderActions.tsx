import { useState } from 'react'
import { IconButton } from './IconButton'
import { useTheme } from '../../theme/themeContext'

function RefreshIcon({ spinning, size = 14 }: { spinning: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={{
        animation: spinning ? 'spin-once 0.7s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
      }}
    >
      <path d="M13.5 4 V7.5 H10"           stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M13.2 7.5 A5.5 5.5 0 1 0 11.8 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

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
  lastRefresh?: string
}

export function HeaderActions({ compact = false, lastRefresh = '06:00 BST' }: HeaderActionsProps) {
  const [refreshing, setRefreshing] = useState(false)
  const { toggleTheme } = useTheme()

  function handleRefresh() {
    if (refreshing) return
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 700)
  }

  const btnSize = compact ? 32 : 34

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {!compact && <span className="caption nowrap">Updated {lastRefresh}</span>}
      <IconButton title="Refresh data" onClick={handleRefresh} size={btnSize}>
        <RefreshIcon spinning={refreshing} size={compact ? 13 : 15} />
      </IconButton>
      <IconButton title="Toggle theme" onClick={toggleTheme} size={btnSize}>
        <ThemeIcon size={compact ? 13 : 14} />
      </IconButton>
    </div>
  )
}
