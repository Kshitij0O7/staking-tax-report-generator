import type { ValidatorAddress, BalanceUpdate } from '@/types'

interface BitqueryResponse {
  data?: {
    EVM?: {
      TransactionBalances?: Array<{
        Block?: {
          Time?: string
          Number?: number
        }
        Transaction?: {
          Hash?: string
        }
        TokenBalance?: {
          Address?: string
          BalanceChangeReasonCode?: number
          Currency?: {
            Name?: string
            Symbol?: string
          }
          PostBalance?: number
          PostBalanceInUSD?: number
          PreBalance?: number
          PreBalanceInUSD?: number
        }
        Tip_native?: number
        Tip_usd?: number
      }>
    }
  }
  errors?: Array<{ message: string }>
}

export async function fetchBalanceUpdates(
  addresses: string[],
  monthsAgo: number = 1,
  offset: number = 0
): Promise<BalanceUpdate[]> {
  try {
    const response = await fetch('/api/bitquery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ addresses, monthsAgo, offset }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `API request failed: ${response.statusText}`)
    }

    const result: BitqueryResponse = await response.json()

    if (result.errors) {
      throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`)
    }

    const transactionBalances = result.data?.EVM?.TransactionBalances || []
    const balanceUpdates: BalanceUpdate[] = []

    transactionBalances.forEach((txBalance) => {
      if (!txBalance.Block?.Time || !txBalance.Transaction?.Hash || !txBalance.Block?.Number) return
      if (!txBalance.TokenBalance) return

      const tokenBalance = txBalance.TokenBalance
      const validatorAddress = tokenBalance.Address || ''

      const blockTime = txBalance.Block.Time
      const blockDate = new Date(blockTime).toISOString().split('T')[0]
      
      // Ensure all values are numbers, converting from string if necessary
      const preBalance = Number(tokenBalance.PreBalance) || 0
      const postBalance = Number(tokenBalance.PostBalance) || 0
      const preBalanceUSD = Number(tokenBalance.PreBalanceInUSD) || 0
      const postBalanceUSD = Number(tokenBalance.PostBalanceInUSD) || 0
      
      // Use calculated tip values if available, otherwise calculate from balances
      const tipNative = txBalance.Tip_native != null ? Number(txBalance.Tip_native) : null
      const tipUSD = txBalance.Tip_usd != null ? Number(txBalance.Tip_usd) : null
      const rewardAmountETH = tipNative ?? (postBalance - preBalance)
      const rewardAmountUSD = tipUSD ?? (postBalanceUSD - preBalanceUSD)
      
      // Determine event type - BalanceChangeReasonCode 5 is for staking rewards
      const eventType = rewardAmountETH > 0 ? 'REWARD' : rewardAmountETH < 0 ? 'PENALTY' : 'BALANCE_UPDATE'
      const balanceUpdateCode = tokenBalance.BalanceChangeReasonCode?.toString() || '5'

      const penaltyAmountETH = rewardAmountETH < 0 ? Math.abs(rewardAmountETH) : 0
      const penaltyAmountUSD = rewardAmountUSD < 0 ? Math.abs(rewardAmountUSD) : 0
      const actualRewardETH = rewardAmountETH > 0 ? rewardAmountETH : 0
      const actualRewardUSD = rewardAmountUSD > 0 ? rewardAmountUSD : 0

      balanceUpdates.push({
        validatorAddress,
        preBalanceETH: preBalance,
        preBalanceUSD,
        postBalanceETH: postBalance,
        postBalanceUSD,
        rewardAmountETH: actualRewardETH,
        rewardAmountUSD: actualRewardUSD,
        penaltyAmountETH,
        penaltyAmountUSD,
        eventType,
        balanceUpdateCode,
        blockTime,
        blockDate,
        transactionHash: txBalance.Transaction.Hash,
        blockNumber: txBalance.Block.Number,
        rawMetadata: txBalance,
      })
    })

    return balanceUpdates
  } catch (error) {
    console.error(`Error fetching balance updates:`, error)
    // Return empty array on error to allow processing to continue
    return []
  }
}

export async function processValidators(
  validators: ValidatorAddress[],
  onProgress?: (current: number, total: number) => void,
  monthsAgo: number = 1
): Promise<BalanceUpdate[]> {
  // Extract addresses from validators array
  const addresses = validators.map(v => v.address)
  
  const allUpdates: BalanceUpdate[] = []
  const PAGE_SIZE = 25000 // Bitquery typically returns 25,000 entries per request
  let offset = 0
  let hasMore = true
  let pageCount = 0
  // const MAX_PAGES = 1000000000 // Safety limit to prevent infinite loops
  
  onProgress?.(0, 1)
  
  try {
    // Fetch all data with pagination until empty response
    while (hasMore) {
      const updates = await fetchBalanceUpdates(addresses, monthsAgo, offset)
      
      if (updates.length === 0) {
        hasMore = false
      } else {
        allUpdates.push(...updates)
        offset += PAGE_SIZE // Increment by page size, not by results count
        pageCount++
        
        // Update progress - show current page being processed
        onProgress?.(pageCount, pageCount + 1)
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // If we got fewer results than page size, we've likely reached the end
        if (updates.length < PAGE_SIZE) {
          hasMore = false
        }
      }
    }
    
    onProgress?.(1, 1)
    return allUpdates
  } catch (error) {
    console.error(`Error processing validators:`, error)
    onProgress?.(1, 1)
    return allUpdates // Return what we've collected so far
  }
}

