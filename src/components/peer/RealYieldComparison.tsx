import type { PeerComparison } from '../../types'
import { formatYield } from '../../utils/formatters'

interface Props {
  comparisons: PeerComparison[]
}

export function RealYieldComparison({ comparisons }: Props) {
  return (
    <div className="bg-surface rounded-xl p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-1">Real Yield Comparison</h3>
      <p className="text-xs text-slate-500 mb-3">Nominal yield minus CPI (inflation-adjusted)</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 border-b border-slate-800">
              <th className="text-left py-2 pr-2">Tenor</th>
              <th className="text-right py-2 px-2">
                <span className="text-sky-400">BD</span>
              </th>
              <th className="text-right py-2 px-2">
                <span className="text-amber-400">IN</span>
              </th>
              <th className="text-right py-2 pl-2">
                <span className="text-green-400">PK</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((c) => (
              <tr key={c.tenor} className="border-b border-slate-800/50">
                <td className="py-2 pr-2 font-medium text-slate-300">{c.tenor}</td>
                <td className={`py-2 px-2 text-right font-medium ${
                  c.bdRealYield >= 0 ? 'text-sky-400' : 'text-red-400'
                }`}>
                  {formatYield(c.bdRealYield)}
                </td>
                <td className={`py-2 px-2 text-right font-medium ${
                  c.inRealYield != null && c.inRealYield >= 0 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {c.inRealYield != null ? formatYield(c.inRealYield) : '—'}
                </td>
                <td className={`py-2 pl-2 text-right font-medium ${
                  c.pkRealYield != null && c.pkRealYield >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {c.pkRealYield != null ? formatYield(c.pkRealYield) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
