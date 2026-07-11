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
    expect(screen.getByText(/no weekly briefing yet/i)).toBeInTheDocument()
    expect(screen.queryByText(/three forces are squeezing the short end/i)).not.toBeInTheDocument()
  })

  it('desktop: renders an empty-state note, not the fixture essay, when no briefing exists', () => {
    vi.mocked(useIsDesktop).mockReturnValue(true)
    render(<Dashboard />)
    expect(screen.getByText(/no weekly briefing yet/i)).toBeInTheDocument()
    expect(screen.queryByText(/three forces are squeezing the short end/i)).not.toBeInTheDocument()
  })
})
