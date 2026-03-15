import { useState, useCallback, useEffect } from 'react'
import { DataTimestamp } from '../ui/DataTimestamp'
import { useAIContext } from '../../contexts/AIContext'
import { generateAlcoBrief } from '../../services/alcoBrief'
import { loadData } from '../../services/dataLoader'
import type { YieldData, AuctionData, MacroData, MoneySupplyData, PolicyData, FiscalData, CommodityData } from '../../types'

interface PreGeneratedBrief {
  brief: string
  generatedAt: string
  attribution: string
}

interface AlcoBriefGeneratorProps {
  yieldData: YieldData | null
  auctionData: AuctionData | null
  macroData: MacroData | null
  moneySupplyData: MoneySupplyData | null
  policyData: PolicyData | null
  fiscalData: FiscalData | null
  commodityData: CommodityData | null
}

export function AlcoBriefGenerator({
  yieldData, auctionData, macroData, moneySupplyData, policyData, fiscalData, commodityData,
}: AlcoBriefGeneratorProps) {
  const { isConfigured } = useAIContext()
  const [brief, setBrief] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load pre-generated brief on mount
  useEffect(() => {
    loadData<PreGeneratedBrief>('alco_brief.json')
      .then(data => {
        if (data?.brief) {
          setBrief(data.brief)
          setGeneratedAt(data.generatedAt)
        }
      })
      .catch(() => { /* no pre-generated brief */ })
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!isConfigured) return

    setIsGenerating(true)
    setError(null)

    try {
      const result = await generateAlcoBrief({
        yieldData, auctionData, macroData, moneySupplyData, policyData, fiscalData, commodityData,
      })
      setBrief(result)
      setGeneratedAt(new Date().toISOString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate brief')
    } finally {
      setIsGenerating(false)
    }
  }, [isConfigured, yieldData, auctionData, macroData, moneySupplyData, policyData, fiscalData, commodityData])

  return (
    <div className="rounded-xl bg-slate-800/80 border border-cyan-800/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
            ALCO Brief Generator
          </span>
          <span className="text-[9px] px-1.5 py-0.5 bg-cyan-900/30 text-cyan-400 rounded-full border border-cyan-800/30">
            Tier 2 AI
          </span>
        </div>
        {generatedAt && <DataTimestamp lastUpdated={generatedAt} compact />}
      </div>

      {!brief && !isConfigured ? (
        <div className="text-center py-4">
          <p className="text-xs text-slate-400">Configure your API key in Settings to use the ALCO Brief Generator.</p>
          <p className="text-[10px] text-slate-500 mt-1">Requires Claude Opus 4.6 API access.</p>
        </div>
      ) : !brief ? (
        <div className="text-center py-4 space-y-3">
          <p className="text-xs text-slate-400">
            Generate a one-page ALCO-ready brief summarizing the current state of Bangladesh's fixed income markets,
            liquidity conditions, macro environment, and fiscal pressures.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-5 py-2 text-xs font-medium bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating Brief...
              </span>
            ) : (
              'Generate ALCO Brief'
            )}
          </button>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Brief content */}
          <div className="max-w-none space-y-3">
            {brief
              .replace(/^#[^\n]*\n/gm, '') // strip markdown titles
              .replace(/^---\n?/gm, '')    // strip horizontal rules
              .split('\n\n')
              .filter(p => p.trim())
              .map((para, i) => (
                <p key={i} className="text-xs text-slate-300 leading-relaxed">
                  {para.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                    part.startsWith('**') && part.endsWith('**')
                      ? <strong key={j} className="text-slate-100 font-semibold">{part.slice(2, -2)}</strong>
                      : <span key={j}>{part}</span>
                  )}
                </p>
              ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-3 py-1.5 text-[10px] font-medium text-cyan-400 border border-cyan-800/50 rounded-md hover:bg-cyan-900/20 disabled:opacity-50 transition-colors"
            >
              Regenerate
            </button>
            <button
              onClick={() => {
                if (brief) navigator.clipboard.writeText(brief)
              }}
              className="px-3 py-1.5 text-[10px] font-medium text-slate-400 border border-slate-700 rounded-md hover:bg-slate-700/50 transition-colors"
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
