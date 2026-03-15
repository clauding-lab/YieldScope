import { DataTimestamp } from '../components/ui/DataTimestamp'
import { InsightPanel } from '../components/ui/InsightPanel'

export default function MacroExternalPage() {
  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Macro & External Sector</h1>
          <p className="text-xs text-slate-500">BOP, FX reserves, BB intervention, oil/commodities, inflation, credit/deposit</p>
        </div>
        <DataTimestamp lastUpdated={null} compact />
      </div>

      {/* Placeholder sections — to be built in Phase 2 */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-2">Geopolitical Risk Monitor</h2>
        <p className="text-xs text-slate-500">Commodity prices, import bill impact, risk transmission chain</p>
        <div className="mt-4 h-40 rounded-lg bg-slate-900/50 flex items-center justify-center">
          <span className="text-xs text-slate-600">Coming in Phase 2</span>
        </div>
      </div>

      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-2">Balance of Payments</h2>
        <p className="text-xs text-slate-500">Trade, remittance, FDI, overall BOP balance</p>
        <div className="mt-4 h-40 rounded-lg bg-slate-900/50 flex items-center justify-center">
          <span className="text-xs text-slate-600">Coming in Phase 2</span>
        </div>
      </div>

      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-2">FX Reserves & BB Intervention</h2>
        <p className="text-xs text-slate-500">Reserve levels, net FX operations, BDT liquidity impact</p>
        <div className="mt-4 h-40 rounded-lg bg-slate-900/50 flex items-center justify-center">
          <span className="text-xs text-slate-600">Coming in Phase 2</span>
        </div>
      </div>

      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-2">Inflation Tracker</h2>
        <p className="text-xs text-slate-500">CPI with food/non-food breakdown and policy rate overlay</p>
        <div className="mt-4 h-40 rounded-lg bg-slate-900/50 flex items-center justify-center">
          <span className="text-xs text-slate-600">Coming in Phase 2</span>
        </div>
      </div>

      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-2">Credit & Deposit Growth</h2>
        <p className="text-xs text-slate-500">Industry-wide credit vs deposit dynamics</p>
        <div className="mt-4 h-40 rounded-lg bg-slate-900/50 flex items-center justify-center">
          <span className="text-xs text-slate-600">Coming in Phase 2</span>
        </div>
      </div>

      <InsightPanel
        tier={1}
        content="This tab connects the external world to your bank's balance sheet. Bangladesh imports 63% of its crude oil, 64% of its LNG, and 69% of its LPG from the Middle East. Every $10 move in oil ripples through the financial system within 4–6 weeks: higher oil → bigger import bill → more USD demand → BB sells reserves → BDT liquidity shrinks → call money rate rises → T-bill yields edge up → your bank's cost of funds increases."
      />
    </div>
  )
}
