import { useYieldData } from '../hooks/useYieldData'
import { useAuctionData } from '../hooks/useAuctionData'
import { usePolicyData } from '../hooks/usePolicyData'
import { useWeeklyCommentary } from '../hooks/useWeeklyCommentary'
import { useAnomalyDetector } from '../hooks/useAnomalyDetector'
import { WeeklyCommentaryCard } from '../components/ai/WeeklyCommentaryCard'
import { AnomalyBanner } from '../components/ai/AnomalyBanner'
import { CurveInterpreter } from '../components/ai/CurveInterpreter'
import { RateCorridorChart } from '../components/charts/RateCorridorChart'
import { TransmissionSpread } from '../components/policy/TransmissionSpread'
import { PolicyTimeline } from '../components/policy/PolicyTimeline'
import { usePeerData } from '../hooks/usePeerData'
import { PeerYieldOverlay } from '../components/peer/PeerYieldOverlay'
import { RealYieldComparison } from '../components/peer/RealYieldComparison'
import { FxAdjustedReturns } from '../components/peer/FxAdjustedReturns'

export default function IntelligencePage() {
  const { data: yieldData, isLoading: yieldLoading } = useYieldData()
  const { data: auctionData } = useAuctionData()
  const { data: policyData, isLoading: policyLoading } = usePolicyData()
  const { data: commentaryData } = useWeeklyCommentary()
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
      <div className="px-4 py-6 space-y-4">
        <div className="h-8 bg-slate-800 rounded animate-pulse" />
        <div className="h-32 bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-48 bg-slate-800 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Intelligence</h1>
        <p className="text-sm text-slate-400">AI-powered market analysis & policy dashboard</p>
      </div>

      {/* Anomaly alerts */}
      <AnomalyBanner anomalies={anomalies} />

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
        <RateCorridorChart policyData={policyData} tbill91dYield={latestYield.yields['91D']} />
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
          <div className="pt-2">
            <h2 className="text-lg font-semibold text-slate-200">Peer Benchmarking</h2>
            <p className="text-xs text-slate-500">BD vs India vs Pakistan yield comparison</p>
          </div>

          <PeerYieldOverlay comparisons={peerComparisons} />
          <RealYieldComparison comparisons={peerComparisons} />
          <FxAdjustedReturns curves={peerData.curves} />
        </>
      )}
    </div>
  )
}
