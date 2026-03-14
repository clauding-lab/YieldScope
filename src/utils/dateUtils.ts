import { format, parseISO, differenceInDays, subDays, subMonths, subYears } from 'date-fns'

export function formatBDDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd MMM yyyy')
}

export function formatBDDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'dd MMM')
}

export function daysAgo(dateStr: string): number {
  return differenceInDays(new Date(), parseISO(dateStr))
}

export function getComparisonDates(referenceDate: string) {
  const ref = parseISO(referenceDate)
  return {
    oneWeekAgo: format(subDays(ref, 7), 'yyyy-MM-dd'),
    oneMonthAgo: format(subMonths(ref, 1), 'yyyy-MM-dd'),
    threeMonthsAgo: format(subMonths(ref, 3), 'yyyy-MM-dd'),
    sixMonthsAgo: format(subMonths(ref, 6), 'yyyy-MM-dd'),
    oneYearAgo: format(subYears(ref, 1), 'yyyy-MM-dd'),
  }
}

export function isBusinessDay(dateStr: string): boolean {
  const day = parseISO(dateStr).getDay()
  // BD business days: Sunday (0) to Thursday (4)
  return day >= 0 && day <= 4
}

export function getAuctionDay(type: 'T-Bill' | 'BGTB'): string {
  return type === 'T-Bill' ? 'Sunday' : 'Tuesday'
}
