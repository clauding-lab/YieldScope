import { DataTimestamp } from './DataTimestamp'

interface InsightPanelProps {
  tier: 1 | 2
  content: string
  generatedAt?: string
  className?: string
}

export function InsightPanel({ tier, content, generatedAt, className = '' }: InsightPanelProps) {
  const borderColor = tier === 1 ? 'border-l-slate-500' : 'border-l-cyan-500'
  const label = tier === 1 ? 'What This Means' : 'AI Analysis'

  return (
    <div className={`rounded-lg bg-slate-800/60 border-l-4 ${borderColor} p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${tier === 1 ? 'text-slate-400' : 'text-cyan-400'}`}>
          {label}
        </span>
        {tier === 2 && generatedAt && (
          <DataTimestamp lastUpdated={generatedAt} compact />
        )}
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">
        {content}
      </p>
    </div>
  )
}
