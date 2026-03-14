#!/usr/bin/env node

/**
 * Scrape Tuesday T-Bond (BGTB) auction results from Bangladesh Bank
 * Runs on Thursday via GitHub Actions
 */

import { readFile, writeFile } from 'fs/promises'
import { parseTBondResults } from './lib/bb-parser.mjs'

const BB_TBOND_URL = 'https://www.bb.org.bd/en/index.php/auction/tbond'
const DATA_PATH = './public/data/auction_results.json'

async function main() {
  console.log('🔍 Scraping T-Bond auction results from BB...')

  let html
  try {
    const res = await fetch(BB_TBOND_URL, {
      headers: { 'User-Agent': 'YieldScope/1.0 (github.com/clauding-lab/YieldScope)' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    html = await res.text()
    console.log(`✅ Fetched BB T-Bond page (${html.length} bytes)`)
  } catch (err) {
    console.warn(`⚠️ Failed to fetch BB T-Bond page: ${err.message}`)
    process.exit(0)
  }

  const parsed = parseTBondResults(html)
  if (parsed.length === 0) {
    console.log('ℹ️ No T-Bond results parsed.')
    process.exit(0)
  }

  console.log(`📊 Parsed ${parsed.length} T-Bond result(s)`)

  let existing
  try {
    const raw = await readFile(DATA_PATH, 'utf-8')
    existing = JSON.parse(raw)
  } catch {
    existing = { lastUpdated: new Date().toISOString(), auctions: [] }
  }

  // Determine auction date (most recent Tuesday)
  const today = new Date()
  const dayOfWeek = today.getDay()
  const tuesdayOffset = (dayOfWeek + 5) % 7 // days since last Tuesday
  const lastTuesday = new Date(today)
  lastTuesday.setDate(today.getDate() - tuesdayOffset)
  const auctionDate = lastTuesday.toISOString().split('T')[0]

  let added = 0
  for (const result of parsed) {
    const id = `${auctionDate}-${result.tenor}`
    const existsIdx = existing.auctions.findIndex(a => a.id === id)

    const previousForTenor = existing.auctions.find(
      a => a.tenor === result.tenor && a.date !== auctionDate
    )
    const yieldChangeBps = previousForTenor
      ? Math.round((result.cutoffYield - previousForTenor.cutoffYield) * 100)
      : 0

    const entry = {
      id,
      date: auctionDate,
      type: 'BGTB',
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
      couponRate: result.couponRate,
      isReissue: false,
      autopsy: null,
    }

    if (existsIdx >= 0) {
      existing.auctions[existsIdx] = { ...existing.auctions[existsIdx], ...entry }
    } else {
      existing.auctions.unshift(entry)
      added++
    }
  }

  existing.auctions.sort((a, b) => b.date.localeCompare(a.date))
  existing.lastUpdated = new Date().toISOString()

  await writeFile(DATA_PATH, JSON.stringify(existing, null, 2))
  console.log(`✅ T-Bond results saved. ${added} new, ${parsed.length - added} updated.`)
}

main().catch(err => {
  console.error('❌ T-Bond scrape failed:', err)
  process.exit(0)
})
