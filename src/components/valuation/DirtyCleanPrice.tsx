import type { ValuationBenchmark } from '../../types'

interface Props {
  benchmarks: ValuationBenchmark[]
}

export function DirtyCleanPrice({ benchmarks }: Props) {
  return (
    <div className="bg-surface rounded-xl p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-1">Dirty/Clean Price</h3>
      <p className="text-xs text-slate-500 mb-3">Price breakdown with accrued interest</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 border-b border-slate-800">
              <th className="text-left py-2 pr-2">Tenor</th>
              <th className="text-right py-2 px-2">Dirty</th>
              <th className="text-right py-2 px-2">Clean</th>
              <th className="text-right py-2 px-2">Accrued</th>
              <th className="text-right py-2 pl-2">Next Coupon</th>
            </tr>
          </thead>
          <tbody>
            {benchmarks.map((b) => (
              <tr key={b.tenor} className="border-b border-slate-800/50">
                <td className="py-2 pr-2 font-medium text-slate-300">{b.tenor}</td>
                <td className="py-2 px-2 text-right text-slate-200">{b.dirtyPrice.toFixed(2)}</td>
                <td className="py-2 px-2 text-right text-slate-200">{b.cleanPrice.toFixed(2)}</td>
                <td className="py-2 px-2 text-right text-amber-400">{b.accruedInterest.toFixed(2)}</td>
                <td className="py-2 pl-2 text-right text-slate-400">
                  {new Date(b.nextCouponDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
