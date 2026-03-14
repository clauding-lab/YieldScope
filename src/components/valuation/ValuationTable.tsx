import type { ValuationBenchmark } from '../../types'
import { formatYield } from '../../utils/formatters'

interface Props {
  benchmarks: ValuationBenchmark[]
}

export function ValuationTable({ benchmarks }: Props) {
  return (
    <div className="bg-surface rounded-xl p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-1">Valuation Benchmarks</h3>
      <p className="text-xs text-slate-500 mb-3">BB reval vs secondary market vs post-TDS yield</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 border-b border-slate-800">
              <th className="text-left py-2 pr-2">Tenor</th>
              <th className="text-right py-2 px-2">BB Reval</th>
              <th className="text-right py-2 px-2">Secondary</th>
              <th className="text-right py-2 px-2">Spread</th>
              <th className="text-right py-2 pl-2">Post-TDS</th>
            </tr>
          </thead>
          <tbody>
            {benchmarks.map((b) => (
              <tr key={b.tenor} className="border-b border-slate-800/50">
                <td className="py-2 pr-2 font-medium text-slate-300">{b.tenor}</td>
                <td className="py-2 px-2 text-right text-slate-200">{formatYield(b.bbRevalYield)}</td>
                <td className="py-2 px-2 text-right text-slate-200">{formatYield(b.secondaryMarketYield)}</td>
                <td className="py-2 px-2 text-right text-slate-400">{b.spread}bps</td>
                <td className={`py-2 pl-2 text-right font-medium ${
                  b.postTdsYield < b.bbRevalYield ? 'text-red-400' : 'text-green-400'
                }`}>
                  {formatYield(b.postTdsYield)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
