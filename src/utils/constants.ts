import type { Tenor } from '../types'

export const TENOR_LABELS: Record<Tenor, string> = {
  '91D': '91-Day',
  '182D': '182-Day',
  '364D': '364-Day',
  '2Y': '2-Year',
  '5Y': '5-Year',
  '10Y': '10-Year',
  '15Y': '15-Year',
  '20Y': '20-Year',
}

export const TENOR_SHORT: Record<Tenor, string> = {
  '91D': '91D',
  '182D': '182D',
  '364D': '364D',
  '2Y': '2Y',
  '5Y': '5Y',
  '10Y': '10Y',
  '15Y': '15Y',
  '20Y': '20Y',
}

export const TENOR_COLORS: Record<Tenor, string> = {
  '91D': '#38bdf8',  // sky-400
  '182D': '#818cf8', // indigo-400
  '364D': '#a78bfa', // violet-400
  '2Y': '#f472b6',   // pink-400
  '5Y': '#fb923c',   // orange-400
  '10Y': '#facc15',  // yellow-400
  '15Y': '#4ade80',  // green-400
  '20Y': '#2dd4bf',  // teal-400
}

export const CURVE_OVERLAY_STYLES = {
  latest: { color: '#0ea5e9', strokeWidth: 2.5, dash: undefined, label: 'Today' },
  oneWeekAgo: { color: '#94a3b8', strokeWidth: 1.5, dash: '5 5', label: '1W Ago' },
  oneMonthAgo: { color: '#64748b', strokeWidth: 1.5, dash: '3 3', label: '1M Ago' },
  threeMonthsAgo: { color: '#475569', strokeWidth: 1, dash: '8 4', label: '3M Ago' },
  oneYearAgo: { color: '#334155', strokeWidth: 1, dash: '2 2', label: '1Y Ago' },
} as const

export const ANOMALY_THRESHOLDS = {
  lowBidCover: 1.5,
  veryLowBidCover: 1.0,
  highDevolvement: 20,
  veryHighDevolvement: 40,
  largeYieldMove: 25,
  veryLargeYieldMove: 50,
  spreadCompression: 20,
  bidDispersion: 15,
  policyDivergence: 100,
} as const

export const DATA_STALENESS_THRESHOLDS = {
  fresh: 12 * 60 * 60 * 1000,    // 12 hours
  stale: 24 * 60 * 60 * 1000,    // 24 hours
  veryStale: 72 * 60 * 60 * 1000, // 3 days
} as const
