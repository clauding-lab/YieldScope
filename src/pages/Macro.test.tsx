import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Task 11a: useMacro() sets `error` on a failed live fetch, but the page
// previously destructured only `data` — swallowing it into a silent `—` +
// Demo badge. Pin the honest OutageChip in both directions.

vi.mock('../lib/hooks', () => ({ useIsDesktop: vi.fn(), useMediaQuery: vi.fn() }))
vi.mock('../hooks/useMacro', () => ({ useMacro: vi.fn() }))

import { useIsDesktop } from '../lib/hooks'
import { useMacro } from '../hooks/useMacro'
import Macro from './Macro'

beforeEach(() => {
  vi.mocked(useIsDesktop).mockReset()
  vi.mocked(useMacro).mockReturnValue({ data: null, loading: false, error: null })
})

describe('Macro · OutageChip surfaces a swallowed useMacro error', () => {
  it('mobile: shows the outage chip when useMacro errors', () => {
    vi.mocked(useIsDesktop).mockReturnValue(false)
    vi.mocked(useMacro).mockReturnValue({ data: null, loading: false, error: new Error('boom') })
    render(<Macro />)
    expect(screen.getByText(/live data unavailable/i)).toBeInTheDocument()
  })

  it('desktop: shows the outage chip when useMacro errors', () => {
    vi.mocked(useIsDesktop).mockReturnValue(true)
    vi.mocked(useMacro).mockReturnValue({ data: null, loading: false, error: new Error('boom') })
    render(<Macro />)
    expect(screen.getByText(/live data unavailable/i)).toBeInTheDocument()
  })

  it('mobile: no outage chip when useMacro has no error', () => {
    vi.mocked(useIsDesktop).mockReturnValue(false)
    render(<Macro />)
    expect(screen.queryByText(/live data unavailable/i)).not.toBeInTheDocument()
  })
})
