import type { Portfolio } from '../types'

const STORAGE_KEY = 'yieldscope:portfolios'

export function loadPortfolios(): Portfolio[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function savePortfolio(portfolio: Portfolio): void {
  const portfolios = loadPortfolios()
  const idx = portfolios.findIndex(p => p.id === portfolio.id)
  if (idx >= 0) {
    portfolios[idx] = portfolio
  } else {
    portfolios.push(portfolio)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolios))
}

export function deletePortfolio(id: string): void {
  const portfolios = loadPortfolios().filter(p => p.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolios))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
