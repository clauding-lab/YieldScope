import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('../../hooks/useYields', () => ({ useYields: vi.fn() }))
vi.mock('../../lib/econdelta', () => ({ isLiveDataAvailable: vi.fn() }))

import { useYields } from '../../hooks/useYields'
import { isLiveDataAvailable } from '../../lib/econdelta'
import { YieldCurve } from './YieldCurve'

const LIVE_DATA = {
  yields: { '91D': 9.33, '182D': 9.57, '364D': 9.63, '2Y': 10.23, '5Y': 10.37, '10Y': 10.24, '20Y': 11.23 },
  series: { '91D': [], '182D': [], '364D': [], '2Y': [], '5Y': [], '10Y': [], '20Y': [] },
  tenorAsOf: {
    '91D': '2026-07-09', '182D': '2026-07-09', '364D': '2026-07-09',
    '2Y': '2026-04-01', '5Y': '2026-07-09', '10Y': '2026-07-09', '20Y': '2026-04-01',
  },
  spread10Y_91D_bps: 91,
  asOf: '2026-07-09',
}

beforeEach(() => {
  vi.mocked(useYields).mockReset()
  vi.mocked(isLiveDataAvailable).mockReset()
})

describe('YieldCurve — live mode (Option A: 11-tenor axis, honest gaps)', () => {
  beforeEach(() => {
    vi.mocked(isLiveDataAvailable).mockReturnValue(true)
    vi.mocked(useYields).mockReturnValue({ data: LIVE_DATA, loading: false, error: null })
  })

  it('plots exactly the 7 live points (no dot on a gapped tenor)', () => {
    const { container } = render(<YieldCurve />)
    expect(container.querySelectorAll('circle')).toHaveLength(7)
  })

  it('keeps all 11 axis labels, including the gapped tenors', () => {
    const { container } = render(<YieldCurve />)
    const labels = [...container.querySelectorAll('text')].map(t => t.textContent)
    for (const t of ['7D', '14D', '28D', '91D', '15Y', '20Y']) {
      expect(labels).toContain(t)
    }
  })

  it('draws the 10Y→20Y span as a dashed bridge, not a solid measured segment', () => {
    const { container } = render(<YieldCurve />)
    const bridged = container.querySelectorAll('path[data-bridged]')
    expect(bridged).toHaveLength(1)
    expect(bridged[0].getAttribute('stroke-dasharray')).toBeTruthy()
    // 6 segments total: 5 solid + 1 bridged
    const allSegs = [...container.querySelectorAll('path')].filter(p => p.getAttribute('stroke') === 'var(--accent)')
    expect(allSegs).toHaveLength(6)
  })

  it('shows the live coverage note with gaps + monthly vintage, and NO Demo badge', () => {
    render(<YieldCurve />)
    expect(screen.getByText(/Live · 7 of 11 tenors/)).toBeInTheDocument()
    expect(screen.getByText(/no print: 7D · 14D · 28D · 15Y/)).toBeInTheDocument()
    expect(screen.getByText(/2Y\/20Y Apr '26/)).toBeInTheDocument()
    expect(screen.queryByText(/demo data/i)).not.toBeInTheDocument()
  })

  it('shows no fixture overlay legend in live mode', () => {
    render(<YieldCurve />)
    expect(screen.queryByText('1 year ago')).not.toBeInTheDocument()
  })
})

describe('YieldCurve — fixture mode (no credentials)', () => {
  beforeEach(() => {
    vi.mocked(isLiveDataAvailable).mockReturnValue(false)
    vi.mocked(useYields).mockReturnValue({ data: null, loading: false, error: null })
  })

  it('self-badges with Demo data and keeps the overlay legend', () => {
    render(<YieldCurve />)
    expect(screen.getByText(/demo data/i)).toBeInTheDocument()
    expect(screen.getByText('1 year ago')).toBeInTheDocument()
    expect(screen.queryByText(/Live · /)).not.toBeInTheDocument()
  })
})

describe('YieldCurve — skeleton (credentials present, fetch pending)', () => {
  it('renders neither fixture series nor Demo badge while loading', () => {
    vi.mocked(isLiveDataAvailable).mockReturnValue(true)
    vi.mocked(useYields).mockReturnValue({ data: null, loading: true, error: null })
    const { container } = render(<YieldCurve />)
    expect(screen.queryByText(/demo data/i)).not.toBeInTheDocument()
    expect(container.querySelectorAll('circle')).toHaveLength(0)
    const seriesPaths = [...container.querySelectorAll('path')]
    expect(seriesPaths).toHaveLength(0)
  })
})

describe('YieldCurve — DB-empty fallback (credentials present, fetch settled, <2 live tenors)', () => {
  it('falls back to the badged fixture curve WITHOUT the fetch-error note (settled emptiness is not an error)', () => {
    vi.mocked(isLiveDataAvailable).mockReturnValue(true)
    vi.mocked(useYields).mockReturnValue({
      data: { ...LIVE_DATA, yields: { '91D': null, '182D': null, '364D': null, '2Y': null, '5Y': null, '10Y': null, '20Y': null } },
      loading: false,
      error: null,
    })
    render(<YieldCurve />)
    expect(screen.getByText(/demo data/i)).toBeInTheDocument()
    expect(screen.queryByText(/live fetch failed/i)).not.toBeInTheDocument()
  })
})

describe('YieldCurve — fetch error (credentials present, fetch rejected)', () => {
  it('badges the fixture AND says the live fetch failed — error is not presented as settled emptiness', () => {
    vi.mocked(isLiveDataAvailable).mockReturnValue(true)
    vi.mocked(useYields).mockReturnValue({ data: null, loading: false, error: new Error('network') })
    render(<YieldCurve />)
    expect(screen.getByText('Demo data')).toBeInTheDocument() // exact chip text (the error note also contains "demo data")
    expect(screen.getByText(/live fetch failed — showing demo data/i)).toBeInTheDocument()
  })

  it('no-credentials fixture mode does NOT show the fetch-error note', () => {
    vi.mocked(isLiveDataAvailable).mockReturnValue(false)
    vi.mocked(useYields).mockReturnValue({ data: null, loading: false, error: null })
    render(<YieldCurve />)
    expect(screen.getByText(/demo data/i)).toBeInTheDocument()
    expect(screen.queryByText(/live fetch failed/i)).not.toBeInTheDocument()
  })
})
