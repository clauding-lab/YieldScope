import { usePolicyData } from '../hooks/usePolicyData'
import { useYieldData } from '../hooks/useYieldData'
import { RateCorridorChart } from '../components/charts/RateCorridorChart'
import { PolicyTimeline } from '../components/policy/PolicyTimeline'
import { TransmissionSpread } from '../components/policy/TransmissionSpread'

export function PolicyPage() {
  const { data: policyData, isLoading: policyLoading, error: policyError } = usePolicyData()
  const { data: yieldData } = useYieldData()

  if (policyLoading) {
    return (
      <div className="space-y-4 py-4">
        <div className="bg-surface rounded-xl p-4 h-48 animate-pulse" />
        <div className="bg-surface rounded-xl p-4 h-24 animate-pulse" />
        <div className="bg-surface rounded-xl p-4 h-64 animate-pulse" />
      </div>
    )
  }

  if (policyError || !policyData) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-400 text-sm">{policyError ?? 'No data available'}</p>
      </div>
    )
  }

  const latestYields = yieldData?.daily[0]?.yields
  const tbill91d = latestYields?.['91D']
  const callMoneyRate = 8.15

  return (
    <div className="space-y-4 py-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-100">Policy Dashboard</h2>
        <p className="text-sm text-slate-500 mt-0.5">Bangladesh Bank Monetary Policy</p>
      </div>

      <RateCorridorChart
        policyData={policyData}
        callMoneyRate={callMoneyRate}
        tbill91dYield={tbill91d}
      />

      {tbill91d && (
        <TransmissionSpread
          repoRate={policyData.currentRates.repoRate}
          tbill91dYield={tbill91d}
        />
      )}

      <PolicyTimeline events={policyData.events} />
    </div>
  )
}
