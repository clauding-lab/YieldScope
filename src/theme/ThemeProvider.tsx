import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { DEFAULT_PALETTE, PALETTES, STORAGE_KEY, ThemeContext, nextPalette, type Palette } from './themeContext'

function readStoredPalette(): Palette {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'linen' || stored === 'ivory' || stored === 'slate') {
      return stored
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_PALETTE
}

function applyPaletteClass(p: Palette) {
  const cls = PALETTES.find(x => x.key === p)?.cls ?? ''
  document.documentElement.className = cls
}

const THEME_COLORS: Record<Palette, string> = {
  linen: '#F6F2EA',
  ivory: '#FAFAF7',
  slate: '#14171C',
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<Palette>(() => {
    if (typeof window === 'undefined') return DEFAULT_PALETTE
    return readStoredPalette()
  })

  useEffect(() => {
    applyPaletteClass(palette)
    try {
      localStorage.setItem(STORAGE_KEY, palette)
    } catch {
      // localStorage unavailable
    }

    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', THEME_COLORS[palette])
  }, [palette])

  const setPalette = useCallback((p: Palette) => {
    setPaletteState(p)
  }, [])

  const toggleTheme = useCallback(() => {
    setPaletteState(nextPalette)
  }, [])

  const isDark = palette === 'slate'

  return (
    <ThemeContext.Provider value={{ palette, setPalette, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}
