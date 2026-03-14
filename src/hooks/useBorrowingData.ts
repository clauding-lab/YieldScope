import { useState, useEffect } from 'react'
import type { BorrowingData } from '../types'
import { loadData } from '../services/dataLoader'

interface UseBorrowingDataReturn {
  data: BorrowingData | null
  isLoading: boolean
  error: string | null
}

export function useBorrowingData(): UseBorrowingDataReturn {
  const [data, setData] = useState<BorrowingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setIsLoading(true)
        const result = await loadData<BorrowingData>('govt_borrowing.json')
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load borrowing data')
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
