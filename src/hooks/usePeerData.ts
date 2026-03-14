import { useState, useEffect, useMemo } from 'react'
import type { PeerData, PeerComparison } from '../types'
import { loadData } from '../services/dataLoader'

interface UsePeerDataReturn {
  data: PeerData | null
  comparisons: PeerComparison[]
  isLoading: boolean
  error: string | null
}

const COMMON_TENORS = ['91D', '182D', '364D', '2Y', '5Y', '10Y']

export function usePeerData(): UsePeerDataReturn {
  const [data, setData] = useState<PeerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setIsLoading(true)
        const result = await loadData<PeerData>('peer_benchmarks.json')
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load peer data')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  const comparisons = useMemo(() => {
    if (!data) return []

    const bd = data.curves.find((c) => c.country === 'BD')
    const india = data.curves.find((c) => c.country === 'IN')
    const pk = data.curves.find((c) => c.country === 'PK')

    if (!bd) return []

    return COMMON_TENORS.map((tenor) => ({
      tenor,
      bdYield: bd.yields[tenor] ?? 0,
      inYield: india?.yields[tenor] ?? null,
      pkYield: pk?.yields[tenor] ?? null,
      bdRealYield: (bd.yields[tenor] ?? 0) - bd.cpiYoY,
      inRealYield: india ? (india.yields[tenor] ?? 0) - india.cpiYoY : null,
      pkRealYield: pk ? (pk.yields[tenor] ?? 0) - pk.cpiYoY : null,
    }))
  }, [data])

  return { data, comparisons, isLoading, error }
}
