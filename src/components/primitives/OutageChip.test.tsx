import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { OutageChip } from './OutageChip'

describe('OutageChip', () => {
  it('renders the live-data-unavailable message', () => {
    render(<OutageChip />)
    expect(screen.getByText(/live data unavailable/i)).toBeInTheDocument()
  })
})
