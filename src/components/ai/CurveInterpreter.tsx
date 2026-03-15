import type { YieldData, PolicyData } from '../../types'
import { useCurveInterpreter } from '../../hooks/useCurveInterpreter'
import { useAIContext } from '../../contexts/AIContext'
import { DataTimestamp } from '../ui/DataTimestamp'

interface Props {
  yieldData: YieldData
  policyData?: PolicyData | null
}

export function CurveInterpreter({ yieldData, policyData }: Props) {
  const { interpretation, isLoading, error, interpret } = useCurveInterpreter()
  const { isConfigured } = useAIContext()

  return (
    <div className="rounded-xl bg-slate-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-300">Curve Interpreter</h3>
        {interpretation?.generatedAt && (
          <DataTimestamp lastUpdated={interpretation.generatedAt} compact />
        )}
      </div>

      {isLoading && (
        <div className="py-4 text-center">
          <div className="inline-block w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 mt-2">Analyzing curve shape...</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 py-2">{error}</p>
      )}

      {interpretation && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              interpretation.shape === 'normal' ? 'bg-green-500/20 text-green-400' :
              interpretation.shape === 'inverted' ? 'bg-red-500/20 text-red-400' :
              interpretation.shape === 'flat' ? 'bg-amber-500/20 text-amber-400' :
              'bg-purple-500/20 text-purple-400'
            }`}>
              {interpretation.shape.charAt(0).toUpperCase() + interpretation.shape.slice(1)}
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {interpretation.interpretation}
          </p>

          {interpretation.implications.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">Implications</p>
              <ul className="space-y-1">
                {interpretation.implications.map((impl, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-sky-400 mt-0.5">→</span>
                    {impl}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isConfigured && (
            <button
              onClick={() => interpret(yieldData, policyData)}
              disabled={isLoading}
              className="px-3 py-1.5 text-[10px] font-medium text-sky-400 border border-sky-800/50 rounded-md hover:bg-sky-900/20 disabled:opacity-50 transition-colors"
            >
              Regenerate
            </button>
          )}
        </div>
      )}

      {!interpretation && !isLoading && (
        <>
          {isConfigured ? (
            <button
              onClick={() => interpret(yieldData, policyData)}
              className="w-full py-3 rounded-lg border border-sky-500/30 text-sky-400 text-sm hover:bg-sky-500/10 transition-colors"
            >
              Explain this curve
            </button>
          ) : (
            <p className="text-xs text-slate-500 text-center py-3">
              Curve interpretation will appear after the next workflow run.
            </p>
          )}
        </>
      )}
    </div>
  )
}
