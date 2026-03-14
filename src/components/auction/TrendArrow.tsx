import { formatBps } from '../../utils/formatters'
import { yieldChangeBg } from '../../utils/colors'

interface TrendArrowProps {
  bps: number | null
}

export function TrendArrow({ bps }: TrendArrowProps) {
  if (bps == null) return <span className="text-xs text-slate-600">—</span>

  const arrow = bps > 0 ? '↑' : bps < 0 ? '↓' : '→'

  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${yieldChangeBg(bps)}`}>
      {arrow} {formatBps(Math.abs(bps))}
    </span>
  )
}
