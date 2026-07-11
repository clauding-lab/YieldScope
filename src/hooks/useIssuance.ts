import { useEffect, useState } from 'react'
import { fetchAuctionCalendar, toWeeklyIssuance, type WeeklyIssuance } from '../lib/auctions'

interface UseIssuanceResult {
  data: WeeklyIssuance[] | null
  loading: boolean
  error: Error | null
}

export function useIssuance(): UseIssuanceResult {
  const [state, setState] = useState<UseIssuanceResult>({ data: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const cal = await fetchAuctionCalendar(60)
        if (cancelled) return
        setState({ data: toWeeklyIssuance(cal, new Date()), loading: false, error: null })
      } catch (e) {
        if (cancelled) return
        setState({ data: null, loading: false, error: e as Error })
      }
    })()
    return () => { cancelled = true }
  }, [])

  return state
}
