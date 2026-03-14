import type { Tenor } from './yield'

export interface TdsRates {
  tbillWithholding: number
  tbondCouponTds: number
  tbondCapitalGainTds: number
  effectiveDate: string
  sourceCircular: string
}

export interface ValuationBenchmark {
  date: string
  tenor: Tenor
  bbRevalYield: number
  secondaryMarketYield: number
  spread: number
  dirtyPrice: number
  cleanPrice: number
  accruedInterest: number
  nextCouponDate: string
  postTdsYield: number
}

export interface ValuationData {
  lastUpdated: string
  tdsRates: TdsRates
  valuationBenchmarks: ValuationBenchmark[]
}
