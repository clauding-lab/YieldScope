#!/usr/bin/env node

/**
 * Generate AI analysis using Claude API:
 * - Module 1: Auction Autopsy (for new auctions without autopsy)
 * - Module 2: Weekly Curve Commentary (every run)
 * - Module 3: Curve Interpretation (every run)
 * - Module 4: ALCO Brief (every run)
 */

import { readFile, writeFile } from 'fs/promises'
import Anthropic from '@anthropic-ai/sdk'
import { AUTOPSY_SYSTEM, WEEKLY_SYSTEM, buildAutopsyPrompt, buildWeeklyPrompt } from './lib/ai-prompts.mjs'

const AUCTION_PATH = './public/data/auction_results.json'
const YIELD_PATH = './public/data/yield_data.json'
const MACRO_PATH = './public/data/macro_context.json'
const POLICY_PATH = './public/data/policy_events.json'
const FISCAL_PATH = './public/data/fiscal_data.json'
const COMMODITY_PATH = './public/data/commodities.json'
const MONEY_SUPPLY_PATH = './public/data/money_supply.json'
const COMMENTARY_PATH = './public/data/weekly_commentary.json'
const CURVE_INTERP_PATH = './public/data/curve_interpretation.json'
const ALCO_BRIEF_PATH = './public/data/alco_brief.json'

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.log('⚠️ ANTHROPIC_API_KEY not set. Skipping AI analysis.')
  process.exit(0)
}

const client = new Anthropic({ apiKey })

/** Safely load a JSON file, returning null on failure */
async function safeLoadJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf-8'))
  } catch {
    return null
  }
}

// ─── Module 1: Auction Autopsies ───

async function generateAutopsies() {
  console.log('🤖 Generating auction autopsies...')

  const data = await safeLoadJson(AUCTION_PATH)
  if (!data) { console.log('ℹ️ No auction data found.'); return }

  const needsAutopsy = data.auctions.filter(a => !a.autopsy)
  if (needsAutopsy.length === 0) {
    console.log('ℹ️ All auctions already have autopsies.')
    return
  }

  console.log(`📝 ${needsAutopsy.length} auction(s) need autopsy`)

  const yieldData = await safeLoadJson(YIELD_PATH)
  const curveContext = yieldData?.daily?.length > 0
    ? Object.entries(yieldData.daily[yieldData.daily.length - 1].yields)
        .map(([t, y]) => `${t}: ${y}%`).join(', ')
    : null

  for (const auction of needsAutopsy.slice(0, 5)) {
    const previousForTenor = data.auctions.find(
      a => a.tenor === auction.tenor && a.date !== auction.date && a.autopsy
    )

    const prompt = buildAutopsyPrompt(auction, previousForTenor, curveContext)

    try {
      const response = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 300,
        system: AUTOPSY_SYSTEM,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
      auction.autopsy = text.trim()
      console.log(`  ✅ Autopsy for ${auction.id}`)
    } catch (err) {
      console.warn(`  ⚠️ Failed autopsy for ${auction.id}: ${err.message}`)
    }
  }

  await writeFile(AUCTION_PATH, JSON.stringify(data, null, 2))
  console.log('✅ Autopsies saved.')
}

// ─── Module 2: Weekly Commentary ───

async function generateWeeklyCommentary() {
  console.log('🤖 Generating weekly commentary...')

  const auctionData = await safeLoadJson(AUCTION_PATH)
  if (!auctionData) { console.log('ℹ️ No auction data.'); return }

  const yieldData = await safeLoadJson(YIELD_PATH)
  const macroRaw = await safeLoadJson(MACRO_PATH)
  const macroData = macroRaw?.snapshots?.[0] ?? null

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const weekAgoStr = oneWeekAgo.toISOString().split('T')[0]
  const thisWeekAuctions = auctionData.auctions.filter(a => a.date >= weekAgoStr)

  if (thisWeekAuctions.length === 0) {
    console.log('ℹ️ No auctions this week. Skipping commentary.')
    return
  }

  const prompt = buildWeeklyPrompt(thisWeekAuctions, yieldData, macroData)

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 500,
      system: WEEKLY_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    })

    const body = response.content[0]?.type === 'text' ? response.content[0].text : ''

    const now = new Date()
    const weekNum = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7)
    const weekId = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
    const weekEnding = now.toISOString().split('T')[0]
    const firstSentence = body.split('.')[0] || 'Weekly Market Commentary'

    let commentaryData = await safeLoadJson(COMMENTARY_PATH)
    if (!commentaryData) {
      commentaryData = { lastUpdated: new Date().toISOString(), commentaries: [] }
    }

    if (commentaryData.commentaries.some(c => c.id === weekId)) {
      console.log(`ℹ️ Commentary for ${weekId} already exists.`)
      return
    }

    commentaryData.commentaries.unshift({
      id: weekId,
      weekEnding,
      title: firstSentence.substring(0, 80),
      body: body.trim(),
      keyPoints: thisWeekAuctions.map(a =>
        `${a.tenor} ${a.type}: ${a.cutoffYield}% (${a.yieldChangeBps > 0 ? '+' : ''}${a.yieldChangeBps}bps)`
      ),
      curveShapeNote: yieldData?.daily?.length > 0
        ? `Based on ${Object.keys(yieldData.daily[yieldData.daily.length - 1].yields).length} tenors`
        : '',
      outlook: '',
      attribution: 'Human-directed, AI-assisted intelligence.',
    })

    commentaryData.lastUpdated = new Date().toISOString()
    await writeFile(COMMENTARY_PATH, JSON.stringify(commentaryData, null, 2))
    console.log(`✅ Weekly commentary ${weekId} saved.`)
  } catch (err) {
    console.warn(`⚠️ Failed to generate weekly commentary: ${err.message}`)
  }
}

// ─── Module 3: Curve Interpretation ───

async function generateCurveInterpretation() {
  console.log('🤖 Generating curve interpretation...')

  const yieldData = await safeLoadJson(YIELD_PATH)
  if (!yieldData?.daily?.length) { console.log('ℹ️ No yield data.'); return }

  const policyData = await safeLoadJson(POLICY_PATH)
  const latest = yieldData.daily[yieldData.daily.length - 1]
  const yields = Object.entries(latest.yields).map(([t, y]) => `${t}: ${y}%`).join(', ')

  let contextParts = [`Current yields (${latest.date}): ${yields}`]

  // Compute spread
  const y91d = latest.yields['91D']
  const y10y = latest.yields['10Y']
  if (y91d != null && y10y != null) {
    const spread = Math.round((y10y - y91d) * 100)
    contextParts.push(`10Y-91D spread: ${spread}bps`)
  }

  if (policyData) {
    contextParts.push(`Policy rates: Repo ${policyData.currentRates.repoRate}%, SDF ${policyData.currentRates.reverseRepoRate}%, CRR ${policyData.currentRates.crrRate}%`)
  }

  const context = contextParts.join('\n')

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 500,
      system: `You are a Bangladesh fixed income analyst. Interpret the current government securities yield curve shape. Be specific to the Bangladesh market context — reference BB policy rates, banking sector liquidity, inflation trends. Keep interpretation under 100 words. Return JSON with fields: shape (normal|flat|inverted|humped), interpretation (string), implications (array of 2-3 short strings).`,
      messages: [{
        role: 'user',
        content: `Analyze this yield curve:\n${context}`,
      }],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
    let parsed
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { shape: 'normal', interpretation: text, implications: [] }
    } catch {
      parsed = { shape: 'normal', interpretation: text, implications: [] }
    }

    const result = {
      shape: parsed.shape || 'normal',
      interpretation: parsed.interpretation || text,
      implications: parsed.implications || [],
      generatedAt: new Date().toISOString(),
    }

    await writeFile(CURVE_INTERP_PATH, JSON.stringify(result, null, 2))
    console.log(`✅ Curve interpretation saved (shape: ${result.shape}).`)
  } catch (err) {
    console.warn(`⚠️ Failed curve interpretation: ${err.message}`)
  }
}

// ─── Module 4: ALCO Brief ───

async function generateAlcoBrief() {
  console.log('🤖 Generating ALCO brief...')

  const yieldData = await safeLoadJson(YIELD_PATH)
  const auctionData = await safeLoadJson(AUCTION_PATH)
  const policyData = await safeLoadJson(POLICY_PATH)
  const macroData = await safeLoadJson(MACRO_PATH)
  const fiscalData = await safeLoadJson(FISCAL_PATH)
  const commodityData = await safeLoadJson(COMMODITY_PATH)
  const moneySupplyData = await safeLoadJson(MONEY_SUPPLY_PATH)

  // Build full context
  const parts = []

  if (yieldData?.daily?.length) {
    const latest = yieldData.daily[yieldData.daily.length - 1]
    parts.push(`## Yield Curve (${latest.date})`)
    parts.push(Object.entries(latest.yields).map(([t, y]) => `${t}: ${y}%`).join(', '))
    const y91d = latest.yields['91D']
    const y10y = latest.yields['10Y']
    if (y91d != null && y10y != null) {
      const spread = Math.round((y10y - y91d) * 100)
      parts.push(`10Y-91D spread: ${spread}bps`)
    }

    if (yieldData.daily.length > 1) {
      const prev = yieldData.daily[yieldData.daily.length - 2]
      const changes = Object.entries(latest.yields).map(([t, y]) => {
        const prevY = prev.yields[t]
        if (prevY == null) return null
        const bps = Math.round((y - prevY) * 100)
        return `${t}: ${bps > 0 ? '+' : ''}${bps}bps`
      }).filter(Boolean)
      parts.push(`Weekly changes: ${changes.join(', ')}`)
    }
  }

  if (auctionData?.auctions?.length) {
    parts.push('\n## Recent Auctions')
    for (const a of auctionData.auctions.slice(0, 6)) {
      parts.push(`${a.date} ${a.tenor} ${a.type}: cutoff=${a.cutoffYield}% bid-cover=${a.bidCoverRatio}x devolvement=${a.devolvementPct}%`)
    }
  }

  if (policyData) {
    parts.push('\n## Policy Rates')
    parts.push(`Repo: ${policyData.currentRates.repoRate}% | SDF: ${policyData.currentRates.reverseRepoRate}% | CRR: ${policyData.currentRates.crrRate}%`)
    parts.push(`Corridor: ${policyData.corridor.floor}% — ${policyData.corridor.ceiling}%`)
  }

  if (macroData?.snapshots?.length) {
    const latest = macroData.snapshots[0]
    parts.push('\n## Macro Indicators')
    parts.push(`CPI: ${latest.cpiHeadlineYoY}% (food: ${latest.cpiFoodYoY}%, non-food: ${latest.cpiNonFoodYoY}%)`)
    parts.push(`USD/BDT: ${latest.usdBdtRate} | FX reserves: $${latest.bbFxReservesBn}B | ADR: ${latest.advanceDepositRatio}%`)
    parts.push(`Call money rate: ${latest.callMoneyRate}%`)
  }

  if (moneySupplyData?.monthly?.length) {
    const latest = moneySupplyData.monthly[moneySupplyData.monthly.length - 1]
    parts.push('\n## Liquidity')
    parts.push(`Excess liquidity: ${(latest.excessLiquidityCrore / 100000).toFixed(1)} lakh crore`)
    parts.push(`M2 growth: ${latest.m2GrowthYoY}% | Call money volume: ${latest.callMoneyVolumeCrore} crore`)
  }

  if (fiscalData) {
    parts.push('\n## Fiscal')
    parts.push(`Revenue collection: ${fiscalData.revenue.collectionRatioPct}% of target (${fiscalData.fiscalYear})`)
    parts.push(`ADP implementation: ${fiscalData.adp.implementationRatePct}%`)
    parts.push(`Total debt: ${fiscalData.debt.totalDebtLakhCrore} lakh crore (${fiscalData.debt.debtToGdpPct}% of GDP)`)
    parts.push(`Interest-to-revenue: ${fiscalData.debt.interestToRevenuePct}%`)
  }

  if (commodityData) {
    parts.push('\n## Commodities')
    parts.push(`Brent crude: $${commodityData.oil.brentUsd}/bbl`)
    parts.push(`JKM LNG: $${commodityData.lng.jkmUsdMmbtu}/mmbtu`)
  }

  const context = parts.join('\n')

  if (!context.trim()) {
    console.log('ℹ️ No data available for ALCO brief.')
    return
  }

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1500,
      system: `You are a senior fixed income strategist at a major Bangladeshi bank. Generate a concise ALCO (Asset-Liability Committee) brief from the provided market data.

The brief must be structured as follows:
## Market Snapshot
2-3 sentences on current yield levels, curve shape, and what changed this week.

## Liquidity Assessment
2-3 sentences on system liquidity, call money conditions, and BB operations.

## Key Risks
3-4 bullet points on active risks (auction demand, inflation, FX, fiscal).

## Positioning Recommendation
2-3 sentences on duration positioning, which part of the curve offers value, and any tactical trades.

## Watchpoints for Next Week
3-4 bullet points on upcoming events/data that could move markets.

Rules:
- Use specific numbers from the data provided
- Keep total brief under 400 words
- Write for an ALCO audience (bank CFO, treasurer, risk head)
- Focus on actionable intelligence, not generic commentary
- Reference Bangladesh-specific factors (BB policy, fiscal dynamics, seasonal patterns)`,
      messages: [{
        role: 'user',
        content: `Generate the ALCO brief from this data:\n\n${context}`,
      }],
    })

    const briefText = response.content[0]?.type === 'text' ? response.content[0].text : ''

    const result = {
      brief: briefText.trim(),
      generatedAt: new Date().toISOString(),
      attribution: 'Human-directed, AI-assisted intelligence.',
    }

    await writeFile(ALCO_BRIEF_PATH, JSON.stringify(result, null, 2))
    console.log('✅ ALCO brief saved.')
  } catch (err) {
    console.warn(`⚠️ Failed ALCO brief: ${err.message}`)
  }
}

// ─── Main ───

async function main() {
  await generateAutopsies()
  await generateWeeklyCommentary()
  await generateCurveInterpretation()
  await generateAlcoBrief()
  console.log('🎯 AI analysis complete.')
}

main().catch(err => {
  console.error('❌ AI analysis failed:', err)
  process.exit(0)
})
