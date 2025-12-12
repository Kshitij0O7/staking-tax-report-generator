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
  // Filter for monthly aggregates only
  const monthlyData = aggregatedData.filter(
    (data) => data.period === 'monthly' && data.netPositionUSD > 0
  )

  // Group by month and calculate total income per month
  const monthMap = new Map<string, number>()

  monthlyData.forEach((data) => {
    const month = data.date || 'Unknown'
    const currentIncome = monthMap.get(month) || 0
    monthMap.set(month, currentIncome + data.netPositionUSD)
  })

  // Calculate tax for each month
  const taxCalculations: TaxCalculation[] = []

  monthMap.forEach((income, month) => {
    const { rate, amount } = calculateTax(income)
    taxCalculations.push({
      quarterlyIncome: income,
      taxRate: rate,
      taxAmount: amount,
      quarter: month, // Using quarter field to store month value for backwards compatibility
    })
  })

  // Sort by month (most recent first)
  return taxCalculations.sort((a, b) => b.quarter.localeCompare(a.quarter))
}

