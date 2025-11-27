import { format, parseISO, startOfMonth, startOfQuarter } from 'date-fns'
import type { BalanceUpdate, ProcessedData, AggregatedData } from '@/types'

export function normalizeData(balanceUpdates: BalanceUpdate[]): ProcessedData[] {
  return balanceUpdates.map(update => ({
    validatorAddress: update.validatorAddress,
    date: update.blockDate,
    eventType: update.eventType,
    balanceUpdateCode: update.balanceUpdateCode,
    rewardAmountETH: Number(update.rewardAmountETH) || 0,
    rewardAmountUSD: Number(update.rewardAmountUSD) || 0,
    penaltyAmountETH: Number(update.penaltyAmountETH) || 0,
    penaltyAmountUSD: Number(update.penaltyAmountUSD) || 0,
    transactionHash: update.transactionHash,
    blockNumber: Number(update.blockNumber) || 0,
    blockTime: update.blockTime,
    preBalanceETH: Number(update.preBalanceETH) || 0,
    postBalanceETH: Number(update.postBalanceETH) || 0,
  }))
}

export function groupData(processedData: ProcessedData[]): ProcessedData[] {
  // Data is already normalized, but we can add additional grouping logic here
  // For now, return sorted by date and validator
  return processedData.sort((a, b) => {
    if (a.validatorAddress !== b.validatorAddress) {
      return a.validatorAddress.localeCompare(b.validatorAddress)
    }
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date)
    }
    return a.eventType.localeCompare(b.eventType)
  })
}

export function generateAggregates(processedData: ProcessedData[]): AggregatedData[] {
  const aggregates: Map<string, AggregatedData> = new Map()

  // Monthly aggregates
  processedData.forEach(data => {
    try {
      const date = parseISO(data.date)
      const monthKey = format(startOfMonth(date), 'yyyy-MM')
      const key = `${data.validatorAddress}-${monthKey}-monthly`
      
      const existing = aggregates.get(key) || {
        validatorAddress: data.validatorAddress,
        date: monthKey,
        period: 'monthly' as const,
        totalRewardETH: 0,
        totalRewardUSD: 0,
        totalPenaltyETH: 0,
        totalPenaltyUSD: 0,
        netPositionETH: 0,
        netPositionUSD: 0,
        transactionCount: 0,
      }

      existing.totalRewardETH += data.rewardAmountETH
      existing.totalRewardUSD += data.rewardAmountUSD
      existing.totalPenaltyETH += data.penaltyAmountETH
      existing.totalPenaltyUSD += data.penaltyAmountUSD
      existing.transactionCount += 1
      existing.netPositionETH = existing.totalRewardETH - existing.totalPenaltyETH
      existing.netPositionUSD = existing.totalRewardUSD - existing.totalPenaltyUSD

      aggregates.set(key, existing)
    } catch (error) {
      console.error('Error processing date for monthly aggregate:', error)
    }
  })

  // Quarterly aggregates
  processedData.forEach(data => {
    try {
      const date = parseISO(data.date)
      const quarterStart = startOfQuarter(date)
      const quarterKey = format(quarterStart, 'yyyy-QQ')
      const key = `${data.validatorAddress}-${quarterKey}-quarterly`
      
      const existing = aggregates.get(key) || {
        validatorAddress: data.validatorAddress,
        date: quarterKey,
        period: 'quarterly' as const,
        totalRewardETH: 0,
        totalRewardUSD: 0,
        totalPenaltyETH: 0,
        totalPenaltyUSD: 0,
        netPositionETH: 0,
        netPositionUSD: 0,
        transactionCount: 0,
      }

      existing.totalRewardETH += data.rewardAmountETH
      existing.totalRewardUSD += data.rewardAmountUSD
      existing.totalPenaltyETH += data.penaltyAmountETH
      existing.totalPenaltyUSD += data.penaltyAmountUSD
      existing.transactionCount += 1
      existing.netPositionETH = existing.totalRewardETH - existing.totalPenaltyETH
      existing.netPositionUSD = existing.totalRewardUSD - existing.totalPenaltyUSD

      aggregates.set(key, existing)
    } catch (error) {
      console.error('Error processing date for quarterly aggregate:', error)
    }
  })

  return Array.from(aggregates.values())
}

export function filterByTaxYear(
  data: ProcessedData[],
  year: number,
  jurisdiction: 'US' | 'UK' | 'AUS' | 'CUSTOM' = 'US'
): ProcessedData[] {
  let startDate: Date
  let endDate: Date

  switch (jurisdiction) {
    case 'US':
      // US tax year: Jan 1 - Dec 31
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31, 23, 59, 59)
      break
    case 'UK':
      // UK tax year: Apr 6 - Apr 5 (next year)
      startDate = new Date(year - 1, 3, 6)
      endDate = new Date(year, 3, 5, 23, 59, 59)
      break
    case 'AUS':
      // Australian tax year: Jul 1 - Jun 30 (next year)
      startDate = new Date(year - 1, 6, 1)
      endDate = new Date(year, 5, 30, 23, 59, 59)
      break
    default:
      // Custom: calendar year
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31, 23, 59, 59)
  }

  return data.filter(item => {
    const itemDate = parseISO(item.date)
    return itemDate >= startDate && itemDate <= endDate
  })
}

