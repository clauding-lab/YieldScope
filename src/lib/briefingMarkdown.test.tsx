import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BriefingBody } from './briefingMarkdown'

describe('BriefingBody', () => {
  it('renders sub-headings, bullets, bold, and paragraphs from markdown', () => {
    const md = [
      'A short lede sentence.',
      '',
      '## What moved',
      '- Call money +2.24 to 9.34',
      '- 91D cleared at 11.42',
      '',
      'Closing prose with **bold** emphasis.',
    ].join('\n')
    const { container } = render(<BriefingBody markdown={md} />)

    expect(screen.queryByText('What moved')).not.toBeNull()
    const items = container.querySelectorAll('li')
    expect(items.length).toBe(2)
    expect(items[0].textContent).toContain('Call money +2.24')
    expect(container.querySelector('strong')?.textContent).toBe('bold')
    // lede + closing prose => 2 paragraphs
    expect(container.querySelectorAll('p').length).toBe(2)
  })

  it('renders plain prose (no markdown markers) as a single paragraph', () => {
    const { container } = render(<BriefingBody markdown="Just one block of prose, no markers." />)
    expect(container.querySelectorAll('p').length).toBe(1)
    expect(container.querySelectorAll('li').length).toBe(0)
  })
})
