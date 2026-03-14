import * as cheerio from 'cheerio'

/**
 * Normalize tenor strings from BB website to our format
 */
export function normalizeTenor(raw) {
  const s = raw.trim().toUpperCase().replace(/\s+/g, '')
  const map = {
    '91-DAY': '91D', '91DAY': '91D', '91D': '91D', '91DAYS': '91D',
    '182-DAY': '182D', '182DAY': '182D', '182D': '182D', '182DAYS': '182D',
    '364-DAY': '364D', '364DAY': '364D', '364D': '364D', '364DAYS': '364D',
    '2-YEAR': '2Y', '2YEAR': '2Y', '2Y': '2Y', '02YEAR': '2Y',
    '5-YEAR': '5Y', '5YEAR': '5Y', '5Y': '5Y', '05YEAR': '5Y',
    '10-YEAR': '10Y', '10YEAR': '10Y', '10Y': '10Y',
    '15-YEAR': '15Y', '15YEAR': '15Y', '15Y': '15Y',
    '20-YEAR': '20Y', '20YEAR': '20Y', '20Y': '20Y',
  }
  return map[s] || s
}

/**
 * Parse a numeric value, handling commas and edge cases
 */
export function parseNumber(str) {
  if (!str) return 0
  const cleaned = str.toString().replace(/,/g, '').replace(/\s/g, '').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

/**
 * Parse T-Bill auction results from BB HTML
 * URL: https://www.bb.org.bd/en/index.php/auction/tbill
 */
export function parseTBillResults(html) {
  const $ = cheerio.load(html)
  const results = []

  // BB website uses tables for auction results
  // Look for tables containing auction data
  $('table').each((_i, table) => {
    const rows = $(table).find('tr')
    if (rows.length < 2) return

    // Check if this looks like an auction results table
    const headerText = $(rows[0]).text().toLowerCase()
    if (!headerText.includes('tenor') && !headerText.includes('day') && !headerText.includes('yield')) return

    rows.each((rowIdx, row) => {
      if (rowIdx === 0) return // skip header

      const cells = $(row).find('td')
      if (cells.length < 5) return

      try {
        const tenor = normalizeTenor($(cells[0]).text())
        if (!['91D', '182D', '364D'].includes(tenor)) return

        const result = {
          tenor,
          notifiedAmountCrore: parseNumber($(cells[1]).text()),
          totalBidsCrore: parseNumber($(cells[2]).text()),
          acceptedAmountCrore: parseNumber($(cells[3]).text()),
          cutoffYield: parseNumber($(cells[4]).text()),
          weightedAvgYield: cells.length > 5 ? parseNumber($(cells[5]).text()) : 0,
        }

        if (result.cutoffYield > 0) {
          result.bidCoverRatio = result.notifiedAmountCrore > 0
            ? Math.round((result.totalBidsCrore / result.notifiedAmountCrore) * 100) / 100
            : 0

          const devolvement = result.notifiedAmountCrore - result.acceptedAmountCrore
          result.devolvementCrore = Math.max(0, devolvement)
          result.devolvementPct = result.notifiedAmountCrore > 0
            ? Math.round((Math.max(0, devolvement) / result.notifiedAmountCrore) * 10000) / 100
            : 0

          results.push(result)
        }
      } catch (err) {
        console.warn(`Failed to parse T-Bill row: ${err.message}`)
      }
    })
  })

  return results
}

/**
 * Parse T-Bond (BGTB) auction results from BB HTML
 * URL: https://www.bb.org.bd/en/index.php/auction/tbond
 */
export function parseTBondResults(html) {
  const $ = cheerio.load(html)
  const results = []

  $('table').each((_i, table) => {
    const rows = $(table).find('tr')
    if (rows.length < 2) return

    const headerText = $(rows[0]).text().toLowerCase()
    if (!headerText.includes('tenor') && !headerText.includes('year') && !headerText.includes('yield')) return

    rows.each((rowIdx, row) => {
      if (rowIdx === 0) return

      const cells = $(row).find('td')
      if (cells.length < 5) return

      try {
        const tenor = normalizeTenor($(cells[0]).text())
        if (!['2Y', '5Y', '10Y', '15Y', '20Y'].includes(tenor)) return

        const result = {
          tenor,
          notifiedAmountCrore: parseNumber($(cells[1]).text()),
          totalBidsCrore: parseNumber($(cells[2]).text()),
          acceptedAmountCrore: parseNumber($(cells[3]).text()),
          cutoffYield: parseNumber($(cells[4]).text()),
          weightedAvgYield: cells.length > 5 ? parseNumber($(cells[5]).text()) : 0,
          couponRate: cells.length > 6 ? parseNumber($(cells[6]).text()) : null,
        }

        if (result.cutoffYield > 0) {
          result.bidCoverRatio = result.notifiedAmountCrore > 0
            ? Math.round((result.totalBidsCrore / result.notifiedAmountCrore) * 100) / 100
            : 0

          const devolvement = result.notifiedAmountCrore - result.acceptedAmountCrore
          result.devolvementCrore = Math.max(0, devolvement)
          result.devolvementPct = result.notifiedAmountCrore > 0
            ? Math.round((Math.max(0, devolvement) / result.notifiedAmountCrore) * 10000) / 100
            : 0

          results.push(result)
        }
      } catch (err) {
        console.warn(`Failed to parse T-Bond row: ${err.message}`)
      }
    })
  })

  return results
}

/**
 * Parse BB circulars listing
 * URL: https://www.bb.org.bd/en/index.php/mediaroom/circular
 */
export function parseCirculars(html) {
  const $ = cheerio.load(html)
  const circulars = []

  // BB lists circulars in tables or divs with links
  $('table tr, .circular-item, .list-group-item').each((_i, el) => {
    const $el = $(el)
    const link = $el.find('a[href*=".pdf"], a[href*="circular"]').first()
    if (!link.length) return

    const title = link.text().trim()
    if (!title) return

    const href = link.attr('href') || ''
    const pdfUrl = href.startsWith('http') ? href : `https://www.bb.org.bd${href}`

    // Try to extract date
    const dateText = $el.find('td:first-child, .date, time').first().text().trim()
    const dateMatch = dateText.match(/\d{4}-\d{2}-\d{2}/) || dateText.match(/\d{2}\/\d{2}\/\d{4}/)
    const date = dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0]

    // Categorize based on title keywords
    let category = 'other'
    const lower = title.toLowerCase()
    if (lower.includes('monetary') || lower.includes('repo') || lower.includes('rate') || lower.includes('mpd')) {
      category = 'monetary_policy'
    } else if (lower.includes('forex') || lower.includes('foreign') || lower.includes('exchange') || lower.includes('fed')) {
      category = 'forex'
    } else if (lower.includes('bank') || lower.includes('capital') || lower.includes('provision') || lower.includes('brpd')) {
      category = 'banking_regulation'
    } else if (lower.includes('payment') || lower.includes('digital') || lower.includes('psd')) {
      category = 'payment_systems'
    }

    circulars.push({
      id: `circ-${date}-${circulars.length}`,
      date,
      title,
      category,
      pdfUrl,
      summary: null,
      impactOnYields: null,
    })
  })

  return circulars
}

/**
 * Extract auction date from BB page content
 */
export function extractAuctionDate(html) {
  const $ = cheerio.load(html)
  const text = $('body').text()

  // Look for date patterns
  const patterns = [
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{2})[\/-](\d{2})[\/-](\d{4})/,
    /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[0]
  }

  return null
}
