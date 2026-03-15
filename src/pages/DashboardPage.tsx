import { SmartAlertsBanner } from '../components/dashboard/SmartAlertsBanner'
import { MarketSnapshotCards } from '../components/dashboard/MarketSnapshotCards'
import { WeeklyIntelligenceNote } from '../components/dashboard/WeeklyIntelligenceNote'
import { InsightPanel } from '../components/ui/InsightPanel'
import { DataTimestamp } from '../components/ui/DataTimestamp'
import { useYieldData } from '../hooks/useYieldData'

export default function DashboardPage() {
  const { data: yieldData } = useYieldData()

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-xs text-slate-500">Command center for Bangladesh fixed income markets</p>
        </div>
        <DataTimestamp lastUpdated={yieldData?.lastUpdated ?? null} compact />
      </div>

      <SmartAlertsBanner />

      <MarketSnapshotCards />

      <InsightPanel
        tier={1}
        content="Think of these six numbers as the vital signs of a patient. The 91D yield tells you how cheap short-term money is. The 10Y yield tells you what the market thinks about long-term risk. The call money rate tells you whether banks are comfortable or scrambling. Excess liquidity tells you how much ammunition the system has. CPI tells you whether that ammunition will be eroded by inflation. And FX reserves tell you whether the external plumbing is holding. When all six are moving in the same direction, the trend is clear. When they diverge — like yields falling while inflation rises — that's when you pay attention."
      />

      <WeeklyIntelligenceNote />
    </div>
  )
}
