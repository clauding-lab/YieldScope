#!/usr/bin/env node

/**
 * Update yield_data.json from latest auction cutoff yields
 */

import { readFile, writeFile } from 'fs/promises'

const AUCTION_PATH = './public/data/auction_results.json'
const YIELD_PATH = './public/data/yield_data.json'

async function main() {
  console.log('📈 Updating yield curve from latest auctions...')

  const auctionRaw = await readFile(AUCTION_PATH, 'utf-8')
  const auctionData = JSON.parse(auctionRaw)

  const yieldRaw = await readFile(YIELD_PATH, 'utf-8')
  const yieldData = JSON.parse(yieldRaw)

  // Get latest cutoff yield for each tenor from recent auctions
  const tenors = ['91D', '182D', '364D', '2Y', '5Y', '10Y', '15Y', '20Y']
  const latestYields = {}

  for (const tenor of tenors) {
    const latest = auctionData.auctions.find(a => a.tenor === tenor)
    if (latest) {
      latestYields[tenor] = latest.cutoffYield
    }
  }

  // Only proceed if we have at least some yields
  const filledTenors = Object.keys(latestYields).length
  if (filledTenors === 0) {
    console.log('ℹ️ No auction yields found. Skipping yield curve update.')
    return
  }

  // Fill missing tenors from existing data
  if (yieldData.daily.length > 0) {
    const existingLatest = yieldData.daily[yieldData.daily.length - 1]
    for (const tenor of tenors) {
      if (!latestYields[tenor] && existingLatest.yields[tenor]) {
        latestYields[tenor] = existingLatest.yields[tenor]
      }
    }
  }

  const today = new Date().toISOString().split('T')[0]

  // Check if today's entry already exists
  const existingIdx = yieldData.daily.findIndex(d => d.date === today)
  if (existingIdx >= 0) {
    yieldData.daily[existingIdx].yields = latestYields
  } else {
    yieldData.daily.push({ date: today, yields: latestYields })
  }

  // Sort by date and keep reasonable history
  yieldData.daily.sort((a, b) => a.date.localeCompare(b.date))

  // Update curve comparison dates
  const dates = yieldData.daily.map(d => d.date)
  const latestDate = dates[dates.length - 1]

  function findClosestDate(targetDate) {
    const target = new Date(targetDate).getTime()
    let closest = dates[0]
    let minDiff = Math.abs(new Date(dates[0]).getTime() - target)
    for (const d of dates) {
      const diff = Math.abs(new Date(d).getTime() - target)
      if (diff < minDiff) {
        minDiff = diff
        closest = d
      }
    }
    return closest
  }

  const now = new Date(latestDate)
  yieldData.curves = {
    latest: latestDate,
    oneWeekAgo: findClosestDate(new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0]),
    oneMonthAgo: findClosestDate(new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0]),
    threeMonthsAgo: findClosestDate(new Date(now.getTime() - 90 * 86400000).toISOString().split('T')[0]),
    oneYearAgo: findClosestDate(new Date(now.getTime() - 365 * 86400000).toISOString().split('T')[0]),
  }

  yieldData.lastUpdated = new Date().toISOString()

  await writeFile(YIELD_PATH, JSON.stringify(yieldData, null, 2))
  console.log(`✅ Yield curve updated with ${filledTenors} tenor(s) for ${today}`)
}

main().catch(err => {
  console.error('❌ Yield curve update failed:', err)
  process.exit(0)
})
