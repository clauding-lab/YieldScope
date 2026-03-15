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
import { InsightPanel } from '../components/ui/InsightPanel'
import { DataTimestamp } from '../components/ui/DataTimestamp'

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
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Liquidity & Money Market</h1>
          <p className="text-xs text-slate-500">System liquidity, repo ops, call money, government borrowing, bond valuation</p>
        </div>
        <DataTimestamp lastUpdated={moneyData?.lastUpdated ?? null} compact />
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

      <InsightPanel
        tier={1}
        content="The policy rate corridor is BB's steering mechanism. The repo rate is the ceiling — no bank should pay more than this for overnight money. The SDF rate is the floor — no bank should accept less because they can always park excess at BB's deposit window. Where the actual call money rate trades within this corridor tells you the true state of liquidity."
      />

      {/* M2 growth chart */}
      {moneyData && <MoneySupplyChart snapshots={moneyData.monthly} />}

      {/* Excess liquidity flow */}
      {moneyData && <ExcessLiquidityFlow snapshots={moneyData.monthly} />}

      {/* Repo Operations section */}
      {repoData && repoData.daily.length > 0 && (
        <>
          <div className="pt-2 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-200">Repo Operations</h2>
              <p className="text-xs text-slate-500">BB repo/reverse repo & inter-bank market</p>
            </div>
            <DataTimestamp lastUpdated={repoData.lastUpdated} compact />
          </div>

          <RepoOperationsChart snapshots={repoData.daily} />
          <NetLiquidityInjection snapshots={repoData.daily} />

          {latestRepo && (
            <MaturityCalendar maturities={latestRepo.repoMaturitySchedule} />
          )}

          {latestRepo && policyData && (
            <IndustryRepoPanel latest={latestRepo} repoRate={policyData.currentRates.repoRate} />
          )}

          <InsightPanel
            tier={1}
            content="BB injecting net liquidity despite aggregate excess means liquidity distribution is deeply uneven. The instrument breakdown tells you who's stressed: Islamic banks accessing IBLF, weaker institutions on Assured Repo and SLS. Two banks in the same market are operating in different monetary environments."
          />
        </>
      )}

      {/* Government Borrowing section */}
      {borrowingData && (
        <>
          <div className="pt-2 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-200">Government Borrowing</h2>
              <p className="text-xs text-slate-500">Fiscal borrowing progress & supply indicators</p>
            </div>
            <DataTimestamp lastUpdated={borrowingData.lastUpdated} compact />
          </div>

          <WaysAndMeansAlert weekly={borrowingData.weekly} />

          <BorrowingTracker
            actual={borrowingData.actual}
            target={borrowingData.budgetTarget}
            fiscalYear={borrowingData.fiscalYear}
          />

          <NetIssuanceChart weekly={borrowingData.weekly} />
          <SupplyDemandBalance weekly={borrowingData.weekly} />

          <InsightPanel
            tier={1}
            content="The government's borrowing program directly determines how much 'supply' hits the bond market. If recent issuance runs below the implied monthly rate, either the government accelerates (more supply = upward yield pressure) or accepts a shortfall (less supply = supports the rally). Every taka the government borrows domestically is a taka that could have been lent to the private sector."
          />
        </>
      )}

      {/* Valuation section */}
      {valuationData && (
        <>
          <div className="pt-2 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-200">Bond Valuation</h2>
              <p className="text-xs text-slate-500">TDS-adjusted yields & price breakdown</p>
            </div>
            <DataTimestamp lastUpdated={valuationData.lastUpdated} compact />
          </div>

          <ValuationTable benchmarks={valuationData.valuationBenchmarks} />
          <TdsImpactCalculator tdsRates={valuationData.tdsRates} />
          <DirtyCleanPrice benchmarks={valuationData.valuationBenchmarks} />

          <InsightPanel
            tier={1}
            content="The spread between BB's revaluation rate and the secondary market rate tells you how 'fair' the official mark is. But the Post-TDS column is what matters for investment decisions. After 10% TDS, the after-tax pickup for extending from 91 days to 10 years is often thin compensation for taking on a decade of duration risk."
          />
        </>
      )}
    </div>
  )
}
