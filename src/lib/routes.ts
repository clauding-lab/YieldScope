export type RouteKey = 'DSH' | 'YLD' | 'LIQ' | 'MAC' | 'FIS' | 'BNK' | 'INT'

export type NavIconName = 'dash' | 'curve' | 'wave' | 'globe' | 'bars' | 'columns' | 'note'

export interface NavItem {
  key: RouteKey
  path: string
  label: string
  shortLabel?: string
  icon: NavIconName
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'DSH', path: '/',             label: 'Today',     icon: 'dash' },
  { key: 'YLD', path: '/yields',       label: 'Yields',    icon: 'curve' },
  { key: 'LIQ', path: '/liquidity',    label: 'Liquidity', icon: 'wave',  shortLabel: 'Liq.' },
  { key: 'MAC', path: '/macro',        label: 'Macro',     icon: 'globe' },
  { key: 'FIS', path: '/fiscal',       label: 'Fiscal',    icon: 'bars' },
  { key: 'BNK', path: '/banking',      label: 'Banking',   icon: 'columns', shortLabel: 'Banks' },
  { key: 'INT', path: '/intelligence', label: 'Briefings', icon: 'note',    shortLabel: 'Briefing' },
]

export function activeKeyForPath(pathname: string): RouteKey {
  const found = NAV_ITEMS.find(n => n.path === pathname)
  return found?.key ?? 'DSH'
}
