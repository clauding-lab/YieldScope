import { formatYield } from '../../utils/formatters'

interface Props {
  callMoneyRate: number
  corridorCeiling: number
  corridorFloor: number
}

export function CallMoneyPanel({ callMoneyRate, corridorCeiling, corridorFloor }: Props) {
  const corridorWidth = corridorCeiling - corridorFloor
  const position = corridorWidth > 0
    ? ((callMoneyRate - corridorFloor) / corridorWidth) * 100
    : 50

  const clampedPosition = Math.max(0, Math.min(100, position))

  return (
    <div className="bg-surface rounded-xl p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-3">Call Money vs Corridor</h3>

      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
        <span>SDF {formatYield(corridorFloor)}</span>
        <span>SLF {formatYield(corridorCeiling)}</span>
      </div>

      {/* Corridor bar */}
      <div className="relative h-6 bg-slate-800 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/30 via-sky-900/30 to-red-900/30" />
        {/* Call money position marker */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-amber-400 rounded-full"
          style={{ left: `${clampedPosition}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      <div className="mt-2 text-center">
        <span className="text-xs text-slate-400">Call Money: </span>
        <span className={`text-sm font-bold ${
          callMoneyRate > corridorCeiling ? 'text-red-400' :
          callMoneyRate < corridorFloor ? 'text-green-400' :
          'text-amber-400'
        }`}>
          {formatYield(callMoneyRate)}
        </span>
      </div>
    </div>
  )
}
