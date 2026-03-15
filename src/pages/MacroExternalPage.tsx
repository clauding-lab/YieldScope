import { DataTimestamp } from '../components/ui/DataTimestamp'
import { InsightPanel } from '../components/ui/InsightPanel'
import { InflationTracker } from '../components/macro/InflationTracker'
import { FxReservesPanel } from '../components/macro/FxReservesPanel'
import { RealYieldIndicator } from '../components/macro/RealYieldIndicator'
import { CommodityRiskPanel } from '../components/macro/CommodityRiskPanel'
import { CreditDepositPanel } from '../components/macro/CreditDepositPanel'
import { useMacroData } from '../hooks/useMacroData'
import { useYieldData } from '../hooks/useYieldData'
import { useCommodityData } from '../hooks/useCommodityData'
import { useCreditDepositData } from '../hooks/useCreditDepositData'

export default function MacroExternalPage() {
  const { data: macroData, isLoading: macroLoading } = useMacroData()
  const { data: yieldData } = useYieldData()
  const { data: commodityData, isLoading: commodityLoading } = useCommodityData()
  const { data: creditData, isLoading: creditLoading } = useCreditDepositData()

  if (macroLoading) {
    return (
      <div className="py-4 space-y-4">
        <div className="h-8 bg-slate-800 rounded animate-pulse" />
        <div className="h-48 bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-48 bg-slate-800 rounded-xl animate-pulse" />
      </div>
    )
  }

  const snapshots = macroData?.snapshots ?? []
  const sortedSnapshots = [...snapshots].sort((a, b) => a.date.localeCompare(b.date))
  const latestSnapshot = sortedSnapshots[sortedSnapshots.length - 1]

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Macro & External Sector</h1>
          <p className="text-xs text-slate-500">Inflation, FX, commodities, credit/deposit, real yields</p>
        </div>
        <DataTimestamp lastUpdated={macroData?.lastUpdated ?? null} compact />
      </div>

      {/* Inflation Tracker */}
      {snapshots.length > 0 && (
        <InflationTracker snapshots={snapshots} lastUpdated={macroData!.lastUpdated} />
      )}

      {/* FX Reserves & Exchange Rate */}
      {snapshots.length > 0 && (
        <FxReservesPanel snapshots={snapshots} lastUpdated={macroData!.lastUpdated} />
      )}

      {/* Real Yield Monitor */}
      {latestSnapshot && (
        <RealYieldIndicator
          macroSnapshot={latestSnapshot}
          yieldData={yieldData}
          lastUpdated={macroData!.lastUpdated}
        />
      )}

      <InsightPanel
        tier={1}
        content="Real yields are what matter after inflation eats your returns. When headline CPI is at 8.5% and the 91D T-bill yields 9.2%, your real return is only 0.7%. For an ALCO, this means the cost of holding excess SLR in low-yielding bonds is higher than it appears — your opportunity cost is inflation-adjusted, not nominal."
      />

      {/* Commodity & Energy Risk */}
      {!commodityLoading && commodityData && (
        <CommodityRiskPanel data={commodityData} />
      )}

      <InsightPanel
        tier={1}
        content="Bangladesh imports 63% of its crude oil from the Middle East. Every $10 move in Brent ripples through the financial system within 4-6 weeks: higher oil means a bigger import bill, more USD demand, BB sells reserves, BDT liquidity shrinks, call money rate rises, and T-bill yields edge up."
      />

      {/* Credit & Deposit Growth */}
      {!creditLoading && creditData && creditData.monthly.length > 0 && (
        <CreditDepositPanel monthly={creditData.monthly} lastUpdated={creditData.lastUpdated} />
      )}

      <InsightPanel
        tier={1}
        content="When credit growth outpaces deposit growth, the banking system's structural liquidity declines. Banks either raise deposit rates (increasing cost of funds) or slow lending (dampening economic activity). The credit-deposit gap is a leading indicator of future call money rate pressure and T-bill demand."
      />
    </div>
  )
}
