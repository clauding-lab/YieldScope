import { useState, useEffect } from 'react'
import type { MacroData } from '../types'
import { loadData } from '../services/dataLoader'

interface UseMacroDataReturn {
  data: MacroData | null
  isLoading: boolean
  error: string | null
}

export function useMacroData(): UseMacroDataReturn {
  const [data, setData] = useState<MacroData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setIsLoading(true)
        const result = await loadData<MacroData>('macro_context.json')
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load macro data')
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
