import { useState, useMemo } from 'react'
import { useYieldData } from '../hooks/useYieldData'
import { usePortfolio } from '../hooks/usePortfolio'
import { calculatePortfolioMetrics } from '../utils/bondMath'
import { HoldingForm } from '../components/portfolio/HoldingForm'
import { PortfolioSummary } from '../components/portfolio/PortfolioSummary'
import { MTMTable } from '../components/portfolio/MTMTable'
import { ScenarioSlider } from '../components/portfolio/ScenarioSlider'

export default function SimulatorPage() {
  const { data: yieldData, isLoading } = useYieldData()
  const {
    portfolios, activePortfolio, activeId, setActiveId,
    createPortfolio, addHolding, removeHolding, deletePortfolio,
  } = usePortfolio()

  const [showForm, setShowForm] = useState(false)
  const [showNewPortfolio, setShowNewPortfolio] = useState(false)
  const [newName, setNewName] = useState('')

  const currentYields = useMemo(() => {
    if (!yieldData?.daily?.length) return {} as Record<string, number>
    return yieldData.daily[yieldData.daily.length - 1].yields as Record<string, number>
  }, [yieldData])

  const metrics = useMemo(() => {
    if (!activePortfolio?.holdings.length) return null
    return calculatePortfolioMetrics(activePortfolio.holdings, currentYields)
  }, [activePortfolio, currentYields])

  function handleCreatePortfolio() {
    if (!newName.trim()) return
    createPortfolio(newName.trim())
    setNewName('')
    setShowNewPortfolio(false)
  }

  if (isLoading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <div className="h-8 bg-slate-800 rounded animate-pulse" />
        <div className="h-48 bg-slate-800 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Portfolio Simulator</h1>
        <p className="text-sm text-slate-400">MTM calculator & scenario analysis</p>
      </div>

      {/* Portfolio selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {portfolios.map((p) => (
          <button
            key={p.id}
            onClick={() => setActiveId(p.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeId === p.id
                ? 'bg-sky-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {p.name}
          </button>
        ))}
        <button
          onClick={() => setShowNewPortfolio(true)}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
        >
          + New
        </button>
      </div>

      {/* New portfolio form */}
      {showNewPortfolio && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Portfolio name"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
            onKeyDown={(e) => e.key === 'Enter' && handleCreatePortfolio()}
            autoFocus
          />
          <button onClick={handleCreatePortfolio} className="px-4 py-2 bg-sky-600 text-white text-sm rounded-lg">
            Create
          </button>
          <button onClick={() => setShowNewPortfolio(false)} className="px-3 py-2 text-sm text-slate-500">
            Cancel
          </button>
        </div>
      )}

      {/* No portfolio state */}
      {!activePortfolio && !showNewPortfolio && (
        <div className="rounded-xl bg-slate-800 p-8 text-center">
          <p className="text-sm text-slate-400 mb-3">Create a portfolio to start tracking MTM</p>
          <button
            onClick={() => setShowNewPortfolio(true)}
            className="px-4 py-2 bg-sky-600 text-white text-sm rounded-lg hover:bg-sky-500 transition-colors"
          >
            Create Portfolio
          </button>
        </div>
      )}

      {/* Active portfolio content */}
      {activePortfolio && (
        <>
          {/* Summary */}
          {metrics && <PortfolioSummary metrics={metrics} />}

          {/* Scenario */}
          <ScenarioSlider holdings={activePortfolio.holdings} currentYields={currentYields} />

          {/* Holdings table */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300">
              Holdings ({activePortfolio.holdings.length})
            </h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-xs text-sky-400 hover:text-sky-300"
            >
              {showForm ? 'Cancel' : '+ Add Bond'}
            </button>
          </div>

          {showForm && (
            <HoldingForm
              onAdd={(h) => { addHolding(h); setShowForm(false) }}
              onCancel={() => setShowForm(false)}
            />
          )}

          <MTMTable
            holdings={activePortfolio.holdings}
            currentYields={currentYields}
            onRemove={removeHolding}
          />

          {/* Delete portfolio */}
          {portfolios.length > 0 && (
            <button
              onClick={() => {
                if (confirm(`Delete "${activePortfolio.name}"?`)) {
                  deletePortfolio(activePortfolio.id)
                }
              }}
              className="text-xs text-red-400/50 hover:text-red-400 transition-colors"
            >
              Delete this portfolio
            </button>
          )}
        </>
      )}
    </div>
  )
}
