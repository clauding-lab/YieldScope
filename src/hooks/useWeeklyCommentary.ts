import { useState, useEffect } from 'react'
import type { WeeklyCommentaryData } from '../types'
import { loadData } from '../services/dataLoader'

export function useWeeklyCommentary() {
  const [data, setData] = useState<WeeklyCommentaryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setIsLoading(true)
        const result = await loadData<WeeklyCommentaryData>('weekly_commentary.json')
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load commentary')
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
