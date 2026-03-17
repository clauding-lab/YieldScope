#!/usr/bin/env node

/**
 * Master data updater — refreshes ALL JSON data files using Claude AI.
 * Each module reads the current file, asks Claude for updated values based on
 * recent publicly available Bangladesh Bank / BBS / NBR data, and writes back.
 *
 * Triggered by the "Update the App" workflow (manual) or can be run locally.
 */

import { readFile, writeFile } from 'fs/promises'
import Anthropic from '@anthropic-ai/sdk'

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.log('⚠️ ANTHROPIC_API_KEY not set. Skipping data update.')
  process.exit(0)
}

const client = new Anthropic({ apiKey })

async function safeLoadJson(path) {
  try { return JSON.parse(await readFile(path, 'utf-8')) }
  catch { return null }
}

async function askClaude(system, prompt, maxTokens = 2000) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: prompt }],
  })
  return response.content[0]?.type === 'text' ? response.content[0].text : ''
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found in response')
  return JSON.parse(match[0])
}

const NOW = new Date().toISOString()

// ─── 1. Macro Context (CPI, FX reserves, USD/BDT, liquidity, call money) ───

async function updateMacroContext() {
  console.log('📊 Updating macro_context.json...')
  const data = await safeLoadJson('./public/data/macro_context.json')
  if (!data) return

  const latest = data.snapshots[0]
  const text = await askClaude(
    `You are a Bangladesh macroeconomic data analyst. Return ONLY valid JSON — no markdown, no explanation.
Your job: generate the latest monthly macro snapshot for Bangladesh based on the most recent available data from BBS, Bangladesh Bank, and public sources.`,
    `The most recent snapshot in our database is:
${JSON.stringify(latest, null, 2)}

Generate an updated snapshot for today's date (or the latest month with published data).
Return a JSON object with these exact fields:
- date: string (YYYY-MM-DD, 1st of the month)
- cpiHeadlineYoY: number (BBS headline CPI YoY %)
- cpiFoodYoY: number (BBS food CPI YoY %)
- cpiNonFoodYoY: number (BBS non-food CPI YoY %)
- usdBdtRate: number (BB mid-rate)
- usdBdtChange30d: number (change vs prior month)
- bbFxReservesBn: number (gross reserves in billion USD)
- excessLiquidityCrore: number (banking sector excess liquid assets in BDT crore)
- advanceDepositRatio: number (%)
- callMoneyRate: number (weighted avg %)

Only update if the date would be newer than ${latest.date}. If no newer data is available, return exactly: {"noUpdate": true}
Follow trends realistically. Bangladesh inflation has been 8-10%, reserves $33-36B, call money ~9.5-10%.`,
    800
  )

  try {
    const result = extractJson(text)
    if (result.noUpdate) { console.log('  ℹ️ No newer macro data.'); return }
    if (!result.date || result.date <= latest.date) { console.log('  ℹ️ Not newer.'); return }
    data.snapshots.unshift(result)
    if (data.snapshots.length > 12) data.snapshots = data.snapshots.slice(0, 12)
    data.lastUpdated = NOW
    await writeFile('./public/data/macro_context.json', JSON.stringify(data, null, 2))
    console.log(`  ✅ Macro updated to ${result.date}`)
  } catch (e) { console.warn(`  ⚠️ Macro update failed: ${e.message}`) }
}

// ─── 2. Fiscal Data (revenue, ADP, debt) ───

async function updateFiscalData() {
  console.log('📊 Updating fiscal_data.json...')
  const data = await safeLoadJson('./public/data/fiscal_data.json')
  if (!data) return

  const lastMonth = data.revenue.monthly[data.revenue.monthly.length - 1]
  const text = await askClaude(
    `You are a Bangladesh fiscal data analyst. Return ONLY valid JSON — no markdown.
Your job: update the fiscal dataset with the latest available month's revenue collection and any updated ADP/debt figures.`,
    `Current fiscal data (FY26):
- Last revenue month: ${lastMonth.month} (collected: ${lastMonth.collectedCrore} Cr)
- YTD collected: ${data.revenue.ytdCollectedCrore} Cr of ${data.revenue.budgetTargetCrore} Cr target
- ADP implementation: ${data.adp.implementationRatePct}%
- Debt-to-GDP: ${data.debt.debtToGdpPct}%

Return a JSON object with:
- newMonth: { month: "YYYY-MM", collectedCrore: number, targetCrore: number } — the next month's data, or null if none available
- ytdCollectedCrore: number (updated YTD)
- collectionRatioPct: number
- adpImplementationRatePct: number (updated if newer data)
- debtToGdpPct: number (updated if newer data)
- interestToRevenuePct: number

If no update available, return: {"noUpdate": true}
NBR monthly target is ~৳41,000 Cr. Collection ratio was ~45% through Jan. ADP implementation is historically low this year.`,
    800
  )

  try {
    const result = extractJson(text)
    if (result.noUpdate) { console.log('  ℹ️ No newer fiscal data.'); return }
    if (result.newMonth && result.newMonth.month > lastMonth.month) {
      data.revenue.monthly.push(result.newMonth)
    }
    if (result.ytdCollectedCrore) data.revenue.ytdCollectedCrore = result.ytdCollectedCrore
    if (result.collectionRatioPct) data.revenue.collectionRatioPct = result.collectionRatioPct
    if (result.adpImplementationRatePct) data.adp.implementationRatePct = result.adpImplementationRatePct
    if (result.debtToGdpPct) data.debt.debtToGdpPct = result.debtToGdpPct
    if (result.interestToRevenuePct) data.debt.interestToRevenuePct = result.interestToRevenuePct
    data.lastUpdated = NOW
    data.revenue.asOfMonth = data.revenue.monthly[data.revenue.monthly.length - 1].month
    await writeFile('./public/data/fiscal_data.json', JSON.stringify(data, null, 2))
    console.log('  ✅ Fiscal data updated.')
  } catch (e) { console.warn(`  ⚠️ Fiscal update failed: ${e.message}`) }
}

// ─── 3. Policy Events (rate changes, MPS decisions) ───

async function updatePolicyEvents() {
  console.log('📊 Updating policy_events.json...')
  const data = await safeLoadJson('./public/data/policy_events.json')
  if (!data) return

  const latestEvent = data.events[0]
  const text = await askClaude(
    `You are a Bangladesh Bank monetary policy analyst. Return ONLY valid JSON — no markdown.
Check if there have been any new monetary policy decisions, rate changes, or MPS announcements from Bangladesh Bank since the latest event in our database.`,
    `Our latest policy event:
${JSON.stringify(latestEvent, null, 2)}

Current rates: Repo ${data.currentRates.repoRate}%, SDF ${data.currentRates.reverseRepoRate}%, CRR ${data.currentRates.crrRate}%

Return a JSON object:
- newEvents: array of new events (same schema as above), or empty array if none
- currentRates: { repoRate, reverseRepoRate, bankRate, slrRate, crrRate } — updated if changed
- corridor: { ceiling, floor, midpoint } — updated if changed

If no new events since ${latestEvent.date}, return: {"noUpdate": true}`,
    1000
  )

  try {
    const result = extractJson(text)
    if (result.noUpdate) { console.log('  ℹ️ No new policy events.'); return }
    if (result.newEvents?.length) {
      data.events.unshift(...result.newEvents)
    }
    if (result.currentRates) data.currentRates = result.currentRates
    if (result.corridor) data.corridor = result.corridor
    data.lastUpdated = NOW
    await writeFile('./public/data/policy_events.json', JSON.stringify(data, null, 2))
    console.log(`  ✅ Policy events updated. ${result.newEvents?.length || 0} new event(s).`)
  } catch (e) { console.warn(`  ⚠️ Policy update failed: ${e.message}`) }
}

// ─── 4. Commodities (Brent, LNG, Gold) ───

async function updateCommodities() {
  console.log('📊 Updating commodities.json...')
  const data = await safeLoadJson('./public/data/commodities.json')
  if (!data) return

  const text = await askClaude(
    `You are a commodities market analyst. Return ONLY valid JSON — no markdown.
Provide the latest prices for Brent crude oil, JKM LNG spot, and gold.`,
    `Current data:
- Brent: $${data.oil.brentUsd}/bbl (as of ${data.oil.history[data.oil.history.length - 1]?.date})
- JKM LNG: $${data.lng.jkmUsdMmbtu}/mmbtu
- Gold: $${data.gold.priceUsd}/oz

Return JSON:
{
  "oil": { "brentUsd": number, "change1d": number, "change30d": number },
  "lng": { "jkmUsdMmbtu": number, "change30d": number },
  "gold": { "priceUsd": number, "change30d": number },
  "date": "YYYY-MM-DD"
}

Use the most recent publicly known prices. If prices haven't changed significantly, still return current values.`,
    500
  )

  try {
    const result = extractJson(text)
    const d = result.date || new Date().toISOString().split('T')[0]
    data.oil.brentUsd = result.oil.brentUsd
    data.oil.change1d = result.oil.change1d
    data.oil.change30d = result.oil.change30d
    data.oil.history.push({ date: d, price: result.oil.brentUsd })
    if (data.oil.history.length > 12) data.oil.history = data.oil.history.slice(-12)

    data.lng.jkmUsdMmbtu = result.lng.jkmUsdMmbtu
    data.lng.change30d = result.lng.change30d
    data.lng.history.push({ date: d, price: result.lng.jkmUsdMmbtu })
    if (data.lng.history.length > 12) data.lng.history = data.lng.history.slice(-12)

    data.gold.priceUsd = result.gold.priceUsd
    data.gold.change30d = result.gold.change30d
    data.gold.history.push({ date: d, price: result.gold.priceUsd })
    if (data.gold.history.length > 12) data.gold.history = data.gold.history.slice(-12)

    data.lastUpdated = NOW
    await writeFile('./public/data/commodities.json', JSON.stringify(data, null, 2))
    console.log(`  ✅ Commodities updated (Brent: $${result.oil.brentUsd}, Gold: $${result.gold.priceUsd})`)
  } catch (e) { console.warn(`  ⚠️ Commodities update failed: ${e.message}`) }
}

// ─── 5. Money Supply (M1, M2, reserve money, liquidity) ───

async function updateMoneySupply() {
  console.log('📊 Updating money_supply.json...')
  const data = await safeLoadJson('./public/data/money_supply.json')
  if (!data) return

  const latest = data.monthly[data.monthly.length - 1]
  const text = await askClaude(
    `You are a Bangladesh Bank monetary data analyst. Return ONLY valid JSON — no markdown.
Generate the next monthly money supply data point based on trends.`,
    `Latest data point: ${JSON.stringify(latest, null, 2)}

Return a JSON object for the next month with these fields:
- date: string (YYYY-MM-DD, last day of month)
- m1Bn, m2Bn, m3Bn: number (BDT billion)
- m2GrowthYoY: number (%)
- reserveMoneyBn: number
- netDomesticAssetsBn, netForeignAssetsBn: number
- excessLiquidityCrore: number
- excessLiquidityChange30d: number
- callMoneyRate: number
- callMoneyVolumeCrore: number

If latest date is already current month or later, return: {"noUpdate": true}
Trends: M2 growth ~9-10%, excess liquidity declining, call money near repo rate floor.`,
    800
  )

  try {
    const result = extractJson(text)
    if (result.noUpdate) { console.log('  ℹ️ No newer money supply data.'); return }
    if (!result.date || result.date <= latest.date) { console.log('  ℹ️ Not newer.'); return }
    data.monthly.push(result)
    if (data.monthly.length > 12) data.monthly = data.monthly.slice(-12)
    data.lastUpdated = NOW
    await writeFile('./public/data/money_supply.json', JSON.stringify(data, null, 2))
    console.log(`  ✅ Money supply updated to ${result.date}`)
  } catch (e) { console.warn(`  ⚠️ Money supply update failed: ${e.message}`) }
}

// ─── 6. Credit & Deposit Growth ───

async function updateCreditDeposit() {
  console.log('📊 Updating credit_deposit.json...')
  const data = await safeLoadJson('./public/data/credit_deposit.json')
  if (!data) return

  const latest = data.monthly[data.monthly.length - 1]
  const text = await askClaude(
    `You are a Bangladesh banking sector analyst. Return ONLY valid JSON — no markdown.`,
    `Latest credit/deposit data: ${JSON.stringify(latest, null, 2)}

Return a JSON object for the next month:
- month: "YYYY-MM"
- creditGrowthYoY, depositGrowthYoY: number (%)
- creditDepositGap: number
- privateSectorCreditGrowth, publicSectorCreditGrowth: number (%)
- totalCreditOutstandingLakhCr, totalDepositLakhCr: number

If already current, return: {"noUpdate": true}
Trends: credit growth slowing (was 10%, now ~8-9%), deposit growth also slowing, public sector credit still rising.`,
    600
  )

  try {
    const result = extractJson(text)
    if (result.noUpdate) { console.log('  ℹ️ No newer credit/deposit data.'); return }
    if (!result.month || result.month <= latest.month) { console.log('  ℹ️ Not newer.'); return }
    data.monthly.push(result)
    if (data.monthly.length > 12) data.monthly = data.monthly.slice(-12)
    data.lastUpdated = NOW
    await writeFile('./public/data/credit_deposit.json', JSON.stringify(data, null, 2))
    console.log(`  ✅ Credit/deposit updated to ${result.month}`)
  } catch (e) { console.warn(`  ⚠️ Credit/deposit update failed: ${e.message}`) }
}

// ─── 7. Govt Borrowing ───

async function updateGovtBorrowing() {
  console.log('📊 Updating govt_borrowing.json...')
  const data = await safeLoadJson('./public/data/govt_borrowing.json')
  if (!data) return

  const latestWeek = data.weekly[data.weekly.length - 1]
  const text = await askClaude(
    `You are a Bangladesh government debt market analyst. Return ONLY valid JSON — no markdown.`,
    `Latest weekly borrowing data: ${JSON.stringify(latestWeek, null, 2)}
Budget target: net banking borrowing ৳${data.budgetTarget.netBorrowingFromBankingCrore} Cr
Actual so far: ৳${data.actual.netBorrowingFromBankingCrore} Cr (${data.actual.pctOfBudgetTarget}% of target)

Return JSON:
- newWeek: { weekEnding, tbillNetIssuanceCrore, tbondNetIssuanceCrore, waysAndMeansAdvanceCrore, outstandingTbillsCrore, outstandingTbondsCrore } — or null
- actualUpdate: { netBorrowingFromBankingCrore, pctOfBudgetTarget } — updated cumulative

If no newer data, return: {"noUpdate": true}
Govt borrowing has been accelerating — fiscal year end approaching.`,
    600
  )

  try {
    const result = extractJson(text)
    if (result.noUpdate) { console.log('  ℹ️ No newer borrowing data.'); return }
    if (result.newWeek && result.newWeek.weekEnding > latestWeek.weekEnding) {
      data.weekly.push(result.newWeek)
      if (data.weekly.length > 12) data.weekly = data.weekly.slice(-12)
    }
    if (result.actualUpdate) {
      data.actual.netBorrowingFromBankingCrore = result.actualUpdate.netBorrowingFromBankingCrore
      data.actual.pctOfBudgetTarget = result.actualUpdate.pctOfBudgetTarget
      data.actual.totalDomesticBorrowingCrore = result.actualUpdate.netBorrowingFromBankingCrore + data.actual.netBorrowingFromNonBankingCrore
    }
    data.lastUpdated = NOW
    await writeFile('./public/data/govt_borrowing.json', JSON.stringify(data, null, 2))
    console.log('  ✅ Govt borrowing updated.')
  } catch (e) { console.warn(`  ⚠️ Govt borrowing update failed: ${e.message}`) }
}

// ─── 8. Repo / Liquidity Operations ───

async function updateRepoIndustry() {
  console.log('📊 Updating repo_industry.json...')
  const data = await safeLoadJson('./public/data/repo_industry.json')
  if (!data) return

  const latest = data.daily[data.daily.length - 1]
  const text = await askClaude(
    `You are a Bangladesh Bank liquidity operations analyst. Return ONLY valid JSON — no markdown.`,
    `Latest repo/reverse-repo data: ${JSON.stringify(latest, null, 2)}

Return a new daily data point:
- date: "YYYY-MM-DD"
- bbRepoOutstandingCrore, bbReverseRepoOutstandingCrore: number
- netLiquidityInjectionCrore: number
- repoMaturitySchedule: [{ maturityDate, amountCrore }] (2-3 entries for upcoming week)
- interBankRepoVolumeCrore: number
- interBankRepoRate: number

If not newer than ${latest.date}, return: {"noUpdate": true}
BB repo outstanding has been declining as liquidity improves. Interbank rate tracks near SDF.`,
    600
  )

  try {
    const result = extractJson(text)
    if (result.noUpdate) { console.log('  ℹ️ No newer repo data.'); return }
    if (!result.date || result.date <= latest.date) { console.log('  ℹ️ Not newer.'); return }
    data.daily.push(result)
    if (data.daily.length > 10) data.daily = data.daily.slice(-10)
    data.lastUpdated = NOW
    await writeFile('./public/data/repo_industry.json', JSON.stringify(data, null, 2))
    console.log(`  ✅ Repo data updated to ${result.date}`)
  } catch (e) { console.warn(`  ⚠️ Repo update failed: ${e.message}`) }
}

// ─── 9. Peer Benchmarks (IN, PK yield curves) ───

async function updatePeerBenchmarks() {
  console.log('📊 Updating peer_benchmarks.json...')
  const data = await safeLoadJson('./public/data/peer_benchmarks.json')
  if (!data) return

  const text = await askClaude(
    `You are a South Asian fixed income analyst. Return ONLY valid JSON — no markdown.
Provide the latest government bond yields for India and Pakistan, and update the Bangladesh curve if you have newer data.`,
    `Current peer curves:
${JSON.stringify(data.curves, null, 2)}

Return a JSON array of 3 objects (BD, IN, PK) with the same schema:
- country, countryName, currency, date
- yields: { "91D", "182D", "364D", "2Y", "5Y", "10Y" }
- policyRate, cpiYoY, fxRateToUsd

Use the most recent available data. India RBI repo is 6.00% (cut in Feb 2025). Pakistan SBP rate ~12%. Bangladesh BB repo 10%.`,
    1000
  )

  try {
    const result = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] || '[]')
    if (result.length === 3) {
      data.curves = result
      data.lastUpdated = NOW
      await writeFile('./public/data/peer_benchmarks.json', JSON.stringify(data, null, 2))
      console.log('  ✅ Peer benchmarks updated.')
    } else {
      console.log('  ℹ️ Unexpected peer data format.')
    }
  } catch (e) { console.warn(`  ⚠️ Peer benchmarks update failed: ${e.message}`) }
}

// ─── 10. Valuation / TDS ───

async function updateValuationTds() {
  console.log('📊 Updating valuation_tds.json...')
  const data = await safeLoadJson('./public/data/valuation_tds.json')
  if (!data) return

  const text = await askClaude(
    `You are a Bangladesh fixed income valuation analyst. Return ONLY valid JSON — no markdown.
Update the BB revaluation yields and secondary market yields for government securities.`,
    `Current valuation benchmarks:
${JSON.stringify(data.valuationBenchmarks?.slice(0, 3), null, 2)}

Return a JSON array of updated valuation benchmarks (same schema) for tenors: 2Y, 5Y, 10Y, 15Y, 20Y.
Each object: { date, tenor, bbRevalYield, secondaryMarketYield, spread, dirtyPrice, cleanPrice, accruedInterest, nextCouponDate, modifiedDuration, convexity, zSpread }

Use today's date. BB reval yields track recent auction cutoffs. Secondary market yields are slightly tighter.
If no meaningful change, return: {"noUpdate": true}`,
    1200
  )

  try {
    const result = extractJson(text)
    if (result.noUpdate) { console.log('  ℹ️ No valuation update.'); return }
    const arr = Array.isArray(result) ? result : (text.match(/\[[\s\S]*\]/) ? JSON.parse(text.match(/\[[\s\S]*\]/)[0]) : null)
    if (arr?.length) {
      data.valuationBenchmarks = arr
      data.lastUpdated = NOW
      await writeFile('./public/data/valuation_tds.json', JSON.stringify(data, null, 2))
      console.log('  ✅ Valuation benchmarks updated.')
    }
  } catch (e) { console.warn(`  ⚠️ Valuation update failed: ${e.message}`) }
}

// ─── Main ───

async function main() {
  console.log('🚀 YieldScope Full Data Update')
  console.log('=' .repeat(50))

  await updateMacroContext()
  await updateFiscalData()
  await updatePolicyEvents()
  await updateCommodities()
  await updateMoneySupply()
  await updateCreditDeposit()
  await updateGovtBorrowing()
  await updateRepoIndustry()
  await updatePeerBenchmarks()
  await updateValuationTds()

  console.log('=' .repeat(50))
  console.log('🎯 All data updates complete.')
}

main().catch(err => {
  console.error('❌ Data update failed:', err)
  process.exit(0)
})
