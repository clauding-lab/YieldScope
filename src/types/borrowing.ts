export interface BorrowingBudgetTarget {
  netBorrowingFromBankingCrore: number
  netBorrowingFromNonBankingCrore: number
  totalDomesticBorrowingCrore: number
}

export interface BorrowingActual {
  netBorrowingFromBankingCrore: number
  netBorrowingFromNonBankingCrore: number
  totalDomesticBorrowingCrore: number
  pctOfBudgetTarget: number
  remainingMonths: number
  impliedMonthlyRunRate: number
}

export interface BorrowingWeekly {
  weekEnding: string
  tbillNetIssuanceCrore: number
  tbondNetIssuanceCrore: number
  waysAndMeansAdvanceCrore: number
  outstandingTbillsCrore: number
  outstandingTbondsCrore: number
}

export interface BorrowingData {
  lastUpdated: string
  fiscalYear: string
  budgetTarget: BorrowingBudgetTarget
  actual: BorrowingActual
  weekly: BorrowingWeekly[]
}
