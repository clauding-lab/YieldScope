import { useState, useEffect } from 'react'
import type { RepoData } from '../types'
import { loadData } from '../services/dataLoader'

interface UseRepoDataReturn {
  data: RepoData | null
  isLoading: boolean
  error: string | null
}

export function useRepoData(): UseRepoDataReturn {
  const [data, setData] = useState<RepoData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setIsLoading(true)
        const result = await loadData<RepoData>('repo_industry.json')
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load repo data')
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
