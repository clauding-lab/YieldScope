import type { PolicyEvent } from '../../types'
import { formatDate, formatBps } from '../../utils/formatters'

interface PolicyTimelineProps {
  events: PolicyEvent[]
}

export function PolicyTimeline({ events }: PolicyTimelineProps) {
  return (
    <div className="bg-surface rounded-xl p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-3">Policy Timeline</h3>
      <div className="space-y-0">
        {events.map((event, index) => (
          <div key={event.id} className="flex gap-3">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                event.type === 'rate_change'
                  ? event.changeBps && event.changeBps > 0
                    ? 'bg-red-400'
                    : event.changeBps && event.changeBps < 0
                    ? 'bg-green-400'
                    : 'bg-slate-500'
                  : 'bg-amber-400'
              }`} />
              {index < events.length - 1 && (
                <div className="w-px flex-1 bg-slate-700/50 min-h-[24px]" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 flex-1 min-w-0">
              <div className="text-[10px] text-slate-500 mb-0.5">
                {formatDate(event.date)}
              </div>
              <div className="text-xs font-medium text-slate-200 mb-0.5">
                {event.title}
              </div>
              {event.changeBps != null && event.changeBps !== 0 && (
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  event.changeBps > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                }`}>
                  {formatBps(event.changeBps)}
                </span>
              )}
              {event.summary && (
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {event.summary}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
