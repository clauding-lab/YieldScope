import Anthropic from '@anthropic-ai/sdk'
import type { YieldData, AuctionData, PolicyData, CurveInterpretation, Anomaly } from '../types'
import { getCurveShape, getCurveSpread } from '../utils/yieldMath'

let client: Anthropic | null = null

export function initAIClient(apiKey: string): void {
  client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  })
}

export function isAIReady(): boolean {
  return client !== null
}

function buildDataContext(
  yieldData?: YieldData | null,
  auctionData?: AuctionData | null,
  policyData?: PolicyData | null,
): string {
  const parts: string[] = []

  if (yieldData && yieldData.daily.length > 0) {
    const latest = yieldData.daily[yieldData.daily.length - 1]
    parts.push(`Current yields (${latest.date}): ${Object.entries(latest.yields).map(([t, y]) => `${t}: ${y}%`).join(', ')}`)

    const spread = getCurveSpread(latest.yields)
    const shape = getCurveShape(latest.yields)
    parts.push(`10Y-91D spread: ${spread}bps, Curve shape: ${shape}`)
  }

  if (policyData) {
    parts.push(`Policy rates: Repo ${policyData.currentRates.repoRate}%, SDF ${policyData.currentRates.reverseRepoRate}%, CRR ${policyData.currentRates.crrRate}`)
  }

  if (auctionData && auctionData.auctions.length > 0) {
    const recent = auctionData.auctions.slice(0, 5)
    parts.push(`Recent auctions: ${recent.map(a => `${a.date} ${a.tenor} cutoff=${a.cutoffYield}% bid-cover=${a.bidCoverRatio}x`).join('; ')}`)
  }

  return parts.join('\n')
}

export async function interpretCurveShape(
  yieldData: YieldData,
  policyData?: PolicyData | null,
): Promise<CurveInterpretation> {
  if (!client) throw new Error('AI client not initialized. Please add your API key in Settings.')

  const context = buildDataContext(yieldData, null, policyData)

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 500,
    system: `You are a Bangladesh fixed income analyst. Interpret the current government securities yield curve shape. Be specific to the Bangladesh market context — reference BB policy rates, banking sector liquidity, inflation trends. Keep interpretation under 100 words. Return JSON with fields: shape (normal|flat|inverted|humped), interpretation (string), implications (array of 2-3 short strings).`,
    messages: [{
      role: 'user',
      content: `Analyze this yield curve:\n${context}`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { shape: 'normal', interpretation: text, implications: [] }
    return {
      shape: parsed.shape || 'normal',
      interpretation: parsed.interpretation || text,
      implications: parsed.implications || [],
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      shape: 'normal',
      interpretation: text,
      implications: [],
      generatedAt: new Date().toISOString(),
    }
  }
}

export async function explainAnomaly(anomaly: Anomaly, context: string): Promise<string> {
  if (!client) throw new Error('AI client not initialized.')

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 200,
    system: `You are a Bangladesh fixed income analyst. Briefly explain (2-3 sentences) why this market anomaly matters and what it signals. Be specific to the Bangladesh banking/treasury context.`,
    messages: [{
      role: 'user',
      content: `Anomaly detected: ${anomaly.message}\nType: ${anomaly.type}, Severity: ${anomaly.severity}\nTrigger value: ${anomaly.triggerValue}, Threshold: ${anomaly.threshold}\n\nMarket context:\n${context}`,
    }],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

export async function askYieldScope(
  question: string,
  yieldData?: YieldData | null,
  auctionData?: AuctionData | null,
  policyData?: PolicyData | null,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
): Promise<string> {
  if (!client) throw new Error('AI client not initialized. Please add your API key in Settings.')

  const context = buildDataContext(yieldData, auctionData, policyData)

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...history,
    { role: 'user', content: question },
  ]

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 300,
    system: `You are YieldScope AI, a Bangladesh government securities market assistant. Answer questions using the provided market data. Keep responses under 100 words. Be precise with numbers. If you don't have data to answer, say so.\n\nCurrent market data:\n${context}`,
    messages,
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}
