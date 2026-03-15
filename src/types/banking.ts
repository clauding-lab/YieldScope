export interface BankingMonthly {
  date: string // YYYY-MM
  // Credit & Deposit
  privateCreditGrowthBanks: number // YoY %
  privateCreditGrowthNBFIs: number // YoY %
  privateDepositGrowthBanks: number // YoY %
  privateDepositGrowthNBFIs: number // YoY %
  // Liquidity
  excessLiquidityBanksCrore: number
  excessLiquidityNBFIsCrore: number
  // Govt borrowing
  govtBorrowingNetCrore: number
  // Loan disbursement
  smeLoanDisbursementCrore: number
  consumerLoanDisbursementCrore: number
  industrialLoanDisbursementCrore: number
  // Trade
  exportBnUsd: number
  importBnUsd: number
  // NPL
  nplPctBanks: number
  nplPctNBFIs: number
  // Rescheduled loans
  rescheduledLoanBanksCrore: number
  rescheduledLoanNBFIsCrore: number
  // BB FX operations
  bbUsdBuyMnUsd: number
  bbUsdSellMnUsd: number
}

export interface BankingData {
  lastUpdated: string
  monthly: BankingMonthly[]
}
