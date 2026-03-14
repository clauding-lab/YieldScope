import type { BBCircular } from '../../types'

interface Props {
  circular: BBCircular
}

const categoryColors: Record<string, string> = {
  monetary_policy: 'bg-sky-500/20 text-sky-400',
  forex: 'bg-green-500/20 text-green-400',
  banking_regulation: 'bg-purple-500/20 text-purple-400',
  payment_systems: 'bg-amber-500/20 text-amber-400',
  other: 'bg-slate-500/20 text-slate-400',
}

const categoryLabels: Record<string, string> = {
  monetary_policy: 'Monetary Policy',
  forex: 'Forex',
  banking_regulation: 'Banking',
  payment_systems: 'Payments',
  other: 'Other',
}

const impactIcons: Record<string, string> = {
  positive: '↓ Yields',
  negative: '↑ Yields',
  neutral: '→ Neutral',
}

export function CircularCard({ circular }: Props) {
  return (
    <div className="rounded-xl bg-slate-800 p-4">
      <div className="flex items-start justify-between mb-2">
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${categoryColors[circular.category] || categoryColors.other}`}>
          {categoryLabels[circular.category] || 'Other'}
        </span>
        <span className="text-xs text-slate-500">{circular.date}</span>
      </div>

      <h4 className="text-sm font-medium text-slate-200 mb-2 leading-snug">
        {circular.title}
      </h4>

      {circular.summary && (
        <p className="text-xs text-slate-400 leading-relaxed mb-2">{circular.summary}</p>
      )}

      <div className="flex items-center justify-between">
        {circular.impactOnYields && (
          <span className={`text-[10px] font-medium ${
            circular.impactOnYields === 'positive' ? 'text-green-400' :
            circular.impactOnYields === 'negative' ? 'text-red-400' :
            'text-slate-500'
          }`}>
            {impactIcons[circular.impactOnYields]}
          </span>
        )}
        <a
          href={circular.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-sky-400 hover:text-sky-300"
        >
          View PDF →
        </a>
      </div>
    </div>
  )
}
