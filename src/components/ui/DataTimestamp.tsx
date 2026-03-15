import { format, formatDistanceToNow, differenceInHours, differenceInDays } from 'date-fns'

interface DataTimestampProps {
  lastUpdated: string | null
  frequency?: 'daily' | 'weekly' | 'monthly'
  className?: string
  compact?: boolean
}

const STALE_THRESHOLDS = {
  daily: { warning: 24, critical: 72 },
  weekly: { warning: 48, critical: 168 },
  monthly: { warning: 720, critical: 1440 },
} as const

export function DataTimestamp({ lastUpdated, frequency = 'weekly', className = '', compact = false }: DataTimestampProps) {
  if (!lastUpdated) {
    return (
      <span className={`text-xs text-slate-600 ${className}`}>
        No data available
      </span>
    )
  }

  const date = new Date(lastUpdated)
  const hoursAgo = differenceInHours(new Date(), date)
  const daysAgo = differenceInDays(new Date(), date)
  const thresholds = STALE_THRESHOLDS[frequency]

  let statusColor = 'text-slate-500'
  let dotColor = 'bg-emerald-400'

  if (hoursAgo >= thresholds.critical) {
    statusColor = 'text-red-400'
    dotColor = 'bg-red-400'
  } else if (hoursAgo >= thresholds.warning) {
    statusColor = 'text-amber-400'
    dotColor = 'bg-amber-400'
  }

  const timeAgo = formatDistanceToNow(date, { addSuffix: true })
  const fullDate = format(date, 'dd MMM yyyy, HH:mm')

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] ${statusColor} ${className}`} title={`Data as of ${fullDate}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        {daysAgo > 0 ? `${daysAgo}d ago` : timeAgo}
      </span>
    )
  }

  return (
    <div className={`flex items-center gap-1.5 text-xs ${statusColor} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${hoursAgo >= thresholds.warning ? 'animate-pulse' : ''}`} />
      <span>Data as of {fullDate}</span>
      {hoursAgo >= thresholds.warning && (
        <span className="text-[10px]">({timeAgo})</span>
      )}
    </div>
  )
}
