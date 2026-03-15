import { useYieldData } from '../hooks/useYieldData'
import { useAuctionData } from '../hooks/useAuctionData'
import { usePolicyData } from '../hooks/usePolicyData'
import { useWeeklyCommentary } from '../hooks/useWeeklyCommentary'
import { useAnomalyDetector } from '../hooks/useAnomalyDetector'
import { useMacroData } from '../hooks/useMacroData'
import { useMoneySupplyData } from '../hooks/useMoneySupplyData'
import { useFiscalData } from '../hooks/useFiscalData'
import { useCommodityData } from '../hooks/useCommodityData'
import { WeeklyCommentaryCard } from '../components/ai/WeeklyCommentaryCard'
import { AnomalyBanner } from '../components/ai/AnomalyBanner'
import { CurveInterpreter } from '../components/ai/CurveInterpreter'
import { AlcoBriefGenerator } from '../components/ai/AlcoBriefGenerator'
import { RateCorridorChart } from '../components/charts/RateCorridorChart'
import { TransmissionSpread } from '../components/policy/TransmissionSpread'
import { PolicyTimeline } from '../components/policy/PolicyTimeline'
import { usePeerData } from '../hooks/usePeerData'
import { PeerYieldOverlay } from '../components/peer/PeerYieldOverlay'
import { RealYieldComparison } from '../components/peer/RealYieldComparison'
import { FxAdjustedReturns } from '../components/peer/FxAdjustedReturns'
import { InsightPanel } from '../components/ui/InsightPanel'
import { DataTimestamp } from '../components/ui/DataTimestamp'

export default function IntelligencePage() {
  const { data: yieldData, isLoading: yieldLoading } = useYieldData()
  const { data: auctionData } = useAuctionData()
  const { data: policyData, isLoading: policyLoading } = usePolicyData()
  const { data: commentaryData } = useWeeklyCommentary()
  const { data: macroData } = useMacroData()
  const { data: moneySupplyData } = useMoneySupplyData()
  const { data: fiscalData } = useFiscalData()
  const { data: commodityData } = useCommodityData()
  const { anomalies } = useAnomalyDetector(
    auctionData,
    yieldData,
    policyData?.currentRates.repoRate
  )

  const { data: peerData, comparisons: peerComparisons } = usePeerData()
  const latestCommentary = commentaryData?.commentaries?.[0]
  const latestYield = yieldData?.daily?.[yieldData.daily.length - 1]

  if (yieldLoading || policyLoading) {
    return (
      <div className="py-4 space-y-4">
        <div className="h-8 bg-slate-800 rounded animate-pulse" />
        <div className="h-32 bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-48 bg-slate-800 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Intelligence</h1>
          <p className="text-xs text-slate-500">AI analysis, ALCO brief, policy tracker, peer benchmarking</p>
        </div>
        <DataTimestamp lastUpdated={yieldData?.lastUpdated ?? null} compact />
      </div>

      {/* Smart Alerts (cross-tab) */}
      <AnomalyBanner anomalies={anomalies} />

      {/* ALCO Brief Generator — Tier 2 AI */}
      <AlcoBriefGenerator
        yieldData={yieldData}
        auctionData={auctionData}
        macroData={macroData}
        moneySupplyData={moneySupplyData}
        policyData={policyData}
        fiscalData={fiscalData}
        commodityData={commodityData}
      />

      {/* Weekly Commentary */}
      {latestCommentary && (
        <WeeklyCommentaryCard commentary={latestCommentary} />
      )}

      {/* Curve Interpreter */}
      {yieldData && (
        <CurveInterpreter yieldData={yieldData} policyData={policyData} />
      )}

      {/* Policy Rate Corridor */}
      {policyData && latestYield && (
        <>
          <RateCorridorChart policyData={policyData} tbill91dYield={latestYield.yields['91D']} />
          <InsightPanel
            tier={1}
            content="Policy transmission is the central question in any easing cycle: when BB cuts rates, do market rates actually follow? A wide gap between the 91D T-bill and the repo rate means transmission is poor. As this gap narrows, it means the easing is working its way through the system."
          />
        </>
      )}

      {/* Transmission Spread */}
      {policyData && latestYield && (
        <TransmissionSpread
          repoRate={policyData.currentRates.repoRate}
          tbill91dYield={latestYield.yields['91D']}
        />
      )}

      {/* Policy Timeline */}
      {policyData && (
        <PolicyTimeline events={policyData.events} />
      )}

      {/* Peer Benchmarking */}
      {peerData && peerComparisons.length > 0 && (
        <>
          <div className="pt-2 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-200">Peer Benchmarking</h2>
              <p className="text-xs text-slate-500">BD vs India vs Pakistan yield comparison</p>
            </div>
            <DataTimestamp lastUpdated={peerData.lastUpdated} compact />
          </div>

          <PeerYieldOverlay comparisons={peerComparisons} />
          <InsightPanel
            tier={1}
            content="Bangladesh sits between India (lower, flatter curve) and Pakistan (higher, steeper curve) in absolute yield levels. This maps directly to sovereign risk perception. India trades tight because of deep markets and high reserves. Pakistan trades wide because of IMF dependency and serial currency crises."
          />

          <RealYieldComparison comparisons={peerComparisons} />
          <FxAdjustedReturns curves={peerData.curves} />
        </>
      )}
    </div>
  )
}
