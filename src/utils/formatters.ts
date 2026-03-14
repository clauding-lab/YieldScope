export function formatYield(value: number): string {
  return `${value.toFixed(2)}%`
}

export function formatBps(bps: number): string {
  const sign = bps > 0 ? '+' : ''
  return `${sign}${bps.toFixed(0)}bps`
}

export function formatCrore(value: number): string {
  if (value >= 100000) {
    return `${(value / 100000).toFixed(1)}L Cr`
  }
  return `${value.toLocaleString('en-IN')} Cr`
}

export function formatBidCover(ratio: number): string {
  return `${ratio.toFixed(2)}x`
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  })
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}
