import { useState } from 'react'
import { DataTimestamp } from '../ui/DataTimestamp'

interface DataField {
  key: string
  label: string
  type: 'number' | 'text'
  unit?: string
  placeholder?: string
}

interface DataCategory {
  id: string
  title: string
  description: string
  frequency: 'daily' | 'weekly' | 'monthly'
  fields: DataField[]
  storageKey: string
}

const DATA_CATEGORIES: DataCategory[] = [
  {
    id: 'inflation',
    title: 'CPI Inflation',
    description: 'Monthly CPI from BBS release',
    frequency: 'monthly',
    storageKey: 'yieldscope:admin:inflation',
    fields: [
      { key: 'cpiHeadline', label: 'Headline CPI (YoY %)', type: 'number', placeholder: '9.13' },
      { key: 'cpiFood', label: 'Food CPI (YoY %)', type: 'number', placeholder: '9.30' },
      { key: 'cpiNonFood', label: 'Non-Food CPI (YoY %)', type: 'number', placeholder: '8.85' },
      { key: 'month', label: 'Month (YYYY-MM)', type: 'text', placeholder: '2026-02' },
    ],
  },
  {
    id: 'revenue',
    title: 'Revenue Collection',
    description: 'NBR/MoF tax revenue data',
    frequency: 'monthly',
    storageKey: 'yieldscope:admin:revenue',
    fields: [
      { key: 'ytdCollected', label: 'YTD Revenue (BDT Cr)', type: 'number', placeholder: '223000' },
      { key: 'budgetTarget', label: 'Full-Year Target (BDT Cr)', type: 'number', placeholder: '480000' },
      { key: 'collectionRatio', label: 'Collection Ratio (%)', type: 'number', placeholder: '78' },
      { key: 'asOfMonth', label: 'Data Through (YYYY-MM)', type: 'text', placeholder: '2026-01' },
    ],
  },
  {
    id: 'adp',
    title: 'ADP Implementation',
    description: 'IMED quarterly development expenditure',
    frequency: 'monthly',
    storageKey: 'yieldscope:admin:adp',
    fields: [
      { key: 'allocationCr', label: 'ADP Allocation (BDT Cr)', type: 'number', placeholder: '265000' },
      { key: 'implementedCr', label: 'ADP Implemented (BDT Cr)', type: 'number', placeholder: '56100' },
      { key: 'implementationRate', label: 'Implementation Rate (%)', type: 'number', placeholder: '21.18' },
      { key: 'fiscalYear', label: 'Fiscal Year', type: 'text', placeholder: 'FY26' },
    ],
  },
  {
    id: 'debt',
    title: 'Public Debt',
    description: 'MoF Debt Bulletin quarterly data',
    frequency: 'monthly',
    storageKey: 'yieldscope:admin:debt',
    fields: [
      { key: 'totalDebtLakhCr', label: 'Total Public Debt (BDT Lakh Cr)', type: 'number', placeholder: '21.5' },
      { key: 'domesticDebtLakhCr', label: 'Domestic Debt (BDT Lakh Cr)', type: 'number', placeholder: '14.2' },
      { key: 'externalDebtLakhCr', label: 'External Debt (BDT Lakh Cr)', type: 'number', placeholder: '7.3' },
      { key: 'debtToGdpPct', label: 'Debt-to-GDP (%)', type: 'number', placeholder: '38.5' },
      { key: 'interestToRevenuePct', label: 'Interest/Revenue (%)', type: 'number', placeholder: '20' },
      { key: 'asOfDate', label: 'Data As Of (YYYY-MM)', type: 'text', placeholder: '2025-12' },
    ],
  },
  {
    id: 'policy',
    title: 'Policy Rate Changes',
    description: 'BB MPS rate decisions',
    frequency: 'monthly',
    storageKey: 'yieldscope:admin:policy',
    fields: [
      { key: 'repoRate', label: 'Repo Rate (%)', type: 'number', placeholder: '8.50' },
      { key: 'sdfRate', label: 'SDF/Reverse Repo Rate (%)', type: 'number', placeholder: '7.00' },
      { key: 'bankRate', label: 'Bank Rate (%)', type: 'number', placeholder: '4.00' },
      { key: 'crrRate', label: 'CRR (%)', type: 'number', placeholder: '4.00' },
      { key: 'effectiveDate', label: 'Effective Date (YYYY-MM-DD)', type: 'text', placeholder: '2026-01-22' },
    ],
  },
  {
    id: 'deposit_rates',
    title: 'Competitor Deposit Rates',
    description: 'Bank/NBFI term deposit rates',
    frequency: 'monthly',
    storageKey: 'yieldscope:admin:deposit_rates',
    fields: [
      { key: 'institutionName', label: 'Institution Name', type: 'text', placeholder: 'BRAC Bank' },
      { key: 'rate3m', label: '3-Month Rate (%)', type: 'number', placeholder: '8.50' },
      { key: 'rate6m', label: '6-Month Rate (%)', type: 'number', placeholder: '9.00' },
      { key: 'rate1y', label: '1-Year Rate (%)', type: 'number', placeholder: '9.50' },
      { key: 'asOfDate', label: 'As Of (YYYY-MM-DD)', type: 'text', placeholder: '2026-03-01' },
    ],
  },
]

interface StoredEntry {
  values: Record<string, string>
  savedAt: string
  savedBy: string
}

export function AdminDataEntry() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  return (
    <div className="rounded-xl bg-slate-800 p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-1">Admin Data Entry</h3>
      <p className="text-xs text-slate-500 mb-4">
        Enter data from BB/BBS publications that cannot be auto-scraped. Each entry is timestamped.
      </p>

      <div className="space-y-2">
        {DATA_CATEGORIES.map((cat) => (
          <CategoryPanel
            key={cat.id}
            category={cat}
            isOpen={activeCategory === cat.id}
            onToggle={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
          />
        ))}
      </div>
    </div>
  )
}

function CategoryPanel({
  category,
  isOpen,
  onToggle,
}: {
  category: DataCategory
  isOpen: boolean
  onToggle: () => void
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(category.storageKey)
      if (stored) {
        const parsed: StoredEntry = JSON.parse(stored)
        return parsed.values
      }
    } catch { /* ignore */ }
    return {}
  })
  const [saved, setSaved] = useState(false)

  const storedEntry = (() => {
    try {
      const stored = localStorage.getItem(category.storageKey)
      if (stored) return JSON.parse(stored) as StoredEntry
    } catch { /* ignore */ }
    return null
  })()

  function handleSave() {
    const entry: StoredEntry = {
      values,
      savedAt: new Date().toISOString(),
      savedBy: 'admin',
    }
    localStorage.setItem(category.storageKey, JSON.stringify(entry))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="rounded-lg border border-slate-700/50 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-700/30 transition-colors"
      >
        <div>
          <span className="text-xs font-medium text-slate-300">{category.title}</span>
          <span className="text-[10px] text-slate-500 ml-2">({category.frequency})</span>
        </div>
        <div className="flex items-center gap-2">
          {storedEntry && (
            <DataTimestamp lastUpdated={storedEntry.savedAt} frequency={category.frequency} compact />
          )}
          <svg
            className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="p-3 pt-0 space-y-3">
          <p className="text-[10px] text-slate-500">{category.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {category.fields.map((field) => (
              <div key={field.key}>
                <label className="text-[10px] text-slate-400 block mb-0.5">{field.label}</label>
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  step={field.type === 'number' ? 'any' : undefined}
                  value={values[field.key] || ''}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full px-2 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-md text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-medium text-slate-100 bg-sky-600 rounded-md hover:bg-sky-500 transition-colors"
            >
              Save & Timestamp
            </button>
            {saved && (
              <span className="text-xs text-emerald-400">Saved</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
