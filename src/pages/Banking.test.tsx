import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Render-layer pin for the CRAR provenance qualifier (#25 review HIGH): the
// "BB QFSAR pre-shock" label must be keyed to the Sep-2025 print — a newer
// quarterly print renders with vintage only. A hardcoded qualifier string in
// the page would silently attach false provenance on the next data refresh.

vi.mock('../lib/hooks', () => ({ useIsDesktop: vi.fn(), useMediaQuery: vi.fn() }))
vi.mock('../hooks/useBanking', () => ({ useBanking: vi.fn() }))

import { useIsDesktop } from '../lib/hooks'
import { useBanking } from '../hooks/useBanking'
import type { BankingData } from '../hooks/useBanking'
import Banking from './Banking'

const BASE: BankingData = {
  nplRatio: 32.26,
  nplVintage: "Mar '26",
  nplStale: false,
  crar: 1.56,
  crarVintage: "Sep '25",
  crarStale: true,
  crarImplausible: false,
  crarQualifier: 'BB QFSAR pre-shock',
  nplHist: [30.1, 32.26],
  pvtCreditYoY: 6.03,
  pvtCreditYoYAsOf: '2026-05-30',
  cdRatio: 89.5,
  asOf: '2026-03-31',
}

beforeEach(() => {
  vi.mocked(useIsDesktop).mockReturnValue(false)
  vi.mocked(useBanking).mockReset()
})

describe('Banking · CAR provenance qualifier is print-specific', () => {
  it('the verified Sep-2025 print renders WITH "BB QFSAR pre-shock · Sep \'25" + stale chip', () => {
    vi.mocked(useBanking).mockReturnValue({ data: BASE, loading: false, error: null })
    render(<Banking />)
    expect(screen.getByText("BB QFSAR pre-shock · Sep '25")).toBeInTheDocument()
    expect(screen.getByText('1.56%')).toBeInTheDocument()
    expect(screen.getByText('stale')).toBeInTheDocument()
  })

  it('a newer quarterly print renders with vintage ONLY — never inherits the pre-shock label', () => {
    vi.mocked(useBanking).mockReturnValue({
      data: { ...BASE, crar: 9.8, crarVintage: "Dec '25", crarStale: false, crarQualifier: null },
      loading: false,
      error: null,
    })
    render(<Banking />)
    expect(screen.queryByText(/QFSAR/)).not.toBeInTheDocument()
    expect(screen.getByText("Dec '25")).toBeInTheDocument()
    expect(screen.getByText('9.8%')).toBeInTheDocument()
    expect(screen.queryByText('stale')).not.toBeInTheDocument()
  })
})
