import { useState } from 'react'
import type { WeeklyCommentary } from '../../types'

interface Props {
  commentary: WeeklyCommentary
}

export function WeeklyCommentaryCard({ commentary }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl bg-slate-800 p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs text-sky-400 font-medium">Weekly Note</span>
          <span className="text-xs text-slate-500 ml-2">Week ending {commentary.weekEnding}</span>
        </div>
      </div>

      <h3 className="text-base font-semibold text-slate-100 mb-2">{commentary.title}</h3>

      <div className={`text-sm text-slate-300 leading-relaxed ${!expanded ? 'line-clamp-4' : ''}`}>
        {commentary.body}
      </div>

      {commentary.body.length > 200 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-sky-400 mt-2 hover:text-sky-300"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      {expanded && commentary.keyPoints.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-xs font-medium text-slate-400 mb-1">Key Points</p>
          <ul className="space-y-1">
            {commentary.keyPoints.map((point, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-sky-400 mt-0.5">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {expanded && commentary.outlook && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-xs font-medium text-slate-400 mb-1">Outlook</p>
          <p className="text-xs text-slate-300">{commentary.outlook}</p>
        </div>
      )}

      <p className="text-[10px] text-slate-600 mt-3">{commentary.attribution}</p>
    </div>
  )
}
