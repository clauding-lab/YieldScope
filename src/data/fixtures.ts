// Shared fixture data — illustrative Bangladesh treasury context.
// Post-EconDelta-swap this backs only the no-credentials fallback + Demo panels.

export interface CurveSeries {
  tenors: string[]
  latest: number[]
  weekAgo: number[]
  monthAgo: number[]
  quarterAgo: number[]
  yearAgo: number[]
}

export interface AuctionRow {
  date: string
  tenor: string
  size: string
  bid: string
  cutoff: string
  wam: string
  cover: number
  dir: 'up' | 'down' | 'flat'
  delta: number
  flag?: string
}

export interface FxData {
  curve: CurveSeries
  auctions: AuctionRow[]
}

export const FX: FxData = {
  curve: {
    tenors:     ['7D', '14D', '28D', '91D', '182D', '364D', '2Y', '5Y', '10Y', '15Y', '20Y'],
    latest:     [8.95, 9.10,  9.42,  11.42, 11.60,  11.71,  11.85, 12.04, 12.18, 12.31, 12.40],
    weekAgo:    [8.92, 9.04,  9.38,  11.50, 11.64,  11.69,  11.81, 12.03, 12.20, 12.32, 12.41],
    monthAgo:   [8.85, 8.98,  9.24,  11.65, 11.78,  11.82,  11.92, 12.10, 12.24, 12.34, 12.42],
    quarterAgo: [8.40, 8.62,  9.10,  11.78, 11.92,  12.01,  12.08, 12.18, 12.28, 12.38, 12.46],
    yearAgo:    [7.20, 7.55,  8.10,  10.80, 11.10,  11.30,  11.42, 11.62, 11.78, 11.92, 12.04],
  },

  auctions: [
    { date: '26 MAY', tenor: '91D',  size: '20 KCr', bid: '32 KCr',  cutoff: '11.42', wam: '11.39', cover: 1.60, dir: 'down', delta: -0.08 },
    { date: '26 MAY', tenor: '182D', size: '15 KCr', bid: '22 KCr',  cutoff: '11.60', wam: '11.58', cover: 1.47, dir: 'down', delta: -0.05 },
    { date: '26 MAY', tenor: '364D', size: '12 KCr', bid: '14 KCr',  cutoff: '11.71', wam: '11.69', cover: 1.17, dir: 'up',   delta:  0.02, flag: 'TIGHT' },
    { date: '21 MAY', tenor: '5Y',   size: '8 KCr',  bid: '11 KCr',  cutoff: '12.04', wam: '12.01', cover: 1.38, dir: 'up',   delta:  0.01 },
    { date: '21 MAY', tenor: '10Y',  size: '6 KCr',  bid: '6.8 KCr', cutoff: '12.18', wam: '12.14', cover: 1.13, dir: 'down', delta: -0.02, flag: 'TIGHT' },
    { date: '14 MAY', tenor: '2Y',   size: '5 KCr',  bid: '7.1 KCr', cutoff: '11.85', wam: '11.82', cover: 1.42, dir: 'up',   delta:  0.04 },
  ],
}
