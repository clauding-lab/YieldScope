export type PolicyEventType = 'rate_change' | 'circular' | 'mps'

export interface PolicyEvent {
  id: string
  date: string
  type: PolicyEventType
  instrument: string
  previousValue: number | null
  newValue: number | null
  changeBps: number | null
  title: string
  summary: string
  circularRef: string | null
  bbCircularUrl: string | null
}

export interface RateCorridor {
  ceiling: number
  floor: number
  midpoint: number
}

export interface CurrentRates {
  repoRate: number
  reverseRepoRate: number
  bankRate: number
  slrRate: number
  crrRate: number
}

export interface PolicyData {
  lastUpdated: string
  currentRates: CurrentRates
  corridor: RateCorridor
  events: PolicyEvent[]
}
