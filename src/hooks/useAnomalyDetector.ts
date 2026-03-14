import { useMemo } from 'react'
import type { AuctionData, YieldData, Anomaly } from '../types'
import { detectAnomalies } from '../services/anomalyDetector'

export function useAnomalyDetector(
  auctionData?: AuctionData | null,
  yieldData?: YieldData | null,
  repoRate?: number,
) {
  const anomalies = useMemo<Anomaly[]>(() => {
    return detectAnomalies(auctionData, yieldData, repoRate)
  }, [auctionData, yieldData, repoRate])

  const criticalCount = anomalies.filter(a => a.severity === 'critical').length
  const warningCount = anomalies.filter(a => a.severity === 'warning').length

  return {
    anomalies,
    criticalCount,
    warningCount,
    hasAnomalies: anomalies.length > 0,
  }
}
