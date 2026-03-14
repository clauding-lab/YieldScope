import { useState, useEffect } from 'react'
import type { PolicyData } from '../types'
import { loadData } from '../services/dataLoader'

interface UsePolicyDataReturn {
  data: PolicyData | null
  isLoading: boolean
  error: string | null
}

export function usePolicyData(): UsePolicyDataReturn {
  const [data, setData] = useState<PolicyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setIsLoading(true)
        const result = await loadData<PolicyData>('policy_events.json')
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load policy data')
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
