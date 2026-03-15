export interface CreditDepositMonthly {
  month: string
  creditGrowthYoY: number
  depositGrowthYoY: number
  creditDepositGap: number
  privateSectorCreditGrowth: number
  publicSectorCreditGrowth: number
  totalCreditOutstandingLakhCr: number
  totalDepositLakhCr: number
}

export interface CreditDepositData {
  lastUpdated: string
  monthly: CreditDepositMonthly[]
}
