import { useState, useEffect } from 'react'
import type { BankingData } from '../types'
import { loadData } from '../services/dataLoader'

interface UseBankingDataReturn {
  data: BankingData | null
  isLoading: boolean
  error: string | null
}

export function useBankingData(): UseBankingDataReturn {
  const [data, setData] = useState<BankingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setIsLoading(true)
        const result = await loadData<BankingData>('banking_data.json')
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load banking data')
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
