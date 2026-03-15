export interface RevenueMonthly {
  month: string
  collectedCrore: number
  targetCrore: number
}

export interface RevenueData {
  budgetTargetCrore: number
  ytdCollectedCrore: number
  collectionRatioPct: number
  asOfMonth: string
  monthly: RevenueMonthly[]
}

export interface AdpHistorical {
  fiscalYear: string
  ratePct: number
}

export interface AdpData {
  allocationCrore: number
  implementedCrore: number
  implementationRatePct: number
  historicalRates: AdpHistorical[]
}

export interface DebtQuarterly {
  quarter: string
  totalLakhCr: number
  domesticLakhCr: number
  externalLakhCr: number
  debtGdpPct: number
}

export interface DebtData {
  totalDebtLakhCrore: number
  domesticDebtLakhCrore: number
  externalDebtLakhCrore: number
  debtToGdpPct: number
  interestToRevenuePct: number
  asOfDate: string
  quarterly: DebtQuarterly[]
}

export interface FiscalData {
  lastUpdated: string
  fiscalYear: string
  revenue: RevenueData
  adp: AdpData
  debt: DebtData
}
