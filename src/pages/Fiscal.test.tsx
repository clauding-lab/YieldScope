import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('../lib/hooks', () => ({ useIsDesktop: vi.fn(), useMediaQuery: vi.fn() }))
vi.mock('../hooks/useFiscal', () => ({ useFiscal: vi.fn() }))

import { useIsDesktop } from '../lib/hooks'
import { useFiscal } from '../hooks/useFiscal'
import Fiscal from './Fiscal'

const BASE = {
  nbrFytdCr: 312400, nbrFytdAsOf: '2026-06-30',
  taxToGdp: 7.6, domesticBorrowingCr: 84500,
  debtGdpRatio: 41.2, debtGdpAsOf: '2025-12-31', debtGdpHist: [39.6, 40.4, 41.2],
  debtDomesticCr: 1195000, debtExternalCr: 949000, debtStockAsOf: '2026-03-31',
  imfEffSdrMn: 3300, imfEffAsOf: '2026-06-30', asOf: '2026-06-30',
}

beforeEach(() => {
  vi.mocked(useFiscal).mockReturnValue({ data: BASE, loading: false, error: null })
})

describe('Fiscal · live revenue, no W&M/ADP', () => {
  it.each([[false], [true]])('desktop=%s: renders live NBR FYTD, no Ways & Means, no ADP', (desktop) => {
    vi.mocked(useIsDesktop).mockReturnValue(desktop)
    render(<Fiscal />)
    expect(screen.getAllByText(/NBR revenue · FYTD/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('312.4').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText(/Ways & Means/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/W&M/)).not.toBeInTheDocument()
    expect(screen.queryByText(/ADP implementation/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Monetary financing active/i)).not.toBeInTheDocument()
  })
})

describe('Fiscal · OutageChip surfaces a swallowed useFiscal error', () => {
  it.each([[false], [true]])('desktop=%s: shows the outage chip when useFiscal errors', (desktop) => {
    vi.mocked(useIsDesktop).mockReturnValue(desktop)
    vi.mocked(useFiscal).mockReturnValue({ data: null, loading: false, error: new Error('boom') })
    render(<Fiscal />)
    expect(screen.getByText(/live data unavailable/i)).toBeInTheDocument()
  })
})
