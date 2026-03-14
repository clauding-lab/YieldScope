import type { Anomaly } from '../../types'

interface Props {
  anomalies: Anomaly[]
  maxShow?: number
}

export function AnomalyBanner({ anomalies, maxShow = 3 }: Props) {
  if (anomalies.length === 0) return null

  const critical = anomalies.filter(a => a.severity === 'critical')
  const warnings = anomalies.filter(a => a.severity === 'warning')
  const shown = [...critical, ...warnings].slice(0, maxShow)

  return (
    <div className="space-y-2 mb-4">
      {shown.map((anomaly, i) => (
        <div
          key={i}
          className={`rounded-lg px-3 py-2 text-xs flex items-start gap-2 ${
            anomaly.severity === 'critical'
              ? 'bg-red-500/10 border border-red-500/30 text-red-300'
              : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
          }`}
        >
          <span className="mt-0.5">
            {anomaly.severity === 'critical' ? '🔴' : '🟡'}
          </span>
          <span>{anomaly.message}</span>
        </div>
      ))}
      {anomalies.length > maxShow && (
        <p className="text-xs text-slate-500 pl-1">
          +{anomalies.length - maxShow} more alert{anomalies.length - maxShow > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
