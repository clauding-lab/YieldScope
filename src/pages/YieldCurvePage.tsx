import { useYieldData } from '../hooks/useYieldData'
import { usePolicyData } from '../hooks/usePolicyData'
import { YieldCurveChart } from '../components/charts/YieldCurveChart'
import { YieldTimeSeriesChart } from '../components/charts/YieldTimeSeriesChart'
import { SpreadIndicator } from '../components/charts/SpreadIndicator'

export function YieldCurvePage() {
  const { data: yieldData, isLoading, error } = useYieldData()
  const { data: policyData } = usePolicyData()

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <div className="bg-surface rounded-xl p-4 h-64 animate-pulse" />
        <div className="bg-surface rounded-xl p-4 h-16 animate-pulse" />
        <div className="bg-surface rounded-xl p-4 h-72 animate-pulse" />
      </div>
    )
  }

  if (error || !yieldData) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-400 text-sm">{error ?? 'No data available'}</p>
      </div>
    )
  }

  const policyMarkers = policyData?.events
    .filter((e) => e.type === 'rate_change')
    .map((e) => ({ date: e.date, title: e.title })) ?? []

  return (
    <div className="space-y-4 py-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-100">Yield Curve</h2>
        <p className="text-sm text-slate-500 mt-0.5">Bangladesh Government Securities</p>
      </div>

      <YieldCurveChart
        yieldData={yieldData}
        repoRate={policyData?.currentRates.repoRate}
      />

      <SpreadIndicator yieldData={yieldData} />

      <YieldTimeSeriesChart
        yieldData={yieldData}
        policyEvents={policyMarkers}
      />
    </div>
  )
}
