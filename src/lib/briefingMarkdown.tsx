import { Fragment, type ReactNode } from 'react'

/**
 * Renders the controlled Markdown subset the weekly briefing job emits:
 * `## sub-headings`, `- bullets`, blank-line paragraphs, and **bold**.
 * Builds React elements (never innerHTML), so the model's text cannot inject HTML.
 */

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <Fragment key={i}>{part}</Fragment>,
  )
}

interface BriefingBodyProps {
  markdown: string
  baseSize?: number
}

export function BriefingBody({ markdown, baseSize = 16 }: BriefingBodyProps) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let para: string[] = []
  let bullets: string[] = []
  let k = 0

  const flushPara = () => {
    if (!para.length) return
    blocks.push(
      <p key={k++} className="body" style={{ margin: '0 0 14px', fontSize: baseSize, lineHeight: 1.7 }}>
        {inline(para.join(' '))}
      </p>,
    )
    para = []
  }
  const flushBullets = () => {
    if (!bullets.length) return
    blocks.push(
      <ul key={k++} style={{ margin: '0 0 16px', paddingLeft: 18, display: 'grid', gap: 7 }}>
        {bullets.map((b, i) => (
          <li key={i} className="body" style={{ fontSize: baseSize, lineHeight: 1.55 }}>{inline(b)}</li>
        ))}
      </ul>,
    )
    bullets = []
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) { flushPara(); flushBullets(); continue }

    const heading = line.match(/^#{1,4}\s+(.*)$/)
    if (heading) {
      flushPara(); flushBullets()
      blocks.push(
        <div
          key={k++}
          style={{
            margin: '22px 0 9px', fontSize: 12.5, fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-2)',
          }}
        >
          {inline(heading[1])}
        </div>,
      )
      continue
    }

    const bullet = line.match(/^[-*]\s+(.*)$/)
    if (bullet) { flushPara(); bullets.push(bullet[1]); continue }

    flushBullets(); para.push(line)
  }
  flushPara(); flushBullets()
  return <>{blocks}</>
}
