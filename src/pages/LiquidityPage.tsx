import { useMoneySupplyData } from '../hooks/useMoneySupplyData'
import { useValuationData } from '../hooks/useValuationData'
import { usePolicyData } from '../hooks/usePolicyData'
import { LiquidityDashboard } from '../components/liquidity/LiquidityDashboard'
import { MoneySupplyChart } from '../components/liquidity/MoneySupplyChart'
import { ExcessLiquidityFlow } from '../components/liquidity/ExcessLiquidityFlow'
import { CallMoneyPanel } from '../components/liquidity/CallMoneyPanel'
import { ValuationTable } from '../components/valuation/ValuationTable'
import { TdsImpactCalculator } from '../components/valuation/TdsImpactCalculator'
import { DirtyCleanPrice } from '../components/valuation/DirtyCleanPrice'

export default function LiquidityPage() {
  const { data: moneyData, isLoading: moneyLoading } = useMoneySupplyData()
  const { data: valuationData, isLoading: valLoading } = useValuationData()
  const { data: policyData } = usePolicyData()

  if (moneyLoading || valLoading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <div className="h-8 bg-slate-800 rounded animate-pulse" />
        <div className="h-48 bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-48 bg-slate-800 rounded-xl animate-pulse" />
      </div>
    )
  }

  const latest = moneyData?.monthly[moneyData.monthly.length - 1]
  const corridor = policyData?.corridor

  return (
    <div className="py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Liquidity & Valuation</h1>
        <p className="text-sm text-slate-400">Money supply, system liquidity & bond pricing</p>
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
