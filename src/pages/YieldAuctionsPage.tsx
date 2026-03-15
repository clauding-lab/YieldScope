import { useState } from 'react'
import { YieldCurveChart } from '../components/charts/YieldCurveChart'
import { YieldTimeSeriesChart } from '../components/charts/YieldTimeSeriesChart'
import { SpreadIndicator } from '../components/charts/SpreadIndicator'
import { AuctionFeed } from '../components/auction/AuctionFeed'
import { YieldChangeHeatmap } from '../components/yields/YieldChangeHeatmap'
import { InsightPanel } from '../components/ui/InsightPanel'
import { DataTimestamp } from '../components/ui/DataTimestamp'
import { useYieldData } from '../hooks/useYieldData'
import { useAuctionData } from '../hooks/useAuctionData'
import { usePolicyData } from '../hooks/usePolicyData'

type SubTab = 'curve' | 'auctions' | 'heatmap'

export default function YieldAuctionsPage() {
  const [subTab, setSubTab] = useState<SubTab>('curve')
  const { data: yieldData, isLoading: yieldLoading } = useYieldData()
  const { data: auctionData, isLoading: auctionLoading } = useAuctionData()
  const { data: policyData } = usePolicyData()

  if (yieldLoading || auctionLoading) {
    return (
      <div className="py-4 space-y-4">
        <div className="h-8 bg-slate-800 rounded animate-pulse" />
        <div className="h-48 bg-slate-800 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Yield Curve & Auctions</h1>
          <p className="text-xs text-slate-500">Primary & secondary market yields, auction tracker, curve dynamics</p>
        </div>
        <DataTimestamp lastUpdated={yieldData?.lastUpdated ?? auctionData?.lastUpdated ?? null} compact />
      </div>

      {/* Sub-tab navigation */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
        {([
          { key: 'curve', label: 'Yield Curve' },
          { key: 'auctions', label: 'Auctions' },
          { key: 'heatmap', label: 'Heatmap' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              subTab === key
                ? 'bg-slate-700 text-slate-100'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {subTab === 'curve' && yieldData && (
        <>
          <YieldCurveChart yieldData={yieldData} repoRate={policyData?.currentRates.repoRate} />
          <SpreadIndicator yieldData={yieldData} />
          <YieldTimeSeriesChart yieldData={yieldData} policyEvents={policyData?.events} />
          <InsightPanel
            tier={1}
            content="The yield curve is the market's collective opinion about the future. A normal upward-sloping curve means the market expects things to stay roughly on track — you get paid more for lending longer because more things can go wrong. A flat curve means the market is confused or transitioning. An inverted curve means the market thinks short-term conditions are worse than long-term prospects. The belly of the curve (2Y–5Y) is where the market has the most conviction."
          />
        </>
      )}

      {subTab === 'auctions' && auctionData && (
        <>
          <AuctionFeed auctions={auctionData.auctions} />
          <InsightPanel
            tier={1}
            content="The bid-cover ratio is the simplest demand indicator in fixed income. Above 2.0x means there's enough demand to absorb twice the supply — the government could have borrowed more at that rate. Below 1.5x means demand barely covered the offer, and the cutoff yield had to rise to attract the marginal bidder. Devolvement is the red flag: it means even the primary dealers couldn't find enough buyers, so the unsold portion was forced onto them."
          />
        </>
      )}

      {subTab === 'heatmap' && (
        <>
          <YieldChangeHeatmap />
          <InsightPanel
            tier={1}
            content="This heatmap shows you at a glance where the curve is moving and how fast. If the short end is green (yields falling) and the long end is red (yields rising), the curve is steepening — that's typical early in an easing cycle. If everything is uniformly green, it's a parallel shift down — the whole market is rallying. If the belly (2Y–5Y) is the greenest, that's where the market has the strongest duration bid."
          />
        </>
      )}
    </div>
  )
}
