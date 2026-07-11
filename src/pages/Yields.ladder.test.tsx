import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('../lib/hooks', () => ({ useIsDesktop: vi.fn(), useMediaQuery: vi.fn() }))
vi.mock('../hooks/useYields', () => ({ useYields: vi.fn() }))
vi.mock('../hooks/useAuctions', () => ({ useAuctions: vi.fn() }))
vi.mock('../lib/econdelta', () => ({ isLiveDataAvailable: vi.fn() }))

import { useIsDesktop } from '../lib/hooks'
import { useYields } from '../hooks/useYields'
import { useAuctions } from '../hooks/useAuctions'
import { isLiveDataAvailable } from '../lib/econdelta'
import Yields from './Yields'

const EMPTY = { '91D': [], '182D': [], '364D': [], '2Y': [], '5Y': [], '10Y': [], '20Y': [] }
const NULLS = { '91D': null, '182D': null, '364D': null, '2Y': null, '5Y': null, '10Y': null, '20Y': null }

beforeEach(() => {
  vi.mocked(useIsDesktop).mockReturnValue(false)
  vi.mocked(isLiveDataAvailable).mockReturnValue(true)
  vi.mocked(useAuctions).mockReturnValue({ data: null, loading: false, error: null })
})

describe('Yields · tenor ladder honesty', () => {
  it('renders live values without any demo badge on live rungs', () => {
    vi.mocked(useYields).mockReturnValue({
      loading: false, error: null,
      data: {
        yields: { ...NULLS, '91D': 9.33 },
        series: { ...EMPTY, '91D': [9.4, 9.38, 9.33] },
        tenorAsOf: { ...NULLS }, spread10Y_91D_bps: null, spread91D_SDF_bps: null, asOf: '2026-07-11',
      },
    })
    render(<Yields />)
    expect(screen.getByText('9.33')).toBeInTheDocument()
    // old fixture digits must be gone
    expect(screen.queryByText('11.42')).not.toBeInTheDocument()
    expect(screen.queryByText('12.31')).not.toBeInTheDocument() // 15Y fixture rung removed
  })

  it('renders — plus a demo badge on rungs with no live value', () => {
    vi.mocked(useYields).mockReturnValue({
      loading: false, error: null,
      data: { yields: { ...NULLS }, series: { ...EMPTY }, tenorAsOf: { ...NULLS }, spread10Y_91D_bps: null, spread91D_SDF_bps: null, asOf: null },
    })
    render(<Yields />)
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(7)
  })
})
