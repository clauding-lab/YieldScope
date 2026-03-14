import type { Tenor } from './yield'

export type BondClassification = 'HFT' | 'HTM' | 'AFS'

export interface BondHolding {
  id: string
  tenor: Tenor
  faceValueCrore: number
  couponRate: number
  purchaseYield: number
  purchaseDate: string
  maturityDate: string
  classification: BondClassification
}

export interface PortfolioMetrics {
  totalFaceValue: number
  totalMarketValue: number
  unrealizedPL: number
  weightedModifiedDuration: number
  weightedConvexity: number
  portfolioPV01: number
}

export interface ScenarioResult {
  shockBps: number
  newMarketValue: number
  plChange: number
  plChangePct: number
  perBondResults: Array<{
    holdingId: string
    newPrice: number
    plChange: number
  }>
}

export interface Portfolio {
  id: string
  name: string
  holdings: BondHolding[]
  createdAt: string
}
