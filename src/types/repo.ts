export interface RepoMaturity {
  maturityDate: string
  amountCrore: number
}

export interface RepoDailySnapshot {
  date: string
  bbRepoOutstandingCrore: number
  bbReverseRepoOutstandingCrore: number
  netLiquidityInjectionCrore: number
  repoMaturitySchedule: RepoMaturity[]
  interBankRepoVolumeCrore: number
  interBankRepoRate: number
}

export interface RepoData {
  lastUpdated: string
  daily: RepoDailySnapshot[]
}
