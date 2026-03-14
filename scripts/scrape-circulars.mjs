#!/usr/bin/env node

/**
 * Scrape BB circulars listing
 */

import { readFile, writeFile } from 'fs/promises'
import { parseCirculars } from './lib/bb-parser.mjs'

const BB_CIRCULAR_URL = 'https://www.bb.org.bd/en/index.php/mediaroom/circular'
const DATA_PATH = './public/data/bb_circulars.json'

async function main() {
  console.log('🔍 Scraping BB circulars...')

  let html
  try {
    const res = await fetch(BB_CIRCULAR_URL, {
      headers: { 'User-Agent': 'YieldScope/1.0 (github.com/clauding-lab/YieldScope)' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    html = await res.text()
    console.log(`✅ Fetched BB circulars page (${html.length} bytes)`)
  } catch (err) {
    console.warn(`⚠️ Failed to fetch BB circulars: ${err.message}`)
    process.exit(0)
  }

  const parsed = parseCirculars(html)
  console.log(`📊 Parsed ${parsed.length} circular(s)`)

  let existing
  try {
    const raw = await readFile(DATA_PATH, 'utf-8')
    existing = JSON.parse(raw)
  } catch {
    existing = { lastUpdated: new Date().toISOString(), circulars: [] }
  }

  // Merge — deduplicate by title + date
  let added = 0
  for (const circ of parsed) {
    const exists = existing.circulars.some(
      c => c.title === circ.title && c.date === circ.date
    )
    if (!exists) {
      existing.circulars.unshift(circ)
      added++
    }
  }

  // Sort by date descending, keep last 100
  existing.circulars.sort((a, b) => b.date.localeCompare(a.date))
  existing.circulars = existing.circulars.slice(0, 100)
  existing.lastUpdated = new Date().toISOString()

  await writeFile(DATA_PATH, JSON.stringify(existing, null, 2))
  console.log(`✅ Circulars saved. ${added} new.`)
}

main().catch(err => {
  console.error('❌ Circulars scrape failed:', err)
  process.exit(0)
})
