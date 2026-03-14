#!/usr/bin/env node

/**
 * Scrape Sunday T-Bill auction results from Bangladesh Bank
 * Runs on Tuesday via GitHub Actions
 */

import { readFile, writeFile } from 'fs/promises'
import { parseTBillResults, parseNumber } from './lib/bb-parser.mjs'

const BB_TBILL_URL = 'https://www.bb.org.bd/en/index.php/auction/tbill'
const DATA_PATH = './public/data/auction_results.json'

async function main() {
  console.log('🔍 Scraping T-Bill auction results from BB...')

  let html
  try {
    const res = await fetch(BB_TBILL_URL, {
      headers: { 'User-Agent': 'YieldScope/1.0 (github.com/clauding-lab/YieldScope)' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    html = await res.text()
    console.log(`✅ Fetched BB T-Bill page (${html.length} bytes)`)
  } catch (err) {
    console.warn(`⚠️ Failed to fetch BB T-Bill page: ${err.message}`)
    console.log('Exiting gracefully — will retry next run.')
    process.exit(0)
  }

  const parsed = parseTBillResults(html)
  if (parsed.length === 0) {
    console.log('ℹ️ No T-Bill results parsed. Page structure may have changed.')
    process.exit(0)
  }

  console.log(`📊 Parsed ${parsed.length} T-Bill result(s)`)

  // Load existing data
  let existing
  try {
    const raw = await readFile(DATA_PATH, 'utf-8')
    existing = JSON.parse(raw)
  } catch {
    existing = { lastUpdated: new Date().toISOString(), auctions: [] }
  }

  // Determine auction date (most recent Sunday)
  const today = new Date()
  const dayOfWeek = today.getDay()
  const sundayOffset = dayOfWeek === 0 ? 0 : dayOfWeek
  const lastSunday = new Date(today)
  lastSunday.setDate(today.getDate() - sundayOffset)
  const auctionDate = lastSunday.toISOString().split('T')[0]

  // Merge new results
  let added = 0
  for (const result of parsed) {
    const id = `${auctionDate}-${result.tenor}`
    const existsIdx = existing.auctions.findIndex(a => a.id === id)

    // Find previous auction for same tenor to compute yield change
    const previousForTenor = existing.auctions.find(
      a => a.tenor === result.tenor && a.date !== auctionDate
    )
    const yieldChangeBps = previousForTenor
      ? Math.round((result.cutoffYield - previousForTenor.cutoffYield) * 100)
      : 0

    const entry = {
      id,
      date: auctionDate,
      type: 'T-Bill',
      tenor: result.tenor,
      notifiedAmountCrore: result.notifiedAmountCrore,
      totalBidsCrore: result.totalBidsCrore,
      acceptedAmountCrore: result.acceptedAmountCrore,
      bidCoverRatio: result.bidCoverRatio,
      cutoffYield: result.cutoffYield,
      weightedAvgYield: result.weightedAvgYield,
      previousCutoffYield: previousForTenor?.cutoffYield ?? null,
      yieldChangeBps,
      devolvementCrore: result.devolvementCrore,
      devolvementPct: result.devolvementPct,
      couponRate: null,
      isReissue: false,
      autopsy: null, // Will be filled by generate-ai-analysis.mjs
    }

    if (existsIdx >= 0) {
      existing.auctions[existsIdx] = { ...existing.auctions[existsIdx], ...entry }
    } else {
      existing.auctions.unshift(entry)
      added++
    }
  }

  // Sort by date descending
  existing.auctions.sort((a, b) => b.date.localeCompare(a.date))
  existing.lastUpdated = new Date().toISOString()

  await writeFile(DATA_PATH, JSON.stringify(existing, null, 2))
  console.log(`✅ T-Bill results saved. ${added} new, ${parsed.length - added} updated.`)
}

main().catch(err => {
  console.error('❌ T-Bill scrape failed:', err)
  process.exit(0) // Exit 0 to not fail the workflow
})
