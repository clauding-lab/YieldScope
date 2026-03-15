import Anthropic from '@anthropic-ai/sdk'
import { getApiKey } from './apiKeyStore'
import { getCurveShape, getCurveSpread } from '../utils/yieldMath'
import type {
  YieldData, AuctionData, MacroData, MoneySupplyData, PolicyData, FiscalData, CommodityData,
} from '../types'

interface AlcoBriefInput {
  yieldData: YieldData | null
  auctionData: AuctionData | null
  macroData: MacroData | null
  moneySupplyData: MoneySupplyData | null
  policyData: PolicyData | null
  fiscalData: FiscalData | null
  commodityData: CommodityData | null
}

function buildFullContext(input: AlcoBriefInput): string {
  const parts: string[] = []

  // Yield curve data
  if (input.yieldData?.daily?.length) {
    const latest = input.yieldData.daily[input.yieldData.daily.length - 1]
    parts.push(`## Yield Curve (${latest.date})`)
    parts.push(Object.entries(latest.yields).map(([t, y]) => `${t}: ${y}%`).join(', '))
    const spread = getCurveSpread(latest.yields)
    const shape = getCurveShape(latest.yields)
    parts.push(`10Y-91D spread: ${spread}bps | Curve shape: ${shape}`)

    // Weekly changes
    if (input.yieldData.daily.length > 1) {
      const prev = input.yieldData.daily[input.yieldData.daily.length - 2]
      const changes = Object.entries(latest.yields).map(([t, y]) => {
        const prevY = prev.yields[t as keyof typeof prev.yields]
        if (prevY == null) return null
        const bps = Math.round((y - prevY) * 100)
        return `${t}: ${bps > 0 ? '+' : ''}${bps}bps`
      }).filter(Boolean)
      parts.push(`Weekly changes: ${changes.join(', ')}`)
    }
  }

  // Recent auctions
  if (input.auctionData?.auctions?.length) {
    parts.push('\n## Recent Auctions')
    const recent = input.auctionData.auctions.slice(0, 6)
    for (const a of recent) {
      parts.push(`${a.date} ${a.tenor} ${a.type}: cutoff=${a.cutoffYield}% bid-cover=${a.bidCoverRatio}x devolvement=${a.devolvementPct}%`)
    }
  }

  // Policy rates
  if (input.policyData) {
    parts.push('\n## Policy Rates')
    parts.push(`Repo: ${input.policyData.currentRates.repoRate}% | SDF: ${input.policyData.currentRates.reverseRepoRate}% | CRR: ${input.policyData.currentRates.crrRate}% | Bank rate: ${input.policyData.currentRates.bankRate}%`)
    parts.push(`Corridor: ${input.policyData.corridor.floor}% — ${input.policyData.corridor.ceiling}%`)
  }

  // Macro (snapshots stored newest-first)
  if (input.macroData?.snapshots?.length) {
    const latest = input.macroData.snapshots[0]
    parts.push('\n## Macro Indicators')
    parts.push(`CPI: ${latest.cpiHeadlineYoY}% (food: ${latest.cpiFoodYoY}%, non-food: ${latest.cpiNonFoodYoY}%)`)
    parts.push(`USD/BDT: ${latest.usdBdtRate} (30d change: ${latest.usdBdtChange30d})`)
    parts.push(`FX reserves: $${latest.bbFxReservesBn}B | ADR: ${latest.advanceDepositRatio}%`)
    parts.push(`Call money rate: ${latest.callMoneyRate}%`)
  }

  // Liquidity
  if (input.moneySupplyData?.monthly?.length) {
    const latest = input.moneySupplyData.monthly[input.moneySupplyData.monthly.length - 1]
    parts.push('\n## Liquidity')
    parts.push(`Excess liquidity: ${(latest.excessLiquidityCrore / 100000).toFixed(1)} lakh crore`)
    parts.push(`M2 growth: ${latest.m2GrowthYoY}% | Call money volume: ${latest.callMoneyVolumeCrore} crore`)
  }

  // Fiscal
  if (input.fiscalData) {
    parts.push('\n## Fiscal')
    parts.push(`Revenue collection: ${input.fiscalData.revenue.collectionRatioPct}% of target (${input.fiscalData.fiscalYear})`)
    parts.push(`ADP implementation: ${input.fiscalData.adp.implementationRatePct}%`)
    parts.push(`Total debt: ${input.fiscalData.debt.totalDebtLakhCrore} lakh crore (${input.fiscalData.debt.debtToGdpPct}% of GDP)`)
    parts.push(`Interest-to-revenue: ${input.fiscalData.debt.interestToRevenuePct}%`)
  }

  // Commodities
  if (input.commodityData) {
    parts.push('\n## Commodities')
    parts.push(`Brent crude: $${input.commodityData.oil.brentUsd}/bbl (30d: ${input.commodityData.oil.change30d > 0 ? '+' : ''}${input.commodityData.oil.change30d})`)
    parts.push(`JKM LNG: $${input.commodityData.lng.jkmUsdMmbtu}/mmbtu`)
    parts.push(`Annual energy import bill (est.): $${input.commodityData.importBillImpact.estimatedAnnualEnergyBnUsd}B`)
  }

  return parts.join('\n')
}

export async function generateAlcoBrief(input: AlcoBriefInput): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('API key not configured. Please add your API key in Settings.')

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  })

  const context = buildFullContext(input)

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2500,
    system: `You are a Head of Treasury with 30+ years of experience at a top-tier Bangladeshi bank, writing a weekly ALCO brief. Your audience is the bank's CEO, CFO, CRO, and board risk committee — people who make billion-taka decisions based on your judgment.

Write in flowing prose paragraphs — NOT bullet points or markdown headers. Write like you are narrating the market to a room of senior decision-makers: conversational authority with Simon Sinek-level engagement and Ray Dalio-level strategic clarity. Every sentence should either inform, warn, or recommend.

Structure your brief as 3-4 substantial paragraphs:

Paragraph 1: What happened this week — yield movements, auction dynamics, curve shape. Lead with the single most important thing that changed. Use specific numbers from the data. Tell them what the market is saying, not just what it did.

Paragraph 2: The structural context — liquidity conditions, credit/deposit dynamics, NPL backdrop, government borrowing trajectory. Connect the dots between macro forces and market pricing. Explain WHY the curve looks the way it does. If there are curve distortions (inversions, kinks), explain what they mean practically for portfolio positioning.

Paragraph 3: Risks, opportunities, and the call — what should treasury do this week? Which part of the curve offers value? Where is the danger? Be specific: name the tenor, the yield level, the bid-cover ratio. End with the key catalyst to watch and what it means if it breaks one way or the other.

Rules:
- NO markdown headers (##), NO bullet points, NO horizontal rules (---), NO title lines
- Use **bold** sparingly for key numbers or emphasis
- Use specific numbers from the data — every claim backed by a data point
- Use ৳ for taka amounts, not Tk or BDT
- Write 500-700 words total
- Write for an ALCO audience — assume they understand yield curves, bid-cover ratios, CRR, SLF/SDF
- Reference Bangladesh-specific factors: BB policy stance, fiscal year-end dynamics, seasonal patterns, remittance flows
- Sound like a person with deep conviction, not a report generator`,
    messages: [{
      role: 'user',
      content: `Generate the ALCO brief from this data:\n\n${context}`,
    }],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}
