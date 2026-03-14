import type { YieldData, PolicyData } from '../../types'
import { useCurveInterpreter } from '../../hooks/useCurveInterpreter'
import { AIFeatureGate } from './AIFeatureGate'

interface Props {
  yieldData: YieldData
  policyData?: PolicyData | null
}

export function CurveInterpreter({ yieldData, policyData }: Props) {
  const { interpretation, isLoading, error, interpret, clear } = useCurveInterpreter()

  return (
    <AIFeatureGate feature="Curve Interpreter">
      <div className="rounded-xl bg-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-300">Curve Interpreter</h3>
          {interpretation && (
            <button onClick={clear} className="text-xs text-slate-500 hover:text-slate-300">
              Clear
            </button>
          )}
        </div>

        {!interpretation && !isLoading && (
          <button
            onClick={() => interpret(yieldData, policyData)}
            className="w-full py-3 rounded-lg border border-sky-500/30 text-sky-400 text-sm hover:bg-sky-500/10 transition-colors"
          >
            Explain this curve
          </button>
        )}

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
          </div>
        )}
      </div>
    </AIFeatureGate>
  )
}
