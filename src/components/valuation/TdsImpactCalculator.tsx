import { useState, useMemo } from 'react'
import type { TdsRates } from '../../types'
import { formatYield } from '../../utils/formatters'

interface Props {
  tdsRates: TdsRates
}

export function TdsImpactCalculator({ tdsRates }: Props) {
  const [couponRate, setCouponRate] = useState(10.0)
  const [tenor, setTenor] = useState(10)

  const result = useMemo(() => {
    const tdsPct = tdsRates.tbondCouponTds / 100
    const postTdsCoupon = couponRate * (1 - tdsPct)
    const yieldLoss = couponRate - postTdsCoupon
    return {
      preTaxYield: couponRate,
      postTaxYield: postTdsCoupon,
      yieldLoss,
      effectiveTdsRate: tdsRates.tbondCouponTds,
    }
  }, [couponRate, tdsRates])

  return (
    <div className="bg-surface rounded-xl p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-1">TDS Impact Calculator</h3>
      <p className="text-xs text-slate-500 mb-3">Pre-tax vs post-tax effective yield</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Coupon Rate (%)</label>
          <input
            type="number"
            value={couponRate}
            onChange={(e) => setCouponRate(Number(e.target.value))}
            step={0.25}
            min={0}
            max={20}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Tenor (years)</label>
          <select
            value={tenor}
            onChange={(e) => setTenor(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
          >
            {[2, 5, 10, 15, 20].map((t) => (
              <option key={t} value={t}>{t}Y</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-900 rounded-lg p-3">
          <div className="text-xs text-slate-500">Pre-Tax</div>
          <div className="text-lg font-bold text-sky-400">{formatYield(result.preTaxYield)}</div>
        </div>
        <div className="bg-slate-900 rounded-lg p-3">
          <div className="text-xs text-slate-500">Post-Tax</div>
          <div className="text-lg font-bold text-green-400">{formatYield(result.postTaxYield)}</div>
        </div>
        <div className="bg-slate-900 rounded-lg p-3">
          <div className="text-xs text-slate-500">TDS Cost</div>
          <div className="text-lg font-bold text-red-400">-{formatYield(result.yieldLoss)}</div>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500 text-center">
        TDS on coupon: {tdsRates.tbondCouponTds}% | Capital gains: {tdsRates.tbondCapitalGainTds}% | Effective: {tdsRates.effectiveDate}
      </div>
    </div>
  )
}
