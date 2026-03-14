import { useState } from 'react'
import type { AuctionResult } from '../../types'
import { formatYield, formatCrore, formatBidCover, formatDate } from '../../utils/formatters'
import { bidCoverColor } from '../../utils/colors'
import { TrendArrow } from './TrendArrow'
import { DevolvementAlert } from './DevolvementAlert'

interface AuctionCardProps {
  auction: AuctionResult
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const [expanded, setExpanded] = useState(false)

  const typeBadge = auction.type === 'T-Bill'
    ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
    : 'bg-violet-500/15 text-violet-400 border-violet-500/30'

  return (
    <div
      className="bg-surface rounded-xl p-4 cursor-pointer transition-colors hover:bg-surface-hover"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${typeBadge}`}>
            {auction.type}
          </span>
          <span className="text-sm font-semibold text-slate-200">{auction.tenor}</span>
        </div>
        <span className="text-xs text-slate-500">{formatDate(auction.date)}</span>
      </div>

      {/* Key metrics row */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500">Cutoff Yield</div>
          <div className="text-lg font-semibold text-slate-100">
            {formatYield(auction.cutoffYield)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-500">Change</div>
          <TrendArrow bps={auction.yieldChangeBps} />
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Bid-Cover</div>
          <div className={`text-sm font-semibold ${bidCoverColor(auction.bidCoverRatio)}`}>
            {formatBidCover(auction.bidCoverRatio)}
          </div>
        </div>
      </div>

      {/* Devolvement alert */}
      {auction.devolvementCrore > 0 && (
        <div className="mt-2">
          <DevolvementAlert amountCrore={auction.devolvementCrore} pct={auction.devolvementPct} />
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">Notified: </span>
              <span className="text-slate-300">{formatCrore(auction.notifiedAmountCrore)}</span>
            </div>
            <div>
              <span className="text-slate-500">Accepted: </span>
              <span className="text-slate-300">{formatCrore(auction.acceptedAmountCrore)}</span>
            </div>
            <div>
              <span className="text-slate-500">Total Bids: </span>
              <span className="text-slate-300">{formatCrore(auction.totalBidsCrore)}</span>
            </div>
            <div>
              <span className="text-slate-500">WAY: </span>
              <span className="text-slate-300">{formatYield(auction.weightedAvgYield)}</span>
            </div>
            {auction.couponRate != null && (
              <div>
                <span className="text-slate-500">Coupon: </span>
                <span className="text-slate-300">{formatYield(auction.couponRate)}</span>
              </div>
            )}
            {auction.isReissue && (
              <div>
                <span className="text-yellow-500/80 text-[10px]">Re-issue</span>
              </div>
            )}
          </div>

          {auction.autopsy && (
            <div className="mt-2 p-2.5 bg-slate-800/50 rounded-lg">
              <div className="text-[10px] text-accent/70 font-medium mb-1">AI Analysis</div>
              <p className="text-xs text-slate-300 leading-relaxed">{auction.autopsy}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
