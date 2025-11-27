import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import type { ProcessedData, AggregatedData, BalanceUpdate } from '@/types'

export function exportToCSV(data: ProcessedData[], filename: string) {
  const csv = Papa.unparse(data, {
    columns: [
      'validatorAddress',
      'date',
      'eventType',
      'balanceUpdateCode',
      'rewardAmountETH',
      'rewardAmountUSD',
      'penaltyAmountETH',
      'penaltyAmountUSD',
      'transactionHash',
      'blockNumber',
      'blockTime',
      'preBalanceETH',
      'postBalanceETH',
    ],
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
}

export function exportToExcel(
  processedData: ProcessedData[],
  aggregatedData: AggregatedData[],
  filename: string
) {
  const workbook = XLSX.utils.book_new()

  // Processed data sheet
  const processedSheet = XLSX.utils.json_to_sheet(processedData)
  XLSX.utils.book_append_sheet(workbook, processedSheet, 'Detailed Events')

  // Aggregated data sheet
  const aggregatedSheet = XLSX.utils.json_to_sheet(aggregatedData)
  XLSX.utils.book_append_sheet(workbook, aggregatedSheet, 'Aggregates')

  // Summary sheet
  const summaryData = [
    ['Summary Statistics'],
    ['Total Events', processedData.length],
    ['Total Validators', new Set(processedData.map(d => d.validatorAddress)).size],
    ['Total Reward (ETH)', processedData.reduce((sum, d) => sum + d.rewardAmountETH, 0).toFixed(6)],
    ['Total Reward (USD)', processedData.reduce((sum, d) => sum + d.rewardAmountUSD, 0).toFixed(2)],
    ['Total Penalty (ETH)', processedData.reduce((sum, d) => sum + d.penaltyAmountETH, 0).toFixed(6)],
    ['Total Penalty (USD)', processedData.reduce((sum, d) => sum + d.penaltyAmountUSD, 0).toFixed(2)],
  ]
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

export function exportToJSON(
  data: {
    processedData: ProcessedData[]
    aggregatedData: AggregatedData[]
    rawData: BalanceUpdate[]
  },
  filename: string
) {
  const json = JSON.stringify(
    {
      metadata: {
        exportDate: new Date().toISOString(),
        totalEvents: data.processedData.length,
        totalValidators: new Set(data.processedData.map(d => d.validatorAddress)).size,
      },
      processedData: data.processedData,
      aggregatedData: data.aggregatedData,
      rawData: data.rawData,
    },
    null,
    2
  )

  const blob = new Blob([json], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.json`
  link.click()
}

