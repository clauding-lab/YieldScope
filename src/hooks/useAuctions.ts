import { useEffect, useState } from 'react'
import {
  fetchAuctionResults,
  fetchAuctionCalendar,
  toAuctionDisplayRows,
  toUpcomingAuctions,
  type AuctionDisplayRow,
  type UpcomingAuction,
} from '../lib/auctions'

export interface AuctionsData {
  results: AuctionDisplayRow[]   // recent cleared auctions, newest-first
  upcoming: UpcomingAuction[]    // forward calendar, grouped by date
}

interface UseAuctionsResult {
  data: AuctionsData | null
  loading: boolean
  error: Error | null
}

export function useAuctions(): UseAuctionsResult {
  const [state, setState] = useState<UseAuctionsResult>({
    data: null, loading: true, error: null,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [results, calendar] = await Promise.all([
          fetchAuctionResults(12),
          fetchAuctionCalendar(24),
        ])
        if (cancelled) return
        setState({
          loading: false,
          error: null,
          data: {
            results: toAuctionDisplayRows(results),
            upcoming: toUpcomingAuctions(calendar, new Date(), 4),
          },
        })
      } catch (e) {
        if (cancelled) return
        setState({ data: null, loading: false, error: e as Error })
      }
    })()
    return () => { cancelled = true }
  }, [])

  return state
}
