export function yieldChangeColor(bps: number): string {
  if (bps > 0) return 'text-yield-up'
  if (bps < 0) return 'text-yield-down'
  return 'text-yield-neutral'
}

export function yieldChangeBg(bps: number): string {
  if (bps > 0) return 'bg-red-500/10 text-red-400'
  if (bps < 0) return 'bg-green-500/10 text-green-400'
  return 'bg-slate-500/10 text-slate-400'
}

export function bidCoverColor(ratio: number): string {
  if (ratio >= 2.0) return 'text-green-400'
  if (ratio >= 1.5) return 'text-yellow-400'
  return 'text-red-400'
}

export function devolvementColor(pct: number): string {
  if (pct === 0) return ''
  if (pct < 20) return 'text-yellow-400'
  return 'text-red-400'
}

export function freshnessColor(lastUpdated: string): 'green' | 'yellow' | 'red' {
  const diffMs = Date.now() - new Date(lastUpdated).getTime()
  const hours = diffMs / (1000 * 60 * 60)
  if (hours < 12) return 'green'
  if (hours < 24) return 'yellow'
  return 'red'
}

export const FRESHNESS_DOT: Record<string, string> = {
  green: 'bg-green-400',
  yellow: 'bg-yellow-400',
  red: 'bg-red-400',
}
