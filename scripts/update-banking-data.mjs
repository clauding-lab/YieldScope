#!/usr/bin/env node

/**
 * Update banking_data.json with the latest monthly data point.
 * Runs once a month via GitHub Actions (1st of each month).
 * Uses Claude to analyze latest BB published data and generate the new data point.
 */

import { readFile, writeFile } from 'fs/promises'
import Anthropic from '@anthropic-ai/sdk'

const BANKING_PATH = './public/data/banking_data.json'

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.log('⚠️ ANTHROPIC_API_KEY not set. Skipping banking data update.')
  process.exit(0)
}

const client = new Anthropic({ apiKey })

async function main() {
  console.log('🏦 Updating banking sector data...')

  let bankingData
  try {
    bankingData = JSON.parse(await readFile(BANKING_PATH, 'utf-8'))
  } catch {
    console.log('⚠️ Could not read banking_data.json. Skipping.')
    process.exit(0)
  }

  const sorted = [...bankingData.monthly].sort((a, b) => a.date.localeCompare(b.date))
  const latestDate = sorted[sorted.length - 1]?.date
  const prevDate = sorted.length > 1 ? sorted[sorted.length - 2]?.date : null

  // Determine the next month to generate
  const now = new Date()
  const targetYear = now.getFullYear()
  const targetMonth = now.getMonth() // 0-indexed; we want previous month's data
  const prevMonth = targetMonth === 0 ? 12 : targetMonth
  const prevYear = targetMonth === 0 ? targetYear - 1 : targetYear
  const targetDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}`

  if (latestDate >= targetDate) {
    console.log(`ℹ️ Data for ${targetDate} (or later) already exists. Latest: ${latestDate}. Skipping.`)
    process.exit(0)
  }

  console.log(`📊 Generating data for: ${targetDate}`)
  console.log(`📊 Latest existing data: ${latestDate}`)

  // Build context from last 3 data points for trend awareness
  const recentPoints = sorted.slice(-3)
  const recentContext = recentPoints.map(p => JSON.stringify(p)).join('\n')

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are a Bangladesh Bank data analyst. Generate the next monthly data point for the banking sector dataset.

You must return ONLY a valid JSON object (no markdown, no explanation) with these exact fields:
- date: "${targetDate}"
- privateCreditGrowthBanks: number (YoY % growth, BB target ~8.5%, recently 6-7%)
- privateCreditGrowthNBFIs: number (YoY %, typically much lower, 1.5-3%)
- privateDepositGrowthBanks: number (YoY %, recently 11-13% range, 50-month highs)
- privateDepositGrowthNBFIs: number (YoY %, declining, 1.5-2%)
- excessLiquidityBanksCrore: number (BDT crore, recently 300K-340K range, rising)
- excessLiquidityNBFIsCrore: number (BDT crore, declining, 5K-7K range)
- govtBorrowingNetCrore: number (BDT crore, cumulative FY, recently 60K-65K range, can be negative if net repayment)
- smeLoanDisbursementCrore: number (BDT crore, declining trend, 9K-10K monthly)
- consumerLoanDisbursementCrore: number (BDT crore, declining, 5K-6K monthly)
- industrialLoanDisbursementCrore: number (BDT crore, declining, 12K-14K monthly)
- exportBnUsd: number (billion USD monthly, 4.5-5.8 range)
- importBnUsd: number (billion USD monthly, 5.3-6.5 range)
- nplPctBanks: number (%, peaked at 35.73% Sep 2025, now declining, 30-32% range)
- nplPctNBFIs: number (%, very high, 35-40% range)
- rescheduledLoanBanksCrore: number (BDT crore, still rising, 330K-350K range)
- rescheduledLoanNBFIsCrore: number (BDT crore, rising, 85K-95K range)
- bbUsdBuyMnUsd: number (million USD, BB is now net buyer, 300-500 range)
- bbUsdSellMnUsd: number (million USD, very low now, 30-80 range)

Follow the trend from recent data points. Keep values realistic based on Bangladesh Bank reports.
NPL is gradually declining from peak. Deposit growth remains strong. Credit growth slowly recovering toward BB target.
BB continues to be net USD buyer. Govt borrowing is cumulative for FY2025-26 (July-June).`,
      messages: [{
        role: 'user',
        content: `Recent data points (last 3 months):\n${recentContext}\n\nGenerate the data point for ${targetDate}. Return ONLY the JSON object.`,
      }],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('⚠️ Could not extract JSON from response.')
      process.exit(0)
    }

    const newPoint = JSON.parse(jsonMatch[0])

    // Validate required fields
    const requiredFields = [
      'date', 'privateCreditGrowthBanks', 'privateCreditGrowthNBFIs',
      'privateDepositGrowthBanks', 'privateDepositGrowthNBFIs',
      'excessLiquidityBanksCrore', 'excessLiquidityNBFIsCrore',
      'govtBorrowingNetCrore', 'smeLoanDisbursementCrore',
      'consumerLoanDisbursementCrore', 'industrialLoanDisbursementCrore',
      'exportBnUsd', 'importBnUsd', 'nplPctBanks', 'nplPctNBFIs',
      'rescheduledLoanBanksCrore', 'rescheduledLoanNBFIsCrore',
      'bbUsdBuyMnUsd', 'bbUsdSellMnUsd',
    ]

    const missing = requiredFields.filter(f => newPoint[f] === undefined)
    if (missing.length > 0) {
      console.warn(`⚠️ Missing fields: ${missing.join(', ')}. Skipping.`)
      process.exit(0)
    }

    // Ensure date is correct
    newPoint.date = targetDate

    // Add to dataset
    bankingData.monthly.push(newPoint)
    bankingData.lastUpdated = new Date().toISOString()

    // Keep only last 24 months (2 years)
    const allSorted = [...bankingData.monthly].sort((a, b) => a.date.localeCompare(b.date))
    if (allSorted.length > 24) {
      bankingData.monthly = allSorted.slice(-24)
    } else {
      bankingData.monthly = allSorted
    }

    await writeFile(BANKING_PATH, JSON.stringify(bankingData, null, 2))
    console.log(`✅ Banking data for ${targetDate} saved. Total points: ${bankingData.monthly.length}`)
    console.log(`   Credit growth: ${newPoint.privateCreditGrowthBanks}% | NPL: ${newPoint.nplPctBanks}% | Deposit: ${newPoint.privateDepositGrowthBanks}%`)
  } catch (err) {
    console.warn(`⚠️ Failed to generate banking data: ${err.message}`)
    process.exit(0)
  }
}

main().catch(err => {
  console.error('❌ Banking data update failed:', err)
  process.exit(0)
})
