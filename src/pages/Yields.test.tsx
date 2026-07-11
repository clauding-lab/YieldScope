import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Task 11a: useYields() sets `error` on a failed live fetch, but the page
// previously destructured only `data` — swallowing it into a silent `—` +
// Demo badge. Pin the honest OutageChip in both directions.

vi.mock('../lib/hooks', () => ({ useIsDesktop: vi.fn(), useMediaQuery: vi.fn() }))
vi.mock('../hooks/useYields', () => ({ useYields: vi.fn() }))
vi.mock('../hooks/useAuctions', () => ({ useAuctions: vi.fn() }))
vi.mock('../lib/econdelta', () => ({ isLiveDataAvailable: vi.fn() }))

import { useIsDesktop } from '../lib/hooks'
import { useYields } from '../hooks/useYields'
import { useAuctions } from '../hooks/useAuctions'
import { isLiveDataAvailable } from '../lib/econdelta'
import Yields from './Yields'

beforeEach(() => {
  vi.mocked(useIsDesktop).mockReset()
  vi.mocked(isLiveDataAvailable).mockReturnValue(true)
  vi.mocked(useYields).mockReturnValue({ data: null, loading: false, error: null })
  vi.mocked(useAuctions).mockReturnValue({ data: null, loading: false, error: null })
})

describe('Yields · OutageChip surfaces a swallowed useYields error', () => {
  it('mobile: shows the outage chip when useYields errors', () => {
    vi.mocked(useIsDesktop).mockReturnValue(false)
    vi.mocked(useYields).mockReturnValue({ data: null, loading: false, error: new Error('boom') })
    render(<Yields />)
    expect(screen.getByText(/live data unavailable/i)).toBeInTheDocument()
  })

  it('desktop: shows the outage chip when useYields errors', () => {
    vi.mocked(useIsDesktop).mockReturnValue(true)
    vi.mocked(useYields).mockReturnValue({ data: null, loading: false, error: new Error('boom') })
    render(<Yields />)
    expect(screen.getByText(/live data unavailable/i)).toBeInTheDocument()
  })

  it('mobile: no outage chip when useYields has no error', () => {
    vi.mocked(useIsDesktop).mockReturnValue(false)
    render(<Yields />)
    expect(screen.queryByText(/live data unavailable/i)).not.toBeInTheDocument()
  })
})
