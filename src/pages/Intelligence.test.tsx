import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('../lib/hooks', () => ({ useIsDesktop: vi.fn(), useMediaQuery: vi.fn() }))
vi.mock('../hooks/useBriefing', () => ({ useBriefing: vi.fn() }))

import { useIsDesktop } from '../lib/hooks'
import { useBriefing } from '../hooks/useBriefing'
import Intelligence, { briefingsToTimeline } from './Intelligence'

const BRIEFING = {
  weekOf: '2026-07-06', generatedAt: '2026-07-06T01:04:32Z',
  title: '91D Grinds to 9.33%', body: 'Body text.',
  featuredAnomalies: [{ candidate_id: 'a1', label: 'Call money breach', stat: 'z', value: 2.1, detail: '+42 bps in 3 sessions', severity: 'up' as const, metric_id: 'call_money_rate', why: 'w' }],
  openThreads: [], dataAsOf: '2026-03-31', staleSeries: [],
}

beforeEach(() => { vi.mocked(useIsDesktop).mockReturnValue(false) })

describe('Intelligence · honesty', () => {
  it('with no briefings: renders an empty state, never the fixture essay or fixture anomalies', () => {
    vi.mocked(useBriefing).mockReturnValue({ briefings: [], loading: false, error: null })
    render(<Intelligence />)
    expect(screen.getByText(/no briefing published yet/i)).toBeInTheDocument()
    expect(screen.queryByText(/the short end is rotating/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/repo borrowing from bb \+42%/i)).not.toBeInTheDocument()
  })

  it('with a briefing: renders live anomalies under a weekly label, no decision log', () => {
    vi.mocked(useBriefing).mockReturnValue({ briefings: [BRIEFING], loading: false, error: null })
    render(<Intelligence />)
    expect(screen.getByText(/anomalies · this week/i)).toBeInTheDocument()
    expect(screen.getByText('Call money breach')).toBeInTheDocument()
    expect(screen.queryByText(/alco decisions/i)).not.toBeInTheDocument()
  })

  it('desktop, with no briefings: renders an empty state, never the fixture essay', () => {
    vi.mocked(useIsDesktop).mockReturnValue(true)
    vi.mocked(useBriefing).mockReturnValue({ briefings: [], loading: false, error: null })
    render(<Intelligence />)
    expect(screen.getByText(/no briefing published yet/i)).toBeInTheDocument()
    expect(screen.queryByText(/the short end is rotating/i)).not.toBeInTheDocument()
  })
})

describe('briefingsToTimeline', () => {
  const mk = (weekOf: string, title: string, n: number) => ({
    ...BRIEFING, weekOf, title,
    featuredAnomalies: Array.from({ length: n }, (_, i) => ({ ...BRIEFING.featuredAnomalies[0], candidate_id: `a${i}` })),
  })
  it('maps up to 7 briefings oldest→newest with evenly spaced pcts and anomaly-count severity', () => {
    const out = briefingsToTimeline([mk('2026-07-06', 'B', 4), mk('2026-06-29', 'A', 0)])
    expect(out).not.toBeNull()
    expect(out!.axis).toEqual(['29 Jun', '06 Jul'])
    expect(out!.events[0]).toMatchObject({ label: 'A', sub: '29 Jun', sev: 'info', pct: 0.04 })
    expect(out!.events[1]).toMatchObject({ label: 'B', sub: '06 Jul', sev: 'neg', pct: 0.96 })
  })
  it('returns null with fewer than 2 briefings', () => {
    expect(briefingsToTimeline([mk('2026-07-06', 'B', 1)])).toBeNull()
  })
})
