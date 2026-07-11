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
  repoBorrowCr: 124600,
  repoBorrowHist: [118000, 124600],
  repoBorrowAsOf: '2026-07-11',
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

describe('Banking · mobile prudential list has LCR/NSFR fixture rows removed', () => {
  it('renders the "Capital adequacy" heading with only the CAR row — no fixture LCR/NSFR rows', () => {
    vi.mocked(useIsDesktop).mockReturnValue(false)
    vi.mocked(useBanking).mockReturnValue({ data: BASE, loading: false, error: null })
    render(<Banking />)
    expect(screen.getByText('Capital adequacy')).toBeInTheDocument()
    expect(screen.queryByText('Basel-III ratios')).not.toBeInTheDocument()
    // Exact row labels — the Top-10 heatmap's 'LCR %'/'NSFR %' table columns
    // are desktop-only (BankingDesktop) and don't render in mobile view, but
    // asserting the exact 'LCR'/'NSFR' row label (not the ' %' column header)
    // keeps this test correct even if that assumption ever changes.
    expect(screen.queryByText('LCR')).not.toBeInTheDocument()
    expect(screen.queryByText('NSFR')).not.toBeInTheDocument()
  })
})

describe('Banking · OutageChip surfaces a swallowed useBanking error', () => {
  it('mobile: shows the outage chip when useBanking errors', () => {
    vi.mocked(useIsDesktop).mockReturnValue(false)
    vi.mocked(useBanking).mockReturnValue({ data: null, loading: false, error: new Error('boom') })
    render(<Banking />)
    expect(screen.getByText(/live data unavailable/i)).toBeInTheDocument()
  })

  it('desktop: shows the outage chip when useBanking errors', () => {
    vi.mocked(useIsDesktop).mockReturnValue(true)
    vi.mocked(useBanking).mockReturnValue({ data: null, loading: false, error: new Error('boom') })
    render(<Banking />)
    expect(screen.getByText(/live data unavailable/i)).toBeInTheDocument()
  })
})

describe('Banking · demo panels removed', () => {
  it.each([[false], [true]])('desktop=%s: no fixture panels', (desktop) => {
    vi.mocked(useIsDesktop).mockReturnValue(desktop)
    vi.mocked(useBanking).mockReturnValue({ data: BASE, loading: false, error: null })
    render(<Banking />)
    expect(screen.queryByText(/NPL by segment/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Top 10 banks/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/NPL trajectory/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/deposits · by ownership/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/All 60 banks/i)).not.toBeInTheDocument() // dead Export/All-60 buttons went with the heatmap
    // a surviving live section still renders in BOTH views (the interbank-repo tile is present mobile + desktop):
    expect(screen.getAllByText(/Interbank repo · volume/i).length).toBeGreaterThanOrEqual(1)
  })
})
