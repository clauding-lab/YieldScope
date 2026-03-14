export interface MoneySupplySnapshot {
  date: string
  m1Bn: number
  m2Bn: number
  m3Bn: number
  m2GrowthYoY: number
  reserveMoneyBn: number
  netDomesticAssetsBn: number
  netForeignAssetsBn: number
  excessLiquidityCrore: number
  excessLiquidityChange30d: number
  callMoneyRate: number
  callMoneyVolumeCrore: number
}

export interface MoneySupplyData {
  lastUpdated: string
  monthly: MoneySupplySnapshot[]
}
