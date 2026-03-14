import { useState, useEffect } from 'react'
import type { ValuationData } from '../types'
import { loadData } from '../services/dataLoader'

interface UseValuationDataReturn {
  data: ValuationData | null
  isLoading: boolean
  error: string | null
}

export function useValuationData(): UseValuationDataReturn {
  const [data, setData] = useState<ValuationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setIsLoading(true)
        const result = await loadData<ValuationData>('valuation_tds.json')
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load valuation data')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  return { data, isLoading, error }
}
