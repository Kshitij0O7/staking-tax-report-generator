export interface ValidatorAddress {
  address: string
  rowNumber: number
}

export interface BalanceUpdate {
  validatorAddress: string
  preBalanceETH: number
  preBalanceUSD: number
  postBalanceETH: number
  postBalanceUSD: number
  rewardAmountETH: number
  rewardAmountUSD: number
  penaltyAmountETH?: number
  penaltyAmountUSD?: number
  eventType: string
  balanceUpdateCode: string
  blockTime: string
  blockDate: string
  transactionHash: string
  blockNumber: number
  rawMetadata?: any
}

export interface ProcessedData {
  validatorAddress: string
  date: string
  eventType: string
  balanceUpdateCode: string
  rewardAmountETH: number
  rewardAmountUSD: number
  penaltyAmountETH: number
  penaltyAmountUSD: number
  transactionHash: string
  blockNumber: number
  blockTime: string
  preBalanceETH: number
  postBalanceETH: number
}

export interface AggregatedData {
  validatorAddress?: string
  date?: string
  eventType?: string
  period?: 'monthly'
  totalRewardETH: number
  totalRewardUSD: number
  totalPenaltyETH: number
  totalPenaltyUSD: number
  netPositionETH: number
  netPositionUSD: number
  transactionCount: number
}

export interface TaxCalculation {
  quarterlyIncome: number
  taxRate: number
  taxAmount: number
  quarter: string
}

export interface TaxYearView {
  year: number
  jurisdiction: 'US' | 'UK' | 'AUS' | 'CUSTOM'
  startDate: string
  endDate: string
  aggregatedData: AggregatedData[]
}

