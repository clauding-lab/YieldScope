export type AlertSeverity = 'critical' | 'warning' | 'positive'

export type AlertType =
  | 'curve_inversion'
  | 'low_bid_cover'
  | 'auction_devolvement'
  | 'yield_breach'
  | 'liquidity_threshold'
  | 'repo_maturity_wall'
  | 'inflation_reversal'
  | 'reserve_alert'
  | 'spread_compression'

export interface SmartAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  message: string
  detail: string
  date: string
  source: 'yield' | 'auction' | 'liquidity' | 'macro' | 'fiscal'
}

export interface MarketSnapshot {
  label: string
  value: number
  unit: string
  change: number
  changeDirection: 'up' | 'down' | 'flat'
  sparkline: number[]
  source: string
  lastUpdated: string
}

export interface DashboardData {
  lastUpdated: string
  alerts: SmartAlert[]
  snapshots: MarketSnapshot[]
}
