import { useState, useMemo } from 'react'
import { DataTimestamp } from '../ui/DataTimestamp'
import { InsightPanel } from '../ui/InsightPanel'
import { useWeeklyCommentary } from '../../hooks/useWeeklyCommentary'

/** Render markdown-lite body: paragraphs, **bold**, bullet lists */
function FormattedBody({ text }: { text: string }) {
  const blocks = useMemo(() => {
    const lines = text.split('\n')
    const result: { type: 'heading' | 'bullet' | 'paragraph'; content: string }[] = []
    let paraBuffer: string[] = []

    const flushPara = () => {
      if (paraBuffer.length > 0) {
        result.push({ type: 'paragraph', content: paraBuffer.join(' ') })
        paraBuffer = []
      }
    }

    for (const raw of lines) {
      const line = raw.trim()
      if (!line) {
        flushPara()
        continue
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        flushPara()
        result.push({ type: 'heading', content: line.replace(/\*\*/g, '') })
      } else if (line.startsWith('- ')) {
        flushPara()
        result.push({ type: 'bullet', content: line.slice(2) })
      } else {
        paraBuffer.push(line)
      }
    }
    flushPara()
    return result
  }, [text])

  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        if (block.type === 'heading') {
          return (
            <p key={i} className="text-sm font-semibold text-slate-200 mt-3 first:mt-0">
              {block.content}
            </p>
          )
        }
        if (block.type === 'bullet') {
          return (
            <div key={i} className="flex items-start gap-1.5 pl-2">
              <span className="text-sky-400 text-xs mt-0.5 shrink-0">•</span>
              <p className="text-sm text-slate-300 leading-relaxed">
                <InlineBold text={block.content} />
              </p>
            </div>
          )
        }
        return (
          <p key={i} className="text-sm text-slate-300 leading-relaxed">
            <InlineBold text={block.content} />
          </p>
        )
      })}
    </div>
  )
}

/** Render inline **bold** segments */
function InlineBold({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-slate-100 font-semibold">{part.slice(2, -2)}</strong>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

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

  // For collapsed view, show first paragraph only (up to first double newline)
  const firstPara = latest.body.split('\n\n')[0]

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-slate-800/80 border border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Weekly Intelligence Note
          </h2>
          <DataTimestamp lastUpdated={latest.weekEnding} frequency="weekly" compact />
        </div>

        <h3 className="text-base font-bold text-slate-100 mb-3">{latest.title}</h3>

        {expanded ? (
          <FormattedBody text={latest.body} />
        ) : (
          <p className="text-sm text-slate-300 leading-relaxed">
            <InlineBold text={firstPara} />
          </p>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-sky-400 hover:text-sky-300 font-medium mt-2"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>

        {expanded && latest.keyPoints && latest.keyPoints.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <p className="text-xs font-medium text-slate-400 mb-2">Key Points</p>
            <div className="space-y-1">
              {latest.keyPoints.map((point: string, i: number) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-sky-400 text-xs mt-0.5 shrink-0">•</span>
                  <p className="text-xs text-slate-300"><InlineBold text={point} /></p>
                </div>
              ))}
            </div>
          </div>
        )}

        {expanded && latest.outlook && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <p className="text-xs font-medium text-slate-400 mb-1">Watchpoint</p>
            <p className="text-sm text-slate-300"><InlineBold text={latest.outlook} /></p>
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
