export type CircularCategory =
  | 'monetary_policy'
  | 'forex'
  | 'banking_regulation'
  | 'payment_systems'
  | 'other'

export interface BBCircular {
  id: string
  date: string
  title: string
  category: CircularCategory
  pdfUrl: string
  summary: string | null
  impactOnYields: 'positive' | 'negative' | 'neutral' | null
}

export interface CircularData {
  lastUpdated: string
  circulars: BBCircular[]
}
