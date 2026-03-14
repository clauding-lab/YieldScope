import { useState, useEffect, useCallback } from 'react'
import type { Portfolio, BondHolding } from '../types'
import { loadPortfolios, savePortfolio, deletePortfolio as deleteFromStore, generateId } from '../services/portfolioStore'

export function usePortfolio() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const loaded = loadPortfolios()
    setPortfolios(loaded)
    if (loaded.length > 0 && !activeId) {
      setActiveId(loaded[0].id)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const activePortfolio = portfolios.find(p => p.id === activeId) ?? null

  const createPortfolio = useCallback((name: string) => {
    const portfolio: Portfolio = {
      id: generateId(),
      name,
      holdings: [],
      createdAt: new Date().toISOString(),
    }
    savePortfolio(portfolio)
    setPortfolios(prev => [...prev, portfolio])
    setActiveId(portfolio.id)
    return portfolio
  }, [])

  const addHolding = useCallback((holding: Omit<BondHolding, 'id'>) => {
    if (!activePortfolio) return
    const newHolding: BondHolding = { ...holding, id: generateId() }
    const updated = {
      ...activePortfolio,
      holdings: [...activePortfolio.holdings, newHolding],
    }
    savePortfolio(updated)
    setPortfolios(prev => prev.map(p => p.id === updated.id ? updated : p))
  }, [activePortfolio])

  const removeHolding = useCallback((holdingId: string) => {
    if (!activePortfolio) return
    const updated = {
      ...activePortfolio,
      holdings: activePortfolio.holdings.filter(h => h.id !== holdingId),
    }
    savePortfolio(updated)
    setPortfolios(prev => prev.map(p => p.id === updated.id ? updated : p))
  }, [activePortfolio])

  const deletePortfolio = useCallback((id: string) => {
    deleteFromStore(id)
    setPortfolios(prev => {
      const next = prev.filter(p => p.id !== id)
      if (activeId === id) {
        setActiveId(next.length > 0 ? next[0].id : null)
      }
      return next
    })
  }, [activeId])

  return {
    portfolios,
    activePortfolio,
    activeId,
    setActiveId,
    createPortfolio,
    addHolding,
    removeHolding,
    deletePortfolio,
  }
}
