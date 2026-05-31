import { createContext, useContext } from 'react'

export type Palette = 'linen' | 'ivory' | 'slate'

export const STORAGE_KEY = 'yieldscope:palette'
export const DEFAULT_PALETTE: Palette = 'slate'

export const PALETTES: { key: Palette; name: string; cls: string; swatch: [string, string, string] }[] = [
  { key: 'linen', name: 'Linen', cls: '',            swatch: ['#F6F2EA', '#15181E', '#2B4537'] },
  { key: 'ivory', name: 'Ivory', cls: 'theme-ivory', swatch: ['#FAFAF7', '#0E1116', '#3A3F4E'] },
  { key: 'slate', name: 'Slate', cls: 'theme-slate', swatch: ['#14171C', '#ECE7D8', '#B8C3A8'] },
]

/**
 * Next palette in the cycle, wrapping around. Drives the header theme button,
 * which cycles through every entry in PALETTES (Linen -> Ivory -> Slate -> ...)
 * so all palettes are reachable without a separate picker UI.
 */
export function nextPalette(current: Palette): Palette {
  const keys = PALETTES.map(p => p.key)
  const i = keys.indexOf(current)
  return keys[(i + 1) % keys.length]
}

export interface ThemeContextValue {
  palette: Palette
  setPalette: (p: Palette) => void
  toggleTheme: () => void
  isDark: boolean
}

export const ThemeContext = createContext<ThemeContextValue>({
  palette: DEFAULT_PALETTE,
  setPalette: () => {},
  toggleTheme: () => {},
  isDark: true,
})

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
