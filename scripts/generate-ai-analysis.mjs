#!/usr/bin/env node

/**
 * Generate AI analysis using Claude API:
 * - Module 1: Auction Autopsy (for new auctions without autopsy)
 * - Module 2: Weekly Curve Commentary (Thursday runs only)
 */

import { readFile, writeFile } from 'fs/promises'
import Anthropic from '@anthropic-ai/sdk'
import { AUTOPSY_SYSTEM, WEEKLY_SYSTEM, buildAutopsyPrompt, buildWeeklyPrompt } from './lib/ai-prompts.mjs'

const AUCTION_PATH = './public/data/auction_results.json'
const YIELD_PATH = './public/data/yield_data.json'
const MACRO_PATH = './public/data/macro_context.json'
const COMMENTARY_PATH = './public/data/weekly_commentary.json'

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.log('⚠️ ANTHROPIC_API_KEY not set. Skipping AI analysis.')
  process.exit(0)
}

const client = new Anthropic({ apiKey })

async function generateAutopsies() {
  console.log('🤖 Generating auction autopsies...')

  const raw = await readFile(AUCTION_PATH, 'utf-8')
  const data = JSON.parse(raw)

  // Find auctions needing autopsy
  const needsAutopsy = data.auctions.filter(a => !a.autopsy)
  if (needsAutopsy.length === 0) {
    console.log('ℹ️ All auctions already have autopsies.')
    return
  }

  console.log(`📝 ${needsAutopsy.length} auction(s) need autopsy`)

  // Load yield data for context
  let yieldData = null
  try {
    yieldData = JSON.parse(await readFile(YIELD_PATH, 'utf-8'))
  } catch { /* skip */ }

  const curveContext = yieldData?.daily?.length > 0
    ? Object.entries(yieldData.daily[yieldData.daily.length - 1].yields)
        .map(([t, y]) => `${t}: ${y}%`).join(', ')
    : null

  for (const auction of needsAutopsy.slice(0, 5)) { // max 5 per run
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

async function generateWeeklyCommentary() {
  // Only generate on Thursday runs
  const dayOfWeek = new Date().getDay()
  if (dayOfWeek !== 4) {
    console.log('ℹ️ Weekly commentary only generates on Thursday. Skipping.')
    return
  }

  console.log('🤖 Generating weekly commentary...')

  const auctionRaw = await readFile(AUCTION_PATH, 'utf-8')
  const auctionData = JSON.parse(auctionRaw)

  let yieldData = null
  try { yieldData = JSON.parse(await readFile(YIELD_PATH, 'utf-8')) } catch { /* skip */ }

  let macroData = null
  try {
    const macroRaw = JSON.parse(await readFile(MACRO_PATH, 'utf-8'))
    macroData = macroRaw.snapshots?.[macroRaw.snapshots.length - 1] ?? null
  } catch { /* skip */ }

  // Get this week's auctions (last 7 days)
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

    // Determine week ID
    const now = new Date()
    const weekNum = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7)
    const weekId = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
    const weekEnding = now.toISOString().split('T')[0]

    // Extract a title from the first sentence
    const firstSentence = body.split('.')[0] || 'Weekly Market Commentary'

    let commentaryData
    try {
      commentaryData = JSON.parse(await readFile(COMMENTARY_PATH, 'utf-8'))
    } catch {
      commentaryData = { lastUpdated: new Date().toISOString(), commentaries: [] }
    }

    // Don't duplicate
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
      attribution: 'Curated by Adnan Rashid · Produced with Claude AI',
    })

    commentaryData.lastUpdated = new Date().toISOString()
    await writeFile(COMMENTARY_PATH, JSON.stringify(commentaryData, null, 2))
    console.log(`✅ Weekly commentary ${weekId} saved.`)
  } catch (err) {
    console.warn(`⚠️ Failed to generate weekly commentary: ${err.message}`)
  }
}

async function main() {
  await generateAutopsies()
  await generateWeeklyCommentary()
  console.log('🎯 AI analysis complete.')
}

main().catch(err => {
  console.error('❌ AI analysis failed:', err)
  process.exit(0)
})
