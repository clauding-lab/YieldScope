import type { AuctionData, YieldData, Anomaly } from '../types'
import { ANOMALY_THRESHOLDS } from '../utils/constants'

export function detectAnomalies(
  auctionData?: AuctionData | null,
  yieldData?: YieldData | null,
  repoRate?: number,
): Anomaly[] {
  const anomalies: Anomaly[] = []

  if (auctionData && auctionData.auctions.length > 0) {
    const recent = auctionData.auctions.slice(0, 10)

    for (const auction of recent) {
      // Low bid-cover
      if (auction.bidCoverRatio < ANOMALY_THRESHOLDS.veryLowBidCover) {
        anomalies.push({
          type: 'low_bid_cover',
          severity: 'critical',
          message: `Very low bid-cover of ${auction.bidCoverRatio}x on ${auction.tenor} ${auction.type} (${auction.date})`,
          triggerValue: auction.bidCoverRatio,
          threshold: ANOMALY_THRESHOLDS.veryLowBidCover,
          date: auction.date,
        })
      } else if (auction.bidCoverRatio < ANOMALY_THRESHOLDS.lowBidCover) {
        anomalies.push({
          type: 'low_bid_cover',
          severity: 'warning',
          message: `Low bid-cover of ${auction.bidCoverRatio}x on ${auction.tenor} ${auction.type} (${auction.date})`,
          triggerValue: auction.bidCoverRatio,
          threshold: ANOMALY_THRESHOLDS.lowBidCover,
          date: auction.date,
        })
      }

      // High devolvement
      if (auction.devolvementPct > ANOMALY_THRESHOLDS.veryHighDevolvement) {
        anomalies.push({
          type: 'high_devolvement',
          severity: 'critical',
          message: `Very high devolvement of ${auction.devolvementPct}% on ${auction.tenor} ${auction.type} (${auction.date})`,
          triggerValue: auction.devolvementPct,
          threshold: ANOMALY_THRESHOLDS.veryHighDevolvement,
          date: auction.date,
        })
      } else if (auction.devolvementPct > ANOMALY_THRESHOLDS.highDevolvement) {
        anomalies.push({
          type: 'high_devolvement',
          severity: 'warning',
          message: `Devolvement of ${auction.devolvementPct}% on ${auction.tenor} ${auction.type} (${auction.date})`,
          triggerValue: auction.devolvementPct,
          threshold: ANOMALY_THRESHOLDS.highDevolvement,
          date: auction.date,
        })
      }

      // Large yield move
      if (auction.yieldChangeBps != null) {
        const absChange = Math.abs(auction.yieldChangeBps)
        if (absChange > ANOMALY_THRESHOLDS.veryLargeYieldMove) {
          anomalies.push({
            type: 'large_yield_move',
            severity: 'critical',
            message: `${auction.tenor} yield moved ${auction.yieldChangeBps > 0 ? '+' : ''}${auction.yieldChangeBps}bps (${auction.date})`,
            triggerValue: absChange,
            threshold: ANOMALY_THRESHOLDS.veryLargeYieldMove,
            date: auction.date,
          })
        } else if (absChange > ANOMALY_THRESHOLDS.largeYieldMove) {
          anomalies.push({
            type: 'large_yield_move',
            severity: 'warning',
            message: `${auction.tenor} yield moved ${auction.yieldChangeBps > 0 ? '+' : ''}${auction.yieldChangeBps}bps (${auction.date})`,
            triggerValue: absChange,
            threshold: ANOMALY_THRESHOLDS.largeYieldMove,
            date: auction.date,
          })
        }
      }

      // Bid dispersion
      if (auction.weightedAvgYield && auction.cutoffYield) {
        const dispersion = Math.abs(auction.cutoffYield - auction.weightedAvgYield) * 100
        if (dispersion > ANOMALY_THRESHOLDS.bidDispersion) {
          anomalies.push({
            type: 'bid_dispersion',
            severity: 'warning',
            message: `Wide bid dispersion of ${dispersion.toFixed(0)}bps on ${auction.tenor} (cutoff ${auction.cutoffYield}% vs WAY ${auction.weightedAvgYield}%)`,
            triggerValue: dispersion,
            threshold: ANOMALY_THRESHOLDS.bidDispersion,
            date: auction.date,
          })
        }
      }
    }
  }

  if (yieldData && yieldData.daily.length > 0) {
    const latest = yieldData.daily[yieldData.daily.length - 1]
    const yields = latest.yields

    // Curve inversion check
    const tenorOrder = ['91D', '182D', '364D', '2Y', '5Y', '10Y', '15Y', '20Y'] as const
    for (let i = 0; i < tenorOrder.length - 1; i++) {
      const short = yields[tenorOrder[i]]
      const long = yields[tenorOrder[i + 1]]
      if (short !== undefined && long !== undefined && short > long) {
        anomalies.push({
          type: 'curve_inversion',
          severity: 'critical',
          message: `Curve inversion: ${tenorOrder[i]} (${short}%) > ${tenorOrder[i + 1]} (${long}%)`,
          triggerValue: short - long,
          threshold: 0,
          date: latest.date,
        })
      }
    }

    // Spread compression
    const spread91d10y = (yields['10Y'] ?? 0) - (yields['91D'] ?? 0)
    if (spread91d10y * 100 < ANOMALY_THRESHOLDS.spreadCompression && spread91d10y > 0) {
      anomalies.push({
        type: 'spread_compression',
        severity: 'warning',
        message: `10Y-91D spread compressed to ${(spread91d10y * 100).toFixed(0)}bps`,
        triggerValue: spread91d10y * 100,
        threshold: ANOMALY_THRESHOLDS.spreadCompression,
        date: latest.date,
      })
    }

    // Policy divergence
    if (repoRate !== undefined && yields['91D'] !== undefined) {
      const divergence = (yields['91D'] - repoRate) * 100
      if (Math.abs(divergence) > ANOMALY_THRESHOLDS.policyDivergence) {
        anomalies.push({
          type: 'policy_divergence',
          severity: 'warning',
          message: `91D T-bill (${yields['91D']}%) diverges ${divergence > 0 ? '+' : ''}${divergence.toFixed(0)}bps from repo rate (${repoRate}%)`,
          triggerValue: Math.abs(divergence),
          threshold: ANOMALY_THRESHOLDS.policyDivergence,
          date: latest.date,
        })
      }
    }
  }

  return anomalies
}
