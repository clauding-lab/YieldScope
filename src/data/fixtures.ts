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

export interface AlertRow {
  sev: 'warn' | 'up' | 'down' | 'pos' | 'neg' | 'info'
  code: string
  title: string
  detail: string
  ts: string
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

export interface MacroFx {
  cpiHist: number[]
  coreHist: number[]
  foodHist: number[]
  fxResHist: number[]
  fxResCover: number
  remit12m: number
  remitHist: number[]
  exportHist: number[]
  importHist: number[]
  cad: number
  cadPctGDP: number
}

export interface FxData {
  meta: {
    asOf: string
    session: string
    repoRate: number
    standingDepoFacility: number
    standingLendFacility: number
  }
  ticker: { code: string; value: string; delta: string; dir: 'up' | 'down' }[]
  curve: CurveSeries
  alerts: AlertRow[]
  auctions: AuctionRow[]
  macro: MacroFx
}

export const FX: FxData = {
  meta: {
    asOf: '27 MAY 2026 · 10:24:08 BST',
    session: 'WED · DAY 3 · W22',
    repoRate: 9.00,
    standingDepoFacility: 6.50,
    standingLendFacility: 10.50,
  },

  ticker: [
    { code: '91D',     value: '11.42',  delta: '-0.08', dir: 'down' },
    { code: '182D',    value: '11.60',  delta: '-0.05', dir: 'down' },
    { code: '364D',    value: '11.71',  delta: '+0.02', dir: 'up' },
    { code: '2Y',      value: '11.85',  delta: '+0.04', dir: 'up' },
    { code: '5Y',      value: '12.04',  delta: '+0.01', dir: 'up' },
    { code: '10Y',     value: '12.18',  delta: '-0.02', dir: 'down' },
    { code: 'CALL',    value: '9.34',   delta: '+0.12', dir: 'up' },
    { code: 'USD/BDT', value: '119.62', delta: '+0.04', dir: 'up' },
    { code: 'CPI',     value: '9.20',   delta: '-0.18', dir: 'down' },
    { code: 'FXR',     value: '20.84',  delta: '-0.42', dir: 'down' },
  ],

  curve: {
    tenors:     ['7D', '14D', '28D', '91D', '182D', '364D', '2Y', '5Y', '10Y', '15Y', '20Y'],
    latest:     [8.95, 9.10,  9.42,  11.42, 11.60,  11.71,  11.85, 12.04, 12.18, 12.31, 12.40],
    weekAgo:    [8.92, 9.04,  9.38,  11.50, 11.64,  11.69,  11.81, 12.03, 12.20, 12.32, 12.41],
    monthAgo:   [8.85, 8.98,  9.24,  11.65, 11.78,  11.82,  11.92, 12.10, 12.24, 12.34, 12.42],
    quarterAgo: [8.40, 8.62,  9.10,  11.78, 11.92,  12.01,  12.08, 12.18, 12.28, 12.38, 12.46],
    yearAgo:    [7.20, 7.55,  8.10,  10.80, 11.10,  11.30,  11.42, 11.62, 11.78, 11.92, 12.04],
  },

  alerts: [
    { sev: 'warn', code: 'A-LIQ-04', title: 'Call rate breached SLF ceiling for 2nd consecutive session', detail: 'Overnight averaged 9.34% vs. 10.50 SLF — pressure building in 1-week segment.',         ts: '09:42' },
    { sev: 'up',   code: 'A-AUC-12', title: 'Devolvement risk: 364D auction tomorrow undersubscribed in last 3 of 4 prints', detail: 'PD bidding capacity stretched. Watch cut-off vs. secondary 11.71.', ts: '08:15' },
    { sev: 'down', code: 'A-FX-02',  title: 'FX reserves drew below USD 21Bn floor (3.0 mo cover threshold)',                detail: 'Cover ratio now 2.94mo. IMF EFF review due W24.',                       ts: 'EOD-1' },
  ],

  auctions: [
    { date: '26 MAY', tenor: '91D',  size: '20 KCr', bid: '32 KCr',  cutoff: '11.42', wam: '11.39', cover: 1.60, dir: 'down', delta: -0.08 },
    { date: '26 MAY', tenor: '182D', size: '15 KCr', bid: '22 KCr',  cutoff: '11.60', wam: '11.58', cover: 1.47, dir: 'down', delta: -0.05 },
    { date: '26 MAY', tenor: '364D', size: '12 KCr', bid: '14 KCr',  cutoff: '11.71', wam: '11.69', cover: 1.17, dir: 'up',   delta:  0.02, flag: 'TIGHT' },
    { date: '21 MAY', tenor: '5Y',   size: '8 KCr',  bid: '11 KCr',  cutoff: '12.04', wam: '12.01', cover: 1.38, dir: 'up',   delta:  0.01 },
    { date: '21 MAY', tenor: '10Y',  size: '6 KCr',  bid: '6.8 KCr', cutoff: '12.18', wam: '12.14', cover: 1.13, dir: 'down', delta: -0.02, flag: 'TIGHT' },
    { date: '14 MAY', tenor: '2Y',   size: '5 KCr',  bid: '7.1 KCr', cutoff: '11.85', wam: '11.82', cover: 1.42, dir: 'up',   delta:  0.04 },
  ],

  macro: {
    cpiHist:    [9.94, 9.86, 9.74, 9.62, 9.58, 9.42, 9.38, 9.20],
    coreHist:   [8.40, 8.32, 8.18, 8.04, 7.94, 7.82, 7.74, 7.62],
    foodHist:   [11.2, 11.0, 10.8, 10.5, 10.2, 9.9,  9.7,  9.4],
    fxResHist:  [22.4, 22.1, 21.8, 21.5, 21.3, 21.1, 21.0, 20.84],
    fxResCover: 2.94,
    remit12m:   28.4,
    remitHist:  [2.1, 2.2, 2.4, 2.3, 2.5, 2.6, 2.4, 2.5],
    exportHist: [4.2, 4.4, 4.3, 4.5, 4.6, 4.4, 4.5, 4.7],
    importHist: [5.8, 5.7, 5.9, 5.6, 5.8, 5.7, 5.8, 5.6],
    cad:        -2.8,
    cadPctGDP:  -1.9,
  },
}
