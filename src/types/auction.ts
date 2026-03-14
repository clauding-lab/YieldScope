import type { Tenor } from './yield'

export type AuctionType = 'T-Bill' | 'BGTB' | 'FRB'

export interface AuctionResult {
  id: string
  date: string
  type: AuctionType
  tenor: Tenor
  notifiedAmountCrore: number
  totalBidsCrore: number
  acceptedAmountCrore: number
  bidCoverRatio: number
  cutoffYield: number
  weightedAvgYield: number
  previousCutoffYield: number | null
  yieldChangeBps: number | null
  devolvementCrore: number
  devolvementPct: number
  couponRate: number | null
  isReissue: boolean
  autopsy: string | null
}

export interface AuctionData {
  lastUpdated: string
  auctions: AuctionResult[]
}

export interface AuctionFilters {
  type: AuctionType | 'All'
  tenor: Tenor | 'All'
}
