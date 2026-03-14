import { useState, useEffect, useMemo } from 'react'
import type { AuctionData, AuctionResult, AuctionFilters } from '../types'
import { loadData } from '../services/dataLoader'

interface UseAuctionDataReturn {
  data: AuctionData | null
  filtered: AuctionResult[]
  filters: AuctionFilters
  setFilters: (filters: AuctionFilters) => void
  isLoading: boolean
  error: string | null
}

export function useAuctionData(): UseAuctionDataReturn {
  const [data, setData] = useState<AuctionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AuctionFilters>({ type: 'All', tenor: 'All' })

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setIsLoading(true)
        const result = await loadData<AuctionData>('auction_results.json')
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load auction data')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    if (!data) return []
    return data.auctions.filter((a) => {
      if (filters.type !== 'All' && a.type !== filters.type) return false
      if (filters.tenor !== 'All' && a.tenor !== filters.tenor) return false
      return true
    })
  }, [data, filters])

  return { data, filtered, filters, setFilters, isLoading, error }
}
