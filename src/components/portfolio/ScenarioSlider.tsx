import { useState, useMemo } from 'react'
import type { BondHolding } from '../../types'
import { applyShock } from '../../utils/bondMath'
import { formatCrore } from '../../utils/formatters'

interface Props {
  holdings: BondHolding[]
  currentYields: Record<string, number>
}

export function ScenarioSlider({ holdings, currentYields }: Props) {
  const [shockBps, setShockBps] = useState(0)

  const scenario = useMemo(() => {
    if (holdings.length === 0) return null
    return applyShock(holdings, currentYields, shockBps)
  }, [holdings, currentYields, shockBps])

  if (holdings.length === 0) return null

  return (
    <div className="rounded-xl bg-slate-800 p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-3">Scenario Analysis</h3>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>-100bps</span>
          <span className={`font-medium ${
            shockBps === 0 ? 'text-slate-300' :
            shockBps > 0 ? 'text-red-400' : 'text-green-400'
          }`}>
            {shockBps > 0 ? '+' : ''}{shockBps}bps
          </span>
          <span>+100bps</span>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          step="5"
          value={shockBps}
          onChange={(e) => setShockBps(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
        />
      </div>

      {scenario && shockBps !== 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-500">New Market Value</p>
            <p className="text-base font-semibold text-slate-100">
              {formatCrore(scenario.newMarketValue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">P&L Impact</p>
            <p className={`text-base font-semibold ${scenario.plChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {scenario.plChange >= 0 ? '+' : ''}{formatCrore(scenario.plChange)}
              <span className="text-xs ml-1">({scenario.plChangePct.toFixed(2)}%)</span>
            </p>
          </div>
        </div>
      )}

      {scenario && shockBps !== 0 && scenario.perBondResults.length > 1 && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-xs text-slate-500 mb-2">Per-Bond Impact</p>
          <div className="space-y-1">
            {scenario.perBondResults.map((r) => {
              const holding = holdings.find(h => h.id === r.holdingId)
              if (!holding) return null
              return (
                <div key={r.holdingId} className="flex justify-between text-xs">
                  <span className="text-slate-400">{holding.tenor} ({holding.faceValueCrore} Cr)</span>
                  <span className={r.plChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {r.plChange >= 0 ? '+' : ''}{r.plChange.toFixed(2)} Cr
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
