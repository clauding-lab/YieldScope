import { useState } from 'react'
import type { BondHolding, Tenor, BondClassification } from '../../types'
import { TENORS } from '../../types/yield'

interface Props {
  onAdd: (holding: Omit<BondHolding, 'id'>) => void
  onCancel: () => void
}

export function HoldingForm({ onAdd, onCancel }: Props) {
  const [tenor, setTenor] = useState<Tenor>('10Y')
  const [faceValue, setFaceValue] = useState('')
  const [couponRate, setCouponRate] = useState('')
  const [purchaseYield, setPurchaseYield] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [classification, setClassification] = useState<BondClassification>('HFT')

  // Calculate maturity date from tenor
  function getMaturityDate(t: Tenor, from: string): string {
    const d = new Date(from)
    const tenorMap: Record<string, number> = {
      '91D': 91, '182D': 182, '364D': 364,
      '2Y': 730, '5Y': 1825, '10Y': 3650, '15Y': 5475, '20Y': 7300,
    }
    d.setDate(d.getDate() + (tenorMap[t] || 3650))
    return d.toISOString().split('T')[0]
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!faceValue || !purchaseYield) return

    onAdd({
      tenor,
      faceValueCrore: parseFloat(faceValue),
      couponRate: parseFloat(couponRate) || 0,
      purchaseYield: parseFloat(purchaseYield),
      purchaseDate,
      maturityDate: getMaturityDate(tenor, purchaseDate),
      classification,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-slate-800 p-4 space-y-3">
      <h4 className="text-sm font-medium text-slate-300">Add Bond Holding</h4>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Tenor</label>
          <select
            value={tenor}
            onChange={(e) => setTenor(e.target.value as Tenor)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
          >
            {TENORS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-500 block mb-1">Classification</label>
          <select
            value={classification}
            onChange={(e) => setClassification(e.target.value as BondClassification)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="HFT">HFT</option>
            <option value="HTM">HTM</option>
            <option value="AFS">AFS</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-500 block mb-1">Face Value (Cr)</label>
          <input
            type="number"
            step="0.01"
            value={faceValue}
            onChange={(e) => setFaceValue(e.target.value)}
            placeholder="100"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
            required
          />
        </div>

        <div>
          <label className="text-xs text-slate-500 block mb-1">Coupon Rate (%)</label>
          <input
            type="number"
            step="0.01"
            value={couponRate}
            onChange={(e) => setCouponRate(e.target.value)}
            placeholder="8.50"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-500 block mb-1">Purchase Yield (%)</label>
          <input
            type="number"
            step="0.01"
            value={purchaseYield}
            onChange={(e) => setPurchaseYield(e.target.value)}
            placeholder="11.15"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
            required
          />
        </div>

        <div>
          <label className="text-xs text-slate-500 block mb-1">Purchase Date</label>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 py-2 bg-sky-600 text-white text-sm rounded-lg hover:bg-sky-500 transition-colors"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-slate-400 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
