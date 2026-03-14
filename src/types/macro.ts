export interface MacroSnapshot {
  date: string
  cpiHeadlineYoY: number
  cpiFoodYoY: number
  cpiNonFoodYoY: number
  usdBdtRate: number
  usdBdtChange30d: number
  bbFxReservesBn: number
  excessLiquidityCrore: number
  advanceDepositRatio: number
  callMoneyRate: number
}

export interface MacroData {
  lastUpdated: string
  snapshots: MacroSnapshot[]
}
