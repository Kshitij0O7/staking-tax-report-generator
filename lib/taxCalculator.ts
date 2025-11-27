import type { AggregatedData, TaxCalculation } from '@/types'

export function calculateTax(quarterlyIncome: number): { rate: number; amount: number } {
  let rate = 0
  let amount = 0

  if (quarterlyIncome < 10000) {
    rate = 10
    amount = quarterlyIncome * 0.10
  } else if (quarterlyIncome >= 10000 && quarterlyIncome < 25000) {
    rate = 12
    amount = quarterlyIncome * 0.12
  } else if (quarterlyIncome >= 25000 && quarterlyIncome < 40000) {
    rate = 22
    amount = quarterlyIncome * 0.22
  } else if (quarterlyIncome >= 40000 && quarterlyIncome < 60000) {
    rate = 24
    amount = quarterlyIncome * 0.24
  } else if (quarterlyIncome >= 60000 && quarterlyIncome < 80000) {
    rate = 32
    amount = quarterlyIncome * 0.32
  } else if (quarterlyIncome >= 80000 && quarterlyIncome < 100000) {
    rate = 35
    amount = quarterlyIncome * 0.35
  } else {
    rate = 37
    amount = quarterlyIncome * 0.37
  }

  return { rate, amount }
}

export function generateTaxReport(aggregatedData: AggregatedData[]): TaxCalculation[] {
  // Filter for quarterly aggregates only
  const quarterlyData = aggregatedData.filter(
    (data) => data.period === 'quarterly' && data.netPositionUSD > 0
  )

  // Group by quarter and calculate total income per quarter
  const quarterMap = new Map<string, number>()

  quarterlyData.forEach((data) => {
    const quarter = data.date || 'Unknown'
    const currentIncome = quarterMap.get(quarter) || 0
    quarterMap.set(quarter, currentIncome + data.netPositionUSD)
  })

  // Calculate tax for each quarter
  const taxCalculations: TaxCalculation[] = []

  quarterMap.forEach((income, quarter) => {
    const { rate, amount } = calculateTax(income)
    taxCalculations.push({
      quarterlyIncome: income,
      taxRate: rate,
      taxAmount: amount,
      quarter,
    })
  })

  // Sort by quarter (most recent first)
  return taxCalculations.sort((a, b) => b.quarter.localeCompare(a.quarter))
}

