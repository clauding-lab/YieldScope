import { DataTimestamp } from '../components/ui/DataTimestamp'
import { InsightPanel } from '../components/ui/InsightPanel'
import { RevenueTracker } from '../components/fiscal/RevenueTracker'
import { AdpImplementation } from '../components/fiscal/AdpImplementation'
import { PublicDebtPanel } from '../components/fiscal/PublicDebtPanel'
import { FiscalPressureGauge } from '../components/fiscal/FiscalPressureGauge'
import { useFiscalData } from '../hooks/useFiscalData'
import { useBorrowingData } from '../hooks/useBorrowingData'

export default function FiscalSovereignPage() {
  const { data: fiscalData, isLoading } = useFiscalData()
  const { data: borrowingData } = useBorrowingData()

  if (isLoading) {
    return (
      <div className="py-4 space-y-4">
        <div className="h-8 bg-slate-800 rounded animate-pulse" />
        <div className="h-48 bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-48 bg-slate-800 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!fiscalData) {
    return (
      <div className="py-4">
        <h1 className="text-xl font-bold text-slate-100">Fiscal & Sovereign</h1>
        <p className="text-xs text-slate-500 mt-1">No fiscal data available. Enter data via Settings &gt; Admin Data Entry.</p>
      </div>
    )
  }

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Fiscal & Sovereign</h1>
          <p className="text-xs text-slate-500">Revenue, ADP, public debt, fiscal pressure ({fiscalData.fiscalYear})</p>
        </div>
        <DataTimestamp lastUpdated={fiscalData.lastUpdated} compact />
      </div>

      {/* Fiscal Pressure Composite */}
      <FiscalPressureGauge fiscalData={fiscalData} borrowingData={borrowingData} />

      {/* Revenue Collection */}
      <RevenueTracker
        revenue={fiscalData.revenue}
        fiscalYear={fiscalData.fiscalYear}
        lastUpdated={fiscalData.lastUpdated}
      />

      <InsightPanel
        tier={1}
        content="Revenue shortfalls translate directly into additional T-bill and T-bond issuance. When NBR misses its monthly target, the government has two choices: cut spending (unlikely mid-year) or borrow more (almost certain). The collection ratio tells you how far behind the government is and therefore how much extra supply might hit the auction calendar."
      />

      {/* ADP Implementation */}
      <AdpImplementation adp={fiscalData.adp} lastUpdated={fiscalData.lastUpdated} />

      {/* Public Debt */}
      <PublicDebtPanel debt={fiscalData.debt} lastUpdated={fiscalData.lastUpdated} />

      <InsightPanel
        tier={1}
        content="The interest-payment-to-revenue ratio at 20% means one taka out of every five collected goes straight back to debt servicing. Every taka the government borrows domestically is a taka that could have been lent to the private sector. The debt-to-GDP ratio below 40% looks manageable by global standards, but the denominator is growing slower than the numerator."
      />
    </div>
  )
}
