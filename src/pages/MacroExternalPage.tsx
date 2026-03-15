import { DataTimestamp } from '../components/ui/DataTimestamp'
import { InsightPanel } from '../components/ui/InsightPanel'
import { InflationTracker } from '../components/macro/InflationTracker'
import { FxReservesPanel } from '../components/macro/FxReservesPanel'
import { RealYieldIndicator } from '../components/macro/RealYieldIndicator'
import { useMacroData } from '../hooks/useMacroData'
import { useYieldData } from '../hooks/useYieldData'

export default function MacroExternalPage() {
  const { data: macroData, isLoading } = useMacroData()
  const { data: yieldData } = useYieldData()

  if (isLoading) {
    return (
      <div className="py-4 space-y-4">
        <div className="h-8 bg-slate-800 rounded animate-pulse" />
        <div className="h-48 bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-48 bg-slate-800 rounded-xl animate-pulse" />
      </div>
    )
  }

  const snapshots = macroData?.snapshots ?? []
  const latestSnapshot = snapshots[snapshots.length - 1]

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Macro & External Sector</h1>
          <p className="text-xs text-slate-500">Inflation, FX reserves, real yields, external risk</p>
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
        content="This tab connects the external world to your bank's balance sheet. Bangladesh imports 63% of its crude oil, 64% of its LNG, and 69% of its LPG from the Middle East. Every $10 move in oil ripples through the financial system within 4-6 weeks: higher oil means a bigger import bill, more USD demand, BB sells reserves, BDT liquidity shrinks, call money rate rises, T-bill yields edge up, and your bank's cost of funds increases."
      />

      {/* Placeholder sections for Phase 3 */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-2">Geopolitical Risk Monitor</h2>
        <p className="text-xs text-slate-500">Oil, LNG, commodity prices and import bill impact</p>
        <div className="mt-4 h-32 rounded-lg bg-slate-900/50 flex items-center justify-center">
          <span className="text-xs text-slate-600">Coming in Phase 3</span>
        </div>
      </div>

      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-2">Credit & Deposit Growth</h2>
        <p className="text-xs text-slate-500">Industry-wide credit vs deposit dynamics</p>
        <div className="mt-4 h-32 rounded-lg bg-slate-900/50 flex items-center justify-center">
          <span className="text-xs text-slate-600">Coming in Phase 3</span>
        </div>
      </div>
    </div>
  )
}
