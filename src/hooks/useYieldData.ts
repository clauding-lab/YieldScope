import { useState, useEffect } from 'react'
import type { YieldData } from '../types'
import { loadData } from '../services/dataLoader'

interface UseYieldDataReturn {
  data: YieldData | null
  isLoading: boolean
  error: string | null
  lastUpdated: string | null
}

export function useYieldData(): UseYieldDataReturn {
  const [data, setData] = useState<YieldData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setIsLoading(true)
        const result = await loadData<YieldData>('yield_data.json')
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load yield data')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  return {
    data,
    isLoading,
    error,
    lastUpdated: data?.lastUpdated ?? null,
  }
}
