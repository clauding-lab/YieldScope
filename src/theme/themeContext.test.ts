import { describe, it, expect } from 'vitest'
import { PALETTES, nextPalette, DEFAULT_PALETTE } from './themeContext'

describe('PALETTES', () => {
  it('contains exactly linen, ivory, slate (moss removed)', () => {
    expect(PALETTES.map(p => p.key)).toEqual(['linen', 'ivory', 'slate'])
  })

  it('keeps Slate as the default palette', () => {
    expect(DEFAULT_PALETTE).toBe('slate')
  })
})

describe('nextPalette', () => {
  it('cycles through each palette and wraps around', () => {
    expect(nextPalette('linen')).toBe('ivory')
    expect(nextPalette('ivory')).toBe('slate')
    expect(nextPalette('slate')).toBe('linen')
  })

  it('visits all three palettes in three steps from any start', () => {
    let p = DEFAULT_PALETTE
    const visited = new Set<string>()
    for (let i = 0; i < 3; i++) {
      p = nextPalette(p)
      visited.add(p)
    }
    expect(visited).toEqual(new Set(['linen', 'ivory', 'slate']))
  })
})
