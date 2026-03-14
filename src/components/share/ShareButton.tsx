import { useState, useRef, type ReactNode } from 'react'
import { toPng } from 'html-to-image'

interface ShareButtonProps {
  targetRef: React.RefObject<HTMLElement | null>
  title?: string
  children?: ReactNode
}

export function ShareButton({ targetRef, title = 'YieldScope', children }: ShareButtonProps) {
  const [sharing, setSharing] = useState(false)
  const linkRef = useRef<HTMLAnchorElement>(null)

  const handleShare = async () => {
    if (!targetRef.current) return
    setSharing(true)

    try {
      const dataUrl = await toPng(targetRef.current, {
        backgroundColor: '#0f172a',
        pixelRatio: 2,
      })

      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], 'yieldscope.png', { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, files: [file] })
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob)
        if (linkRef.current) {
          linkRef.current.href = url
          linkRef.current.download = 'yieldscope.png'
          linkRef.current.click()
          URL.revokeObjectURL(url)
        }
      }
    } catch {
      // User cancelled share or error
    } finally {
      setSharing(false)
    }
  }

  return (
    <>
      <button
        onClick={handleShare}
        disabled={sharing}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-50 transition-colors"
      >
        {sharing ? (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        )}
        {children ?? 'Share'}
      </button>
      <a ref={linkRef} className="hidden" />
    </>
  )
}
