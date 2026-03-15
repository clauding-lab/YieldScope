import { useState, useMemo } from 'react'
import type { WeeklyCommentary } from '../../types'

interface Props {
  commentary: WeeklyCommentary
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

export function WeeklyCommentaryCard({ commentary }: Props) {
  const [expanded, setExpanded] = useState(false)

  const firstPara = commentary.body.split('\n\n')[0]

  return (
    <div className="rounded-xl bg-slate-800 p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs text-sky-400 font-medium">Weekly Note</span>
          <span className="text-xs text-slate-500 ml-2">Week ending {commentary.weekEnding}</span>
        </div>
      </div>

      <h3 className="text-base font-semibold text-slate-100 mb-2">{commentary.title}</h3>

      {expanded ? (
        <FormattedBody text={commentary.body} />
      ) : (
        <p className="text-sm text-slate-300 leading-relaxed line-clamp-4">
          <InlineBold text={firstPara} />
        </p>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-sky-400 mt-2 hover:text-sky-300"
      >
        {expanded ? 'Show less' : 'Read more'}
      </button>

      {expanded && commentary.keyPoints.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-xs font-medium text-slate-400 mb-2">Key Points</p>
          <div className="space-y-1">
            {commentary.keyPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-sky-400 text-xs mt-0.5 shrink-0">•</span>
                <p className="text-xs text-slate-300"><InlineBold text={point} /></p>
              </div>
            ))}
          </div>
        </div>
      )}

      {expanded && commentary.outlook && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-xs font-medium text-slate-400 mb-1">Outlook</p>
          <p className="text-xs text-slate-300"><InlineBold text={commentary.outlook} /></p>
        </div>
      )}

      <p className="text-[10px] text-slate-600 mt-3">{commentary.attribution}</p>
    </div>
  )
}
