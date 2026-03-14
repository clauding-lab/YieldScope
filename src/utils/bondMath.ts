import type { BondHolding, PortfolioMetrics, ScenarioResult } from '../types'

/**
 * Calculate bond price from yield (semi-annual coupon, 30/360 day count)
 */
export function calculatePrice(
  faceValue: number,
  couponRate: number,
  yieldRate: number,
  yearsToMaturity: number,
  frequency: number = 2,
): number {
  if (yearsToMaturity <= 0) return faceValue
  if (couponRate === 0) {
    // Zero-coupon (T-Bill discount)
    return faceValue / Math.pow(1 + yieldRate / frequency, yearsToMaturity * frequency)
  }

  const periods = yearsToMaturity * frequency
  const couponPerPeriod = (couponRate * faceValue) / frequency
  const yieldPerPeriod = yieldRate / frequency

  if (yieldPerPeriod === 0) {
    return couponPerPeriod * periods + faceValue
  }

  const pvCoupons = couponPerPeriod * (1 - Math.pow(1 + yieldPerPeriod, -periods)) / yieldPerPeriod
  const pvFace = faceValue / Math.pow(1 + yieldPerPeriod, periods)

  return pvCoupons + pvFace
}

/**
 * Macaulay duration (in years)
 */
export function calculateMacaulayDuration(
  couponRate: number,
  yieldRate: number,
  yearsToMaturity: number,
  frequency: number = 2,
): number {
  if (yearsToMaturity <= 0) return 0
  if (couponRate === 0) return yearsToMaturity

  const periods = yearsToMaturity * frequency
  const couponPerPeriod = couponRate / frequency
  const yieldPerPeriod = yieldRate / frequency

  let weightedPV = 0
  let totalPV = 0

  for (let t = 1; t <= periods; t++) {
    const cf = t < periods ? couponPerPeriod : couponPerPeriod + 1
    const pv = cf / Math.pow(1 + yieldPerPeriod, t)
    weightedPV += (t / frequency) * pv
    totalPV += pv
  }

  return totalPV > 0 ? weightedPV / totalPV : 0
}

/**
 * Modified duration = Macaulay Duration / (1 + yield/frequency)
 */
export function calculateModifiedDuration(
  couponRate: number,
  yieldRate: number,
  yearsToMaturity: number,
  frequency: number = 2,
): number {
  const macD = calculateMacaulayDuration(couponRate, yieldRate, yearsToMaturity, frequency)
  return macD / (1 + yieldRate / frequency)
}

/**
 * Convexity measure
 */
export function calculateConvexity(
  couponRate: number,
  yieldRate: number,
  yearsToMaturity: number,
  frequency: number = 2,
): number {
  if (yearsToMaturity <= 0) return 0
  if (couponRate === 0) {
    const n = yearsToMaturity * frequency
    return (n * (n + 1)) / (frequency * frequency * Math.pow(1 + yieldRate / frequency, 2))
  }

  const periods = yearsToMaturity * frequency
  const couponPerPeriod = couponRate / frequency
  const yieldPerPeriod = yieldRate / frequency

  let sumWeighted = 0
  let totalPV = 0

  for (let t = 1; t <= periods; t++) {
    const cf = t < periods ? couponPerPeriod : couponPerPeriod + 1
    const pv = cf / Math.pow(1 + yieldPerPeriod, t)
    sumWeighted += t * (t + 1) * pv
    totalPV += pv
  }

  return totalPV > 0
    ? sumWeighted / (totalPV * frequency * frequency * Math.pow(1 + yieldPerPeriod, 2))
    : 0
}

/**
 * PV01: BDT value change for 1bp move per crore face value
 */
export function calculatePV01(
  faceValueCrore: number,
  modifiedDuration: number,
  pricePercentOfFace: number,
): number {
  return faceValueCrore * (pricePercentOfFace / 100) * modifiedDuration * 0.0001
}

/**
 * Years to maturity from dates
 */
export function yearsToMaturity(maturityDate: string, fromDate?: string): number {
  const maturity = new Date(maturityDate)
  const from = fromDate ? new Date(fromDate) : new Date()
  const diffMs = maturity.getTime() - from.getTime()
  return Math.max(0, diffMs / (365.25 * 24 * 60 * 60 * 1000))
}

/**
 * Calculate MTM for a single holding
 */
export function calculateMTM(
  holding: BondHolding,
  currentYield: number,
): { marketValue: number; unrealizedPL: number; pricePercent: number } {
  const ytm = yearsToMaturity(holding.maturityDate)
  const currentPrice = calculatePrice(holding.faceValueCrore, holding.couponRate / 100, currentYield / 100, ytm)
  const purchasePrice = calculatePrice(holding.faceValueCrore, holding.couponRate / 100, holding.purchaseYield / 100, yearsToMaturity(holding.maturityDate, holding.purchaseDate))

  return {
    marketValue: currentPrice,
    unrealizedPL: currentPrice - purchasePrice,
    pricePercent: (currentPrice / holding.faceValueCrore) * 100,
  }
}

/**
 * Calculate portfolio-level metrics
 */
export function calculatePortfolioMetrics(
  holdings: BondHolding[],
  currentYields: Record<string, number>,
): PortfolioMetrics {
  let totalFaceValue = 0
  let totalMarketValue = 0
  let totalPurchaseValue = 0
  let weightedDuration = 0
  let weightedConvexity = 0
  let totalPV01 = 0

  for (const h of holdings) {
    const yld = currentYields[h.tenor]
    if (yld === undefined) continue

    const ytm = yearsToMaturity(h.maturityDate)
    const price = calculatePrice(h.faceValueCrore, h.couponRate / 100, yld / 100, ytm)
    const purchasePrice = calculatePrice(h.faceValueCrore, h.couponRate / 100, h.purchaseYield / 100, yearsToMaturity(h.maturityDate, h.purchaseDate))
    const modDur = calculateModifiedDuration(h.couponRate / 100, yld / 100, ytm)
    const conv = calculateConvexity(h.couponRate / 100, yld / 100, ytm)
    const pricePercent = (price / h.faceValueCrore) * 100
    const pv01 = calculatePV01(h.faceValueCrore, modDur, pricePercent)

    totalFaceValue += h.faceValueCrore
    totalMarketValue += price
    totalPurchaseValue += purchasePrice
    weightedDuration += modDur * price
    weightedConvexity += conv * price
    totalPV01 += pv01
  }

  return {
    totalFaceValue,
    totalMarketValue,
    unrealizedPL: totalMarketValue - totalPurchaseValue,
    weightedModifiedDuration: totalMarketValue > 0 ? weightedDuration / totalMarketValue : 0,
    weightedConvexity: totalMarketValue > 0 ? weightedConvexity / totalMarketValue : 0,
    portfolioPV01: totalPV01,
  }
}

/**
 * Apply a parallel yield shock to the portfolio
 */
export function applyShock(
  holdings: BondHolding[],
  currentYields: Record<string, number>,
  shockBps: number,
): ScenarioResult {
  const shockDecimal = shockBps / 100 // bps to percentage points

  let newTotalMV = 0
  let currentTotalMV = 0
  const perBondResults: ScenarioResult['perBondResults'] = []

  for (const h of holdings) {
    const yld = currentYields[h.tenor]
    if (yld === undefined) continue

    const ytm = yearsToMaturity(h.maturityDate)
    const currentPrice = calculatePrice(h.faceValueCrore, h.couponRate / 100, yld / 100, ytm)
    const shockedPrice = calculatePrice(h.faceValueCrore, h.couponRate / 100, (yld + shockDecimal) / 100, ytm)

    currentTotalMV += currentPrice
    newTotalMV += shockedPrice

    perBondResults.push({
      holdingId: h.id,
      newPrice: shockedPrice,
      plChange: shockedPrice - currentPrice,
    })
  }

  return {
    shockBps,
    newMarketValue: newTotalMV,
    plChange: newTotalMV - currentTotalMV,
    plChangePct: currentTotalMV > 0 ? ((newTotalMV - currentTotalMV) / currentTotalMV) * 100 : 0,
    perBondResults,
  }
}
