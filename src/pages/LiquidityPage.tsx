import { useMoneySupplyData } from '../hooks/useMoneySupplyData'
import { useValuationData } from '../hooks/useValuationData'
import { usePolicyData } from '../hooks/usePolicyData'
import { useRepoData } from '../hooks/useRepoData'
import { useBorrowingData } from '../hooks/useBorrowingData'
import { LiquidityDashboard } from '../components/liquidity/LiquidityDashboard'
import { MoneySupplyChart } from '../components/liquidity/MoneySupplyChart'
import { ExcessLiquidityFlow } from '../components/liquidity/ExcessLiquidityFlow'
import { CallMoneyPanel } from '../components/liquidity/CallMoneyPanel'
import { ValuationTable } from '../components/valuation/ValuationTable'
import { TdsImpactCalculator } from '../components/valuation/TdsImpactCalculator'
import { DirtyCleanPrice } from '../components/valuation/DirtyCleanPrice'
import { RepoOperationsChart } from '../components/repo/RepoOperationsChart'
import { MaturityCalendar } from '../components/repo/MaturityCalendar'
import { NetLiquidityInjection } from '../components/repo/NetLiquidityInjection'
import { IndustryRepoPanel } from '../components/repo/IndustryRepoPanel'
import { BorrowingTracker } from '../components/borrowing/BorrowingTracker'
import { NetIssuanceChart } from '../components/borrowing/NetIssuanceChart'
import { SupplyDemandBalance } from '../components/borrowing/SupplyDemandBalance'
import { WaysAndMeansAlert } from '../components/borrowing/WaysAndMeansAlert'

export default function LiquidityPage() {
  const { data: moneyData, isLoading: moneyLoading } = useMoneySupplyData()
  const { data: valuationData, isLoading: valLoading } = useValuationData()
  const { data: policyData } = usePolicyData()
  const { data: repoData, isLoading: repoLoading } = useRepoData()
  const { data: borrowingData, isLoading: borrowLoading } = useBorrowingData()

  if (moneyLoading || valLoading || repoLoading || borrowLoading) {
    return (
      <div className="py-6 space-y-4">
        <div className="h-8 bg-slate-800 rounded animate-pulse" />
        <div className="h-48 bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-48 bg-slate-800 rounded-xl animate-pulse" />
      </div>
    )
  }

  const latest = moneyData?.monthly[moneyData.monthly.length - 1]
  const corridor = policyData?.corridor
  const latestRepo = repoData?.daily[repoData.daily.length - 1]

  return (
    <div className="py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Liquidity & Valuation</h1>
        <p className="text-sm text-slate-400">Money supply, repo operations, borrowing & bond pricing</p>
      </div>

      {/* Liquidity snapshot */}
      {latest && <LiquidityDashboard latest={latest} />}

      {/* Call money vs corridor */}
      {latest && corridor && (
        <CallMoneyPanel
          callMoneyRate={latest.callMoneyRate}
          corridorCeiling={corridor.ceiling}
          corridorFloor={corridor.floor}
        />
      )}

      {/* M2 growth chart */}
      {moneyData && <MoneySupplyChart snapshots={moneyData.monthly} />}

      {/* Excess liquidity flow */}
      {moneyData && <ExcessLiquidityFlow snapshots={moneyData.monthly} />}

      {/* Repo Operations section */}
      {repoData && repoData.daily.length > 0 && (
        <>
          <div className="pt-2">
            <h2 className="text-lg font-semibold text-slate-200">Repo Operations</h2>
            <p className="text-xs text-slate-500">BB repo/reverse repo & inter-bank market</p>
          </div>

          <RepoOperationsChart snapshots={repoData.daily} />
          <NetLiquidityInjection snapshots={repoData.daily} />

          {latestRepo && (
            <MaturityCalendar maturities={latestRepo.repoMaturitySchedule} />
          )}

          {latestRepo && policyData && (
            <IndustryRepoPanel latest={latestRepo} repoRate={policyData.currentRates.repoRate} />
          )}
        </>
      )}

      {/* Government Borrowing section */}
      {borrowingData && (
        <>
          <div className="pt-2">
            <h2 className="text-lg font-semibold text-slate-200">Government Borrowing</h2>
            <p className="text-xs text-slate-500">Fiscal borrowing progress & supply indicators</p>
          </div>

          <WaysAndMeansAlert weekly={borrowingData.weekly} />

          <BorrowingTracker
            actual={borrowingData.actual}
            target={borrowingData.budgetTarget}
            fiscalYear={borrowingData.fiscalYear}
          />

          <NetIssuanceChart weekly={borrowingData.weekly} />
          <SupplyDemandBalance weekly={borrowingData.weekly} />
        </>
      )}

      {/* Valuation section */}
      {valuationData && (
        <>
          <div className="pt-2">
            <h2 className="text-lg font-semibold text-slate-200">Bond Valuation</h2>
            <p className="text-xs text-slate-500">TDS-adjusted yields & price breakdown</p>
          </div>

          <ValuationTable benchmarks={valuationData.valuationBenchmarks} />
          <TdsImpactCalculator tdsRates={valuationData.tdsRates} />
          <DirtyCleanPrice benchmarks={valuationData.valuationBenchmarks} />
        </>
      )}
    </div>
  )
}
