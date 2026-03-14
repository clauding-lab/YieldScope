import { useState, useEffect } from 'react'
import type { MoneySupplyData } from '../types'
import { loadData } from '../services/dataLoader'

interface UseMoneySupplyDataReturn {
  data: MoneySupplyData | null
  isLoading: boolean
  error: string | null
}

export function useMoneySupplyData(): UseMoneySupplyDataReturn {
  const [data, setData] = useState<MoneySupplyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setIsLoading(true)
        const result = await loadData<MoneySupplyData>('money_supply.json')
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load money supply data')
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
