import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Review MEDIUM: the definitive "No scheduled auctions" claim may only render
// on a SUCCESSFUL fetch that returned zero future auctions. Loading renders
// nothing; a failed fetch renders an honest error line — never the empty-state.

vi.mock('../lib/hooks', () => ({ useIsDesktop: vi.fn(), useMediaQuery: vi.fn() }))
vi.mock('../hooks/useYields', () => ({ useYields: vi.fn() }))
vi.mock('../hooks/useAuctions', () => ({ useAuctions: vi.fn() }))
vi.mock('../lib/econdelta', () => ({ isLiveDataAvailable: vi.fn() }))

import { useIsDesktop } from '../lib/hooks'
import { useYields } from '../hooks/useYields'
import { useAuctions } from '../hooks/useAuctions'
import { isLiveDataAvailable } from '../lib/econdelta'
import Yields from './Yields'

function openAuctionsTab() {
  render(<Yields />)
  fireEvent.click(screen.getByText('Auctions'))
}

beforeEach(() => {
  vi.mocked(useIsDesktop).mockReturnValue(false)
  vi.mocked(isLiveDataAvailable).mockReturnValue(true)
  vi.mocked(useYields).mockReturnValue({ data: null, loading: false, error: null })
  vi.mocked(useAuctions).mockReset()
})

describe('Yields · Upcoming auctions — empty state vs loading vs error', () => {
  it('loading: renders neither the empty-state claim nor fixture dates', () => {
    vi.mocked(useAuctions).mockReturnValue({ data: null, loading: true, error: null })
    openAuctionsTab()
    expect(screen.queryByText('No scheduled auctions')).not.toBeInTheDocument()
    expect(screen.queryByText(/couldn't load/i)).not.toBeInTheDocument()
    expect(screen.queryByText('02 Jun')).not.toBeInTheDocument() // fixture date must not leak
  })

  it('error: renders an honest error line, never the definitive empty-state claim', () => {
    vi.mocked(useAuctions).mockReturnValue({ data: null, loading: false, error: new Error('fetch failed') })
    openAuctionsTab()
    expect(screen.getByText(/couldn't load the auction calendar/i)).toBeInTheDocument()
    expect(screen.queryByText('No scheduled auctions')).not.toBeInTheDocument()
    expect(screen.queryByText('02 Jun')).not.toBeInTheDocument()
  })

  it('successful fetch with zero future auctions: renders "No scheduled auctions"', () => {
    vi.mocked(useAuctions).mockReturnValue({ data: { results: [], upcoming: [] }, loading: false, error: null })
    openAuctionsTab()
    expect(screen.getByText('No scheduled auctions')).toBeInTheDocument()
    expect(screen.queryByText(/couldn't load/i)).not.toBeInTheDocument()
  })

  it('successful fetch with future auctions: renders them, no empty state, no error', () => {
    vi.mocked(useAuctions).mockReturnValue({
      data: {
        results: [],
        upcoming: [{ date: '12 Jul', day: 'Sun', tenor: '91D · 182D · 364D', size: '11 k Cr' }],
      },
      loading: false,
      error: null,
    })
    openAuctionsTab()
    expect(screen.getByText('12 Jul')).toBeInTheDocument()
    expect(screen.queryByText('No scheduled auctions')).not.toBeInTheDocument()
    expect(screen.queryByText(/couldn't load/i)).not.toBeInTheDocument()
  })
})
