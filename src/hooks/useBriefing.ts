import { useEffect, useState } from 'react'
import { fetchRecentBriefings, type Briefing } from '../lib/econdelta'

interface UseBriefingResult {
  briefings: Briefing[]
  loading: boolean
  error: Error | null
}

export function useBriefing(): UseBriefingResult {
  const [state, setState] = useState<UseBriefingResult>({
    briefings: [], loading: true, error: null,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const briefings = await fetchRecentBriefings(12)
        if (cancelled) return
        setState({ briefings, loading: false, error: null })
      } catch (e) {
        if (cancelled) return
        setState({ briefings: [], loading: false, error: e as Error })
      }
    })()
    return () => { cancelled = true }
  }, [])

  return state
}
