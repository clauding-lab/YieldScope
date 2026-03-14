import type { BBCircular } from '../../types'
import { CircularCard } from './CircularCard'

interface Props {
  circulars: BBCircular[]
}

export function CircularFeed({ circulars }: Props) {
  if (circulars.length === 0) {
    return (
      <div className="rounded-xl bg-slate-800 p-6 text-center">
        <p className="text-sm text-slate-500">No circulars available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-300">BB Circulars</h3>
      {circulars.slice(0, 10).map((circ) => (
        <CircularCard key={circ.id} circular={circ} />
      ))}
    </div>
  )
}
