import { DataTimestamp } from '../components/ui/DataTimestamp'
import { InsightPanel } from '../components/ui/InsightPanel'

export default function FiscalSovereignPage() {
  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Fiscal & Sovereign</h1>
          <p className="text-xs text-slate-500">Revenue collection, ADP implementation, public debt, fiscal pressure</p>
        </div>
        <DataTimestamp lastUpdated={null} compact />
      </div>

      {/* Placeholder sections — to be built in Phase 2 */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-2">Revenue Collection Tracker</h2>
        <p className="text-xs text-slate-500">NBR tax revenue vs budget target with collection ratio</p>
        <div className="mt-4 h-40 rounded-lg bg-slate-900/50 flex items-center justify-center">
          <span className="text-xs text-slate-600">Coming in Phase 2</span>
        </div>
      </div>

      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-2">ADP Implementation</h2>
        <p className="text-xs text-slate-500">Development expenditure allocation vs actuals over 5 fiscal years</p>
        <div className="mt-4 h-40 rounded-lg bg-slate-900/50 flex items-center justify-center">
          <span className="text-xs text-slate-600">Coming in Phase 2</span>
        </div>
      </div>

      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-2">Public Debt Dynamics</h2>
        <p className="text-xs text-slate-500">Total debt stock, domestic vs external, sustainability ratios</p>
        <div className="mt-4 h-40 rounded-lg bg-slate-900/50 flex items-center justify-center">
          <span className="text-xs text-slate-600">Coming in Phase 2</span>
        </div>
      </div>

      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-2">Fiscal Pressure Composite</h2>
        <p className="text-xs text-slate-500">Composite score (0–100) combining revenue, ADP, debt, and borrowing pace</p>
        <div className="mt-4 h-40 rounded-lg bg-slate-900/50 flex items-center justify-center">
          <span className="text-xs text-slate-600">Coming in Phase 2</span>
        </div>
      </div>

      <InsightPanel
        tier={1}
        content="The government's borrowing program directly determines how much 'supply' hits the bond market. Revenue shortfalls translate directly into additional T-bill and T-bond issuance. The interest-payment-to-revenue ratio at 20% means one taka out of every five collected goes straight back to debt servicing. Every taka the government borrows domestically is a taka that could have been lent to the private sector."
      />
    </div>
  )
}
