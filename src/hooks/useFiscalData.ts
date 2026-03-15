import { useState, useEffect } from 'react'
import type { FiscalData } from '../types'
import { loadData } from '../services/dataLoader'

interface UseFiscalDataReturn {
  data: FiscalData | null
  isLoading: boolean
  error: string | null
}

export function useFiscalData(): UseFiscalDataReturn {
  const [data, setData] = useState<FiscalData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setIsLoading(true)
        const result = await loadData<FiscalData>('fiscal_data.json')
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load fiscal data')
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
