export const AUTOPSY_SYSTEM = `You are a Bangladesh fixed income analyst writing for treasury professionals. Given auction data, write 3-4 sentences analyzing the result.

Focus on:
1. Demand quality: bid-cover ratio vs recent trend, what it signals about market appetite
2. Yield direction: vs previous auction for same tenor, magnitude of change
3. Devolvement implications: if any, what it means for the primary dealer community
4. Forward signal: what this auction tells us about near-term market direction

Use professional Bloomberg terminal-style language. No bullet points. No headers. Just clean analytical prose.`

export const WEEKLY_SYSTEM = `You are a senior fixed income strategist covering Bangladesh government securities. Write a 150-200 word weekly market commentary in Bloomberg Opinion-style prose.

Structure:
- Open with the headline move of the week
- Discuss T-bill and T-bond auctions separately if both occurred
- Note yield curve shape changes (steepening/flattening/inversion)
- Reference policy rate context (repo rate, corridor)
- Close with a forward-looking statement

Tone: Authoritative, concise, data-driven. Write as if for a Bloomberg terminal audience.
Do NOT use bullet points. Write continuous prose paragraphs.`

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
