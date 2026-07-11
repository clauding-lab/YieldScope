import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Render-layer pin for the 100x label fix (F1 / review MEDIUM): the exact
// regression — "k Cr" instead of "lakh Cr", or thresholds on the old
// thousand-crore scale — must fail HERE, not just in the hook tests.

vi.mock('../lib/hooks', () => ({ useIsDesktop: vi.fn(), useMediaQuery: vi.fn() }))
vi.mock('../hooks/useLiquidity', () => ({ useLiquidity: vi.fn() }))

import { useIsDesktop } from '../lib/hooks'
import { useLiquidity } from '../hooks/useLiquidity'
import Liquidity from './Liquidity'

const LIQUIDITY_DATA = {
  callMoneyRate: 9.68,
  callSpark: [9.1, 9.68],
  excessLiquidityLakhCr: 3.86,
  // 8 values (the desktop chart maps 8 week slots): one below the 2.0 warn
  // threshold, seven above — pins the bar colors.
  excessHistLakhCr: [1.8, 3.1, 3.2, 3.4, 3.5, 3.8, 3.85, 3.86],
  m2YoY: 10.5,
  m2YoYAsOf: '2026-02-01',
  m2Hist: [9.4, 10.5],
  policyRepo: 10,
  policySdf: 7.5,
  policySlf: 11.5,
  corridorCoherent: true,
  crrMaintainedPct: 5.12,
  slrMaintainedPct: 18.81,
  crrAsOf: '2026-07-09',
  slrAsOf: '2026-07-09',
  asOf: '2026-07-09',
}

beforeEach(() => {
  vi.mocked(useIsDesktop).mockReset()
  vi.mocked(useLiquidity).mockReturnValue({ data: LIQUIDITY_DATA, loading: false, error: null })
})

describe('Liquidity — excess-liquidity render layer (100x label regression pin)', () => {
  it('mobile: renders "3.9" with the unit caption "lakh Cr" — never "k Cr"', () => {
    vi.mocked(useIsDesktop).mockReturnValue(false)
    render(<Liquidity />)
    expect(screen.getByText('3.9')).toBeInTheDocument()
    expect(screen.getByText('lakh Cr')).toBeInTheDocument()
    expect(screen.queryByText(/\bk Cr\b/)).not.toBeInTheDocument()
  })

  it('desktop: renders "lakh Cr", the 1.5 lakh-crore floor line, and warn color below the 2.0 threshold', () => {
    vi.mocked(useIsDesktop).mockReturnValue(true)
    const { container } = render(<Liquidity />)
    expect(screen.getByText('lakh Cr')).toBeInTheDocument()
    expect(screen.queryByText(/\bk Cr\b/)).not.toBeInTheDocument()

    // The BarChart threshold line is labelled with the floor constant (1.5).
    const svgTexts = [...container.querySelectorAll('svg text')].map(t => t.textContent)
    expect(svgTexts).toContain('1.5')

    // Bars: the 1.8 print (< 2.0 warn) renders warn; the other seven render accent.
    const bars = [...container.querySelectorAll('svg rect')].filter(r =>
      ['var(--warn)', 'var(--accent)'].includes(r.getAttribute('fill') ?? ''))
    expect(bars.filter(b => b.getAttribute('fill') === 'var(--warn)')).toHaveLength(1)
    expect(bars.filter(b => b.getAttribute('fill') === 'var(--accent)')).toHaveLength(7)
  })

  it('desktop: intraday heatmap is gone and no fixture m2 history renders without live data', () => {
    vi.mocked(useIsDesktop).mockReturnValue(true)
    vi.mocked(useLiquidity).mockReturnValue({ data: null, loading: false, error: null })
    render(<Liquidity />)
    expect(screen.queryByText(/intraday this week/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/pressure builds at the open/i)).not.toBeInTheDocument()

    // m2 chart is live-only: with no live data the M2 section must contain NO chart svg.
    // Scoped to the "Money supply · M2 YoY" panel (a page-wide svg count is fragile and
    // not specific to the m2 claim this test's name makes).
    const m2Eyebrow = screen.getByText('Money supply · M2 YoY')      // desktop eyebrow (unique in desktop mode)
    const m2Section = m2Eyebrow.parentElement?.parentElement as HTMLElement  // eyebrow → header row → panel cell
    expect(m2Section).toBeTruthy()
    expect(m2Section.querySelector('svg')).toBeNull()
  })
})

describe('Liquidity · OutageChip surfaces a swallowed useLiquidity error', () => {
  it('mobile: shows the outage chip when useLiquidity errors', () => {
    vi.mocked(useIsDesktop).mockReturnValue(false)
    vi.mocked(useLiquidity).mockReturnValue({ data: null, loading: false, error: new Error('boom') })
    render(<Liquidity />)
    expect(screen.getByText(/live data unavailable/i)).toBeInTheDocument()
  })

  it('desktop: shows the outage chip when useLiquidity errors', () => {
    vi.mocked(useIsDesktop).mockReturnValue(true)
    vi.mocked(useLiquidity).mockReturnValue({ data: null, loading: false, error: new Error('boom') })
    render(<Liquidity />)
    expect(screen.getByText(/live data unavailable/i)).toBeInTheDocument()
  })

  it('mobile: no outage chip when useLiquidity has no error', () => {
    vi.mocked(useIsDesktop).mockReturnValue(false)
    render(<Liquidity />)
    expect(screen.queryByText(/live data unavailable/i)).not.toBeInTheDocument()
  })
})
