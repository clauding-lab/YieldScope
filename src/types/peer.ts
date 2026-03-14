export interface PeerYieldCurve {
  country: 'BD' | 'IN' | 'PK'
  countryName: string
  currency: string
  date: string
  yields: Record<string, number>
  policyRate: number
  cpiYoY: number
  fxRateToUsd: number
}

export interface PeerComparison {
  tenor: string
  bdYield: number
  inYield: number | null
  pkYield: number | null
  bdRealYield: number
  inRealYield: number | null
  pkRealYield: number | null
}

export interface PeerData {
  lastUpdated: string
  curves: PeerYieldCurve[]
}
