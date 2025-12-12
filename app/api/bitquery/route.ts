import { NextRequest, NextResponse } from 'next/server'

const BITQUERY_API_URL = process.env.BITQUERY_API_URL || 'https://streaming.bitquery.io/graphql'

export async function POST(request: NextRequest) {
  try {
    const { addresses, monthsAgo = 1, offset = 0 } = await request.json()

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json(
        { error: 'Array of block builder addresses is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.BITQUERY_TOKEN;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Bitquery API key not configured' },
        { status: 500 }
      )
    }

    // Format addresses for GraphQL query
    const addressesString = addresses.map((addr: string) => `"${addr}"`).join(',\n        ')

    const query = `query MyQuery {
  EVM(network: eth, dataset: realtime) {
    TransactionBalances(
      orderBy: {descending: Block_Time}
      limit: {count: 10000, offset: ${offset}}
      where: {
        TokenBalance: {
          BalanceChangeReasonCode: {eq: 5}, 
          Address: {
            in: [${addressesString}]
          }
        }, 
        Block: {
          Time: {
            since_relative: {
              months_ago: ${monthsAgo}
            }
          }
        }
      }
    ) {
      Block{
        Time
        Number
      }
      Transaction {
        Hash
      }
      TokenBalance {
        Address
        BalanceChangeReasonCode
        Currency {
          Name
          Symbol
        }
        PostBalance
        PostBalanceInUSD
        PreBalance
        PreBalanceInUSD
      }
      Tip_native: calculate(expression: "$TokenBalance_PostBalance - $TokenBalance_PreBalance")
      Tip_usd: calculate(expression: "$TokenBalance_PostBalanceInUSD - $TokenBalance_PreBalanceInUSD")
    }
  }
}`

    const response = await fetch(BITQUERY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        variables: {},
      }),
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const result = await response.json()

    if (result.errors) {
      return NextResponse.json(
        { error: `GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}` },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Bitquery API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

