import { formatCrore, formatPercent } from '../../utils/formatters'

interface DevolvementAlertProps {
  amountCrore: number
  pct: number
}

export function DevolvementAlert({ amountCrore, pct }: DevolvementAlertProps) {
  if (amountCrore === 0) return null

  const severity = pct >= 20 ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'

  return (
    <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${severity}`}>
      Devolvement: {formatCrore(amountCrore)} ({formatPercent(pct)})
    </div>
  )
}
