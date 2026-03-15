import type { SmartAlert, AlertSeverity } from '../types/alerts'
import type { YieldData, AuctionData, MoneySupplyData, MacroData, RepoData, BorrowingData } from '../types'
import { TENORS } from '../types'

let alertIdCounter = 0
function nextAlertId(): string {
  return `alert-${++alertIdCounter}`
}

function createAlert(
  type: SmartAlert['type'],
  severity: AlertSeverity,
  message: string,
  detail: string,
  source: SmartAlert['source'],
  date: string
): SmartAlert {
  return { id: nextAlertId(), type, severity, message, detail, date, source }
}

export function generateAlerts(data: {
  yieldData?: YieldData | null
  auctionData?: AuctionData | null
  moneySupplyData?: MoneySupplyData | null
  macroData?: MacroData | null
  repoData?: RepoData | null
  borrowingData?: BorrowingData | null
}): SmartAlert[] {
  const alerts: SmartAlert[] = []
  const { yieldData, auctionData, moneySupplyData, repoData } = data

  // Curve inversion detection
  if (yieldData?.daily?.length) {
    const latest = yieldData.daily[yieldData.daily.length - 1]
    for (let i = 0; i < TENORS.length - 1; i++) {
      const shortTenor = TENORS[i]
      const longTenor = TENORS[i + 1]
      const shortYield = latest.yields[shortTenor]
      const longYield = latest.yields[longTenor]
      if (shortYield != null && longYield != null && shortYield > longYield) {
        alerts.push(createAlert(
          'curve_inversion',
          'critical',
          `Curve inversion: ${shortTenor} (${shortYield.toFixed(2)}%) > ${longTenor} (${longYield.toFixed(2)}%)`,
          `The ${shortTenor} yield exceeds ${longTenor}, signaling market stress or aggressive rate cut expectations at the front end.`,
          'yield',
          latest.date
        ))
      }
    }
  }

  // Low bid-cover & devolvement from recent auctions
  if (auctionData?.auctions?.length) {
    const recentAuctions = auctionData.auctions.slice(0, 10)
    for (const auction of recentAuctions) {
      if (auction.bidCoverRatio < 1.0) {
        alerts.push(createAlert(
          'low_bid_cover',
          'critical',
          `Failed auction: ${auction.tenor} bid-cover ${auction.bidCoverRatio.toFixed(2)}x`,
          `Bid-cover below 1.0x on ${auction.tenor} ${auction.type} (${auction.date}). Auction essentially failed — not enough demand to cover the offer.`,
          'auction',
          auction.date
        ))
      } else if (auction.bidCoverRatio < 1.5) {
        alerts.push(createAlert(
          'low_bid_cover',
          'warning',
          `Low bid-cover of ${auction.bidCoverRatio.toFixed(2)}x on ${auction.tenor} ${auction.type} (${auction.date})`,
          `Demand barely covered the offer. The cutoff yield had to rise to attract the marginal bidder.`,
          'auction',
          auction.date
        ))
      }

      if (auction.devolvementCrore > 0) {
        alerts.push(createAlert(
          'auction_devolvement',
          'critical',
          `Devolvement of ${auction.devolvementCrore} Cr on ${auction.tenor} ${auction.type}`,
          `${auction.devolvementPct.toFixed(1)}% of the auction was devolved onto primary dealers — the market has no appetite for this duration.`,
          'auction',
          auction.date
        ))
      }
    }
  }

  // Liquidity threshold
  if (moneySupplyData?.monthly?.length) {
    const latest = moneySupplyData.monthly[moneySupplyData.monthly.length - 1]
    if (latest.excessLiquidityCrore < 150000) {
      alerts.push(createAlert(
        'liquidity_threshold',
        'critical',
        `Excess liquidity at ${(latest.excessLiquidityCrore / 100000).toFixed(1)}L Cr — below 1.5L Cr threshold`,
        `System liquidity is critically low. Expect upward pressure on call money rates and T-bill yields.`,
        'liquidity',
        latest.date
      ))
    } else if (latest.excessLiquidityCrore < 200000) {
      // Check for declining trend
      const prev = moneySupplyData.monthly[moneySupplyData.monthly.length - 2]
      const declining = prev && latest.excessLiquidityCrore < prev.excessLiquidityCrore
      if (declining) {
        alerts.push(createAlert(
          'liquidity_threshold',
          'warning',
          `Excess liquidity at ${(latest.excessLiquidityCrore / 100000).toFixed(1)}L Cr and declining`,
          `Liquidity trend is tightening. Monitor call money rates and BB repo window activity.`,
          'liquidity',
          latest.date
        ))
      }
    }
  }

  // Repo maturity wall
  if (repoData?.daily?.length) {
    const latest = repoData.daily[repoData.daily.length - 1]
    const upcomingMaturities = latest.repoMaturitySchedule || []
    const now = new Date()
    const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const upcomingTotal = upcomingMaturities
      .filter(m => new Date(m.maturityDate) <= sevenDaysOut)
      .reduce((sum, m) => sum + m.amountCrore, 0)

    if (upcomingTotal > 25000) {
      alerts.push(createAlert(
        'repo_maturity_wall',
        'warning',
        `${upcomingTotal.toLocaleString()} Cr repo maturing within 7 days`,
        `Large repo maturities ahead. Expect Sunday's T-bill auction to see slightly higher yields and call money rate to spike.`,
        'liquidity',
        latest.date
      ))
    }
  }

  // Spread compression (10Y-91D)
  if (yieldData?.daily?.length) {
    const latest = yieldData.daily[yieldData.daily.length - 1]
    const y91d = latest.yields['91D']
    const y10y = latest.yields['10Y']
    if (y91d != null && y10y != null) {
      const spreadBps = (y10y - y91d) * 100
      if (spreadBps < 100) {
        alerts.push(createAlert(
          'spread_compression',
          'warning',
          `10Y-91D spread at ${spreadBps.toFixed(0)}bps — below 100bps`,
          `The term premium is compressed. The market sees limited reward for extending duration beyond the short end.`,
          'yield',
          latest.date
        ))
      }
    }
  }

  // Sort by severity: critical first, then warning, then positive
  const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, positive: 2 }
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return alerts
}
