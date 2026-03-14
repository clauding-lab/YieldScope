import type { BondHolding } from '../../types'
import { calculateMTM, calculateModifiedDuration, yearsToMaturity } from '../../utils/bondMath'

interface Props {
  holdings: BondHolding[]
  currentYields: Record<string, number>
  onRemove: (id: string) => void
}

export function MTMTable({ holdings, currentYields, onRemove }: Props) {
  if (holdings.length === 0) {
    return (
      <div className="rounded-xl bg-slate-800 p-6 text-center">
        <p className="text-sm text-slate-500">No holdings yet. Add bonds to see MTM.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 border-b border-slate-700">
              <th className="text-left px-3 py-2 font-medium">Tenor</th>
              <th className="text-right px-3 py-2 font-medium">Face (Cr)</th>
              <th className="text-right px-3 py-2 font-medium">Yield</th>
              <th className="text-right px-3 py-2 font-medium">MV (Cr)</th>
              <th className="text-right px-3 py-2 font-medium">P&L</th>
              <th className="text-right px-3 py-2 font-medium">Dur.</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => {
              const yld = currentYields[h.tenor]
              if (yld === undefined) return null

              const mtm = calculateMTM(h, yld)
              const ytm = yearsToMaturity(h.maturityDate)
              const modDur = calculateModifiedDuration(h.couponRate / 100, yld / 100, ytm)

              return (
                <tr key={h.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="px-3 py-2">
                    <span className="text-slate-200 font-medium">{h.tenor}</span>
                    <span className="text-slate-500 ml-1">{h.classification}</span>
                  </td>
                  <td className="text-right px-3 py-2 text-slate-300">{h.faceValueCrore.toFixed(1)}</td>
                  <td className="text-right px-3 py-2 text-slate-300">{h.purchaseYield}%</td>
                  <td className="text-right px-3 py-2 text-slate-200">{mtm.marketValue.toFixed(2)}</td>
                  <td className={`text-right px-3 py-2 ${mtm.unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {mtm.unrealizedPL >= 0 ? '+' : ''}{mtm.unrealizedPL.toFixed(2)}
                  </td>
                  <td className="text-right px-3 py-2 text-slate-300">{modDur.toFixed(2)}</td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => onRemove(h.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors"
                      title="Remove"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
