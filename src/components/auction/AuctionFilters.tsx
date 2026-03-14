import type { AuctionFilters as Filters, AuctionType } from '../../types'
import { TENORS, type Tenor } from '../../types'
import { TENOR_SHORT } from '../../utils/constants'

interface AuctionFiltersProps {
  filters: Filters
  onFilterChange: (filters: Filters) => void
}

const TYPE_OPTIONS: Array<AuctionType | 'All'> = ['All', 'T-Bill', 'BGTB', 'FRB']

export function AuctionFilters({ filters, onFilterChange }: AuctionFiltersProps) {
  return (
    <div className="space-y-2">
      {/* Type filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TYPE_OPTIONS.map((type) => (
          <button
            key={type}
            onClick={() => onFilterChange({ ...filters, type })}
            className={`text-xs px-3 py-1 rounded-full border whitespace-nowrap transition-all ${
              filters.type === type
                ? 'bg-accent/20 text-accent border-accent/40'
                : 'text-slate-500 border-slate-700/50 hover:text-slate-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Tenor filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => onFilterChange({ ...filters, tenor: 'All' })}
          className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap transition-all ${
            filters.tenor === 'All'
              ? 'bg-accent/20 text-accent border-accent/40'
              : 'text-slate-500 border-slate-700/50'
          }`}
        >
          All
        </button>
        {TENORS.map((tenor: Tenor) => (
          <button
            key={tenor}
            onClick={() => onFilterChange({ ...filters, tenor })}
            className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap transition-all ${
              filters.tenor === tenor
                ? 'bg-accent/20 text-accent border-accent/40'
                : 'text-slate-500 border-slate-700/50'
            }`}
          >
            {TENOR_SHORT[tenor]}
          </button>
        ))}
      </div>
    </div>
  )
}
