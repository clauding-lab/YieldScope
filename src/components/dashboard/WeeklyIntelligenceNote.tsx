import { useState } from 'react'
import { DataTimestamp } from '../ui/DataTimestamp'
import { InsightPanel } from '../ui/InsightPanel'
import { useWeeklyCommentary } from '../../hooks/useWeeklyCommentary'

export function WeeklyIntelligenceNote() {
  const { data } = useWeeklyCommentary()
  const [expanded, setExpanded] = useState(false)

  const latest = data?.commentaries?.[0]

  if (!latest) {
    return (
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
        <h2 className="text-sm font-semibold text-slate-300">Weekly Intelligence Note</h2>
        <p className="text-xs text-slate-500 mt-2">No commentary available yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-slate-800/80 border border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Weekly Intelligence Note
          </h2>
          <DataTimestamp lastUpdated={latest.weekEnding} frequency="weekly" compact />
        </div>

        <h3 className="text-base font-bold text-slate-100 mb-2">{latest.title}</h3>

        <div className="space-y-2">
          <p className="text-sm text-slate-300 leading-relaxed">
            {expanded ? latest.body : latest.body.slice(0, 300) + (latest.body.length > 300 ? '...' : '')}
          </p>

          {latest.body.length > 300 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {expanded && latest.outlook && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <p className="text-xs font-medium text-slate-400 mb-1">Watchpoint</p>
            <p className="text-sm text-slate-300">{latest.outlook}</p>
          </div>
        )}

        <div className="mt-3 text-[10px] text-slate-600">
          {latest.attribution}
        </div>
      </div>

      <InsightPanel
        tier={1}
        content="This note is your weekly substitute for reading 15 different sources. The key skill in reading it is distinguishing between noise (small weekly fluctuations) and signal (trend changes). A 2bps yield change is noise. A sixth consecutive weekly decline is signal. A single low bid-cover auction is noise. A pattern of low bid-covers across multiple tenors is signal."
      />
    </div>
  )
}
