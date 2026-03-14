import type { PeerYieldCurve } from '../../types'
import { formatYield } from '../../utils/formatters'

interface Props {
  curves: PeerYieldCurve[]
}

export function FxAdjustedReturns({ curves }: Props) {
  const bd = curves.find((c) => c.country === 'BD')
  const india = curves.find((c) => c.country === 'IN')
  const pk = curves.find((c) => c.country === 'PK')

  if (!bd) return null

  const countries = [
    { data: bd, color: 'text-sky-400', bgColor: 'bg-sky-500' },
    ...(india ? [{ data: india, color: 'text-amber-400', bgColor: 'bg-amber-500' }] : []),
    ...(pk ? [{ data: pk, color: 'text-green-400', bgColor: 'bg-green-500' }] : []),
  ]

  return (
    <div className="bg-surface rounded-xl p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-1">Country Snapshot</h3>
      <p className="text-xs text-slate-500 mb-3">Policy rate, inflation, FX & 10Y yield</p>
      <div className="space-y-3">
        {countries.map(({ data: c, color, bgColor }) => {
          const tenYield = c.yields['10Y'] ?? 0
          const realYield10Y = tenYield - c.cpiYoY
          const spreadToPolicy = Math.round((tenYield - c.policyRate) * 100)

          return (
            <div key={c.country} className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${bgColor}`} />
                <span className={`text-sm font-medium ${color}`}>{c.countryName}</span>
                <span className="text-[10px] text-slate-500">{c.currency}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-slate-500">Policy</div>
                  <div className="text-xs font-bold text-slate-200">{formatYield(c.policyRate)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">CPI</div>
                  <div className="text-xs font-bold text-slate-200">{formatYield(c.cpiYoY)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">10Y Real</div>
                  <div className={`text-xs font-bold ${realYield10Y >= 0 ? color : 'text-red-400'}`}>
                    {formatYield(realYield10Y)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">USD/FX</div>
                  <div className="text-xs font-bold text-slate-200">{c.fxRateToUsd.toFixed(1)}</div>
                </div>
              </div>
              <div className="mt-1 text-[10px] text-slate-500 text-center">
                10Y spread to policy: {spreadToPolicy > 0 ? '+' : ''}{spreadToPolicy}bps
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
