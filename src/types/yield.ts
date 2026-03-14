export const TENORS = ['91D', '182D', '364D', '2Y', '5Y', '10Y', '15Y', '20Y'] as const
export type Tenor = (typeof TENORS)[number]

export interface YieldDataPoint {
  date: string
  yields: Record<Tenor, number>
}

export interface YieldCurveSnapshot {
  date: string
  label: string
  yields: Record<Tenor, number>
}

export interface YieldData {
  lastUpdated: string
  tenors: Tenor[]
  daily: YieldDataPoint[]
  curves: {
    latest: string
    oneWeekAgo: string
    oneMonthAgo: string
    threeMonthsAgo: string
    oneYearAgo: string
  }
}
