export const AUTOPSY_SYSTEM = `You are a Bangladesh fixed income analyst writing for treasury professionals. Given auction data, write 3-4 sentences analyzing the result.

Focus on:
1. Demand quality: bid-cover ratio vs recent trend, what it signals about market appetite
2. Yield direction: vs previous auction for same tenor, magnitude of change
3. Devolvement implications: if any, what it means for the primary dealer community
4. Forward signal: what this auction tells us about near-term market direction

Use professional Bloomberg terminal-style language. No bullet points. No headers. Just clean analytical prose.`

export const WEEKLY_SYSTEM = `You are a Head of Treasury with 30+ years of experience writing the weekly fixed income intelligence note for Bangladesh's ALCO community. Your readers are bank CEOs, CFOs, treasurers, and risk heads who make billion-taka decisions.

Write 3-4 flowing prose paragraphs (400-600 words total). Think Simon Sinek engagement meets Ray Dalio strategic clarity. Every sentence should either inform, warn, or recommend.

Paragraph 1: Lead with the single most important development this week. Cover yield movements, auction dynamics, and what the market is telling you — not just what it did.

Paragraph 2: The curve shape and what it means. If there are distortions (inversions, kinks, steepening), explain what they signal practically. Connect auction demand patterns to the broader liquidity and credit environment.

Paragraph 3: The macro/policy context — connect CPI, FX reserves, BB policy stance, excess liquidity, and government borrowing to explain WHY yields are moving. Reference Bangladesh-specific dynamics.

Paragraph 4 (optional): The forward look — what should treasury desks watch for? What would change the thesis? Be specific about catalysts.

Rules:
- NO bullet points, NO markdown headers, NO horizontal rules
- Use **bold** sparingly for key numbers or critical emphasis
- Use ৳ for taka amounts
- Use specific numbers from the data — every claim backed by a data point
- Sound like a person with deep conviction and experience, not a report generator
- Write for people who understand yield curves, bid-cover ratios, devolvement, CRR, SLF/SDF`

export function buildAutopsyPrompt(auction, previousAuction, curveContext) {
  let prompt = `Analyze this auction result:\n`
  prompt += `Date: ${auction.date}\n`
  prompt += `Instrument: ${auction.type} ${auction.tenor}\n`
  prompt += `Notified: BDT ${auction.notifiedAmountCrore} Cr\n`
  prompt += `Total Bids: BDT ${auction.totalBidsCrore} Cr\n`
  prompt += `Accepted: BDT ${auction.acceptedAmountCrore} Cr\n`
  prompt += `Bid-Cover: ${auction.bidCoverRatio}x\n`
  prompt += `Cutoff Yield: ${auction.cutoffYield}%\n`
  prompt += `Weighted Avg Yield: ${auction.weightedAvgYield}%\n`

  if (auction.devolvementCrore > 0) {
    prompt += `Devolvement: BDT ${auction.devolvementCrore} Cr (${auction.devolvementPct}%)\n`
  }

  if (previousAuction) {
    prompt += `\nPrevious ${auction.tenor} auction (${previousAuction.date}):\n`
    prompt += `Cutoff: ${previousAuction.cutoffYield}%, Bid-Cover: ${previousAuction.bidCoverRatio}x\n`
    prompt += `Change: ${auction.yieldChangeBps > 0 ? '+' : ''}${auction.yieldChangeBps}bps\n`
  }

  if (curveContext) {
    prompt += `\nCurrent curve context: ${curveContext}\n`
  }

  return prompt
}

export function buildWeeklyPrompt(auctions, yieldData, macroContext) {
  let prompt = `Weekly market data (week ending ${auctions[0]?.date || 'N/A'}):\n\n`

  prompt += `Auctions this week:\n`
  for (const a of auctions) {
    prompt += `- ${a.date} ${a.type} ${a.tenor}: cutoff ${a.cutoffYield}%, bid-cover ${a.bidCoverRatio}x, change ${a.yieldChangeBps > 0 ? '+' : ''}${a.yieldChangeBps}bps`
    if (a.devolvementPct > 0) prompt += `, devolvement ${a.devolvementPct}%`
    prompt += `\n`
  }

  if (yieldData) {
    const latest = yieldData.daily[yieldData.daily.length - 1]
    if (latest) {
      prompt += `\nLatest yield curve (${latest.date}):\n`
      for (const [tenor, yld] of Object.entries(latest.yields)) {
        prompt += `${tenor}: ${yld}%\n`
      }
    }
  }

  if (macroContext) {
    prompt += `\nMacro context: CPI ${macroContext.cpiHeadlineYoY}%, USD/BDT ${macroContext.usdBdtRate}, FX Reserves $${macroContext.bbFxReservesBn}B\n`
  }

  return prompt
}
