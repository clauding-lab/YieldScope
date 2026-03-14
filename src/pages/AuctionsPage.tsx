import { useAuctionData } from '../hooks/useAuctionData'
import { AuctionFeed } from '../components/auction/AuctionFeed'
import { AuctionFilters } from '../components/auction/AuctionFilters'

export function AuctionsPage() {
  const { filtered, filters, setFilters, isLoading, error } = useAuctionData()

  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface rounded-xl p-4 h-24 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 py-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-100">Auction Tracker</h2>
        <p className="text-sm text-slate-500 mt-0.5">T-Bill (Sunday) & T-Bond (Tuesday) Results</p>
      </div>

      <AuctionFilters filters={filters} onFilterChange={setFilters} />
      <AuctionFeed auctions={filtered} />
    </div>
  )
}
