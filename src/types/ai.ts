export type AnomalySeverity = 'warning' | 'critical'

export type AnomalyType =
  | 'low_bid_cover'
  | 'high_devolvement'
  | 'large_yield_move'
  | 'curve_inversion'
  | 'spread_compression'
  | 'bid_dispersion'
  | 'policy_divergence'

export interface Anomaly {
  type: AnomalyType
  severity: AnomalySeverity
  message: string
  triggerValue: number
  threshold: number
  date: string
}

export interface WeeklyCommentary {
  id: string
  weekEnding: string
  title: string
  body: string
  keyPoints: string[]
  curveShapeNote: string
  outlook: string
  attribution: string
}

export interface WeeklyCommentaryData {
  lastUpdated: string
  commentaries: WeeklyCommentary[]
}
