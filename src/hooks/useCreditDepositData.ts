import { useState, useEffect } from 'react'
import type { CreditDepositData } from '../types'
import { loadData } from '../services/dataLoader'

interface UseCreditDepositDataReturn {
  data: CreditDepositData | null
  isLoading: boolean
  error: string | null
}

export function useCreditDepositData(): UseCreditDepositDataReturn {
  const [data, setData] = useState<CreditDepositData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setIsLoading(true)
        const result = await loadData<CreditDepositData>('credit_deposit.json')
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load credit/deposit data')
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
