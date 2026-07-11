import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Honesty pin: with no live briefing, the Dashboard must show a plain
// "no briefing yet" note — never the FX.intel.weekly fixture essay.

vi.mock('../lib/hooks', () => ({ useIsDesktop: vi.fn(), useMediaQuery: vi.fn() }))
vi.mock('../hooks/useDashboard', () => ({ useDashboard: vi.fn() }))
vi.mock('../hooks/useAuctions', () => ({ useAuctions: vi.fn() }))
vi.mock('../hooks/useBriefing', () => ({ useBriefing: vi.fn() }))

import { useIsDesktop } from '../lib/hooks'
import { useDashboard } from '../hooks/useDashboard'
import { useAuctions } from '../hooks/useAuctions'
import { useBriefing } from '../hooks/useBriefing'
import Dashboard from './Dashboard'

beforeEach(() => {
  vi.mocked(useIsDesktop).mockReset()
  vi.mocked(useDashboard).mockReturnValue({ data: null, loading: false, error: null })
  vi.mocked(useAuctions).mockReturnValue({ data: null, loading: false, error: null })
  vi.mocked(useBriefing).mockReturnValue({ briefings: [], loading: false, error: null })
})

describe('Dashboard · honesty (no briefing)', () => {
  it('mobile: renders an empty-state note, not the fixture essay, when no briefing exists', () => {
    vi.mocked(useIsDesktop).mockReturnValue(false)
    render(<Dashboard />)
    // The weekly-briefing panel is a collapsed accordion by default on mobile
    // (Collapse's defaultOpen is false) — open it to reach its body content.
    fireEvent.click(screen.getByRole('button', { name: /weekly briefing/i }))
    // Two honest "no briefing" surfaces now render (hero line + panel note) —
    // assert on the panel note's unique tail to disambiguate from the hero.
    expect(screen.getByText(/generated monday mornings/i)).toBeInTheDocument()
    expect(screen.queryByText(/three forces are squeezing the short end/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/call money has now pierced the repo/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/364-day undersubscribed/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/short end is rotating/i)).not.toBeInTheDocument()
  })

  it('desktop: renders an empty-state note, not the fixture essay, when no briefing exists', () => {
    vi.mocked(useIsDesktop).mockReturnValue(true)
    render(<Dashboard />)
    // Two honest "no briefing" surfaces now render (hero line + panel note) —
    // assert on the panel note's unique tail to disambiguate from the hero.
    expect(screen.getByText(/generated monday mornings/i)).toBeInTheDocument()
    expect(screen.queryByText(/three forces are squeezing the short end/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/call money has now pierced the repo/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/364-day undersubscribed/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/short end is rotating/i)).not.toBeInTheDocument()
  })
})

describe('Dashboard · positive path (live briefing)', () => {
  const LIVE_BRIEFING = {
    weekOf: '2026-07-06',
    generatedAt: '2026-07-06T01:04:32Z',
    title: 'Live Title X',
    body: 'Live body.',
    featuredAnomalies: [],
    openThreads: [],
    dataAsOf: '2026-07-06',
    staleSeries: [],
  }

  it('mobile: renders the live briefing title and drops the empty-state note', () => {
    vi.mocked(useIsDesktop).mockReturnValue(false)
    vi.mocked(useBriefing).mockReturnValue({ briefings: [LIVE_BRIEFING], loading: false, error: null })
    render(<Dashboard />)
    // Title renders twice on mobile: hero <p> + always-visible Collapse header.
    expect(screen.getAllByText('Live Title X').length).toBeGreaterThan(0)
    expect(screen.queryByText(/no weekly briefing yet/i)).not.toBeInTheDocument()
  })

  it('desktop: renders the live briefing title and drops the empty-state note', () => {
    vi.mocked(useIsDesktop).mockReturnValue(true)
    vi.mocked(useBriefing).mockReturnValue({ briefings: [LIVE_BRIEFING], loading: false, error: null })
    render(<Dashboard />)
    // Title renders twice on desktop: hero <p> + briefing panel <h3>.
    expect(screen.getAllByText('Live Title X').length).toBeGreaterThan(0)
    expect(screen.queryByText(/no weekly briefing yet/i)).not.toBeInTheDocument()
  })
})

describe('Dashboard · OutageChip surfaces a swallowed useDashboard error', () => {
  it('mobile: shows the outage chip when useDashboard errors', () => {
    vi.mocked(useIsDesktop).mockReturnValue(false)
    vi.mocked(useDashboard).mockReturnValue({ data: null, loading: false, error: new Error('boom') })
    render(<Dashboard />)
    expect(screen.getByText(/live data unavailable/i)).toBeInTheDocument()
  })

  it('desktop: shows the outage chip when useDashboard errors', () => {
    vi.mocked(useIsDesktop).mockReturnValue(true)
    vi.mocked(useDashboard).mockReturnValue({ data: null, loading: false, error: new Error('boom') })
    render(<Dashboard />)
    expect(screen.getByText(/live data unavailable/i)).toBeInTheDocument()
  })

  it('mobile: no outage chip when useDashboard has no error', () => {
    vi.mocked(useIsDesktop).mockReturnValue(false)
    render(<Dashboard />)
    expect(screen.queryByText(/live data unavailable/i)).not.toBeInTheDocument()
  })

  it('desktop: no outage chip when useDashboard has no error', () => {
    vi.mocked(useIsDesktop).mockReturnValue(true)
    render(<Dashboard />)
    expect(screen.queryByText(/live data unavailable/i)).not.toBeInTheDocument()
  })
})
