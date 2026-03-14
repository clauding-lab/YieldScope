import type { AuctionResult } from '../../types'
import { AuctionCard } from './AuctionCard'

interface AuctionFeedProps {
  auctions: AuctionResult[]
}

export function AuctionFeed({ auctions }: AuctionFeedProps) {
  if (auctions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        No auctions match your filters
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {auctions.map((auction) => (
        <AuctionCard key={auction.id} auction={auction} />
      ))}
    </div>
  )
}
