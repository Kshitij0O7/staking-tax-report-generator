'use client'

import { useState, useMemo, useEffect } from 'react'
import { FileText, RotateCcw, ExternalLink, Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Download } from 'lucide-react'
import { filterByTaxYear } from '@/lib/dataProcessor'
import { generateTaxReport } from '@/lib/taxCalculator'
import Papa from 'papaparse'
import type { ProcessedData, AggregatedData, BalanceUpdate } from '@/types'

interface ResultsDisplayProps {
  processedData: ProcessedData[]
  aggregatedData: AggregatedData[]
  rawData: BalanceUpdate[]
  onReset: () => void
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 200]

export default function ResultsDisplay({
  processedData,
  aggregatedData,
  rawData,
  onReset,
}: ResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed' | 'aggregates' | 'taxyear'>('summary')
  const [filterValidator, setFilterValidator] = useState<string>('')
  const [filterDate, setFilterDate] = useState<string>('')
  const [filterEventType, setFilterEventType] = useState<string>('')
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [taxYear, setTaxYear] = useState<number>(new Date().getFullYear())
  const [taxJurisdiction, setTaxJurisdiction] = useState<'US' | 'UK' | 'AUS' | 'CUSTOM'>('US')
  const [itemsPerPage, setItemsPerPage] = useState<number>(25)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [showTaxReport, setShowTaxReport] = useState<boolean>(false)

  const uniqueValidators = useMemo(() => {
    return Array.from(new Set(processedData.map(d => d.validatorAddress))).sort()
  }, [processedData])

  const uniqueEventTypes = useMemo(() => {
    return Array.from(new Set(processedData.map(d => d.eventType))).sort()
  }, [processedData])

  const filteredData = useMemo(() => {
    let filtered = [...processedData]

    if (filterValidator) {
      filtered = filtered.filter(d => d.validatorAddress === filterValidator)
    }
    if (filterDate) {
      filtered = filtered.filter(d => d.date === filterDate)
    }
    if (filterEventType) {
      filtered = filtered.filter(d => d.eventType === filterEventType)
    }

    if (sortField) {
      filtered.sort((a, b) => {
        const aVal = (a as any)[sortField]
        const bVal = (b as any)[sortField]
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return filtered
  }, [processedData, filterValidator, filterDate, filterEventType, sortField, sortDirection])

  const taxYearData = useMemo(() => {
    return filterByTaxYear(processedData, taxYear, taxJurisdiction)
  }, [processedData, taxYear, taxJurisdiction])

  // Reset to page 1 when filters, tab, or items per page changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filterValidator, filterDate, filterEventType, activeTab, itemsPerPage, taxYear, taxJurisdiction])

  // Get data for current tab
  const currentTabData = useMemo(() => {
    switch (activeTab) {
      case 'taxyear':
        return taxYearData
      case 'aggregates':
        return aggregatedData
      default:
        return filteredData
    }
  }, [activeTab, filteredData, taxYearData, aggregatedData])

  // Pagination calculations
  const totalItems = currentTabData.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  
  // Paginate based on active tab
  const paginatedProcessedData = useMemo(() => {
    if (activeTab === 'summary' || activeTab === 'detailed') {
      return filteredData.slice(startIndex, endIndex)
    }
    return []
  }, [activeTab, filteredData, startIndex, endIndex])

  const paginatedTaxYearData = useMemo(() => {
    if (activeTab === 'taxyear') {
      return taxYearData.slice(startIndex, endIndex)
    }
    return []
  }, [activeTab, taxYearData, startIndex, endIndex])

  const paginatedAggregatedData = useMemo(() => {
    if (activeTab === 'aggregates') {
      return aggregatedData.slice(startIndex, endIndex)
    }
    return []
  }, [activeTab, aggregatedData, startIndex, endIndex])

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleGenerateReport = () => {
    setShowTaxReport(true)
  }

  const taxReport = useMemo(() => {
    return generateTaxReport(aggregatedData)
  }, [aggregatedData])

  const handleDownloadTaxReport = () => {
    // Calculate totals
    const totalRevenue = processedData.reduce((sum, d) => sum + d.rewardAmountUSD, 0)
    const totalTaxes = taxReport.reduce((sum, calc) => sum + calc.taxAmount, 0)

    // Prepare detailed data for CSV
    const detailedRows = processedData.map(row => ({
      'Block Builder Address': row.validatorAddress,
      'Date': row.date,
      'Event Type': row.eventType,
      'Balance Update Code': row.balanceUpdateCode,
      'Taxable Rewards (ETH)': row.rewardAmountETH.toFixed(6),
      'Taxable Rewards (USD)': row.rewardAmountUSD.toFixed(2),
      'Transaction Hash': row.transactionHash,
      'Block Number': row.blockNumber,
      'Block Time': row.blockTime,
      'Pre Balance (ETH)': row.preBalanceETH.toFixed(6),
      'Post Balance (ETH)': row.postBalanceETH.toFixed(6),
    }))

    // Add summary rows with cleaner format
    const summaryRows = [
      {
        'Block Builder Address': '',
        'Date': '',
        'Event Type': '',
        'Balance Update Code': '',
        'Taxable Rewards (ETH)': '',
        'Taxable Rewards (USD)': '',
        'Transaction Hash': '',
        'Block Number': '',
        'Block Time': '',
        'Pre Balance (ETH)': '',
        'Post Balance (ETH)': '',
      },
      {
        'Block Builder Address': 'SUMMARY',
        'Date': '',
        'Event Type': '',
        'Balance Update Code': '',
        'Taxable Rewards (ETH)': '',
        'Taxable Rewards (USD)': '',
        'Transaction Hash': '',
        'Block Number': '',
        'Block Time': '',
        'Pre Balance (ETH)': '',
        'Post Balance (ETH)': '',
      },
      {
        'Block Builder Address': 'Total Revenue (USD)',
        'Date': '',
        'Event Type': '',
        'Balance Update Code': '',
        'Taxable Rewards (ETH)': '',
        'Taxable Rewards (USD)': totalRevenue.toFixed(2),
        'Transaction Hash': '',
        'Block Number': '',
        'Block Time': '',
        'Pre Balance (ETH)': '',
        'Post Balance (ETH)': '',
      },
      {
        'Block Builder Address': 'Total Taxes (USD)',
        'Date': '',
        'Event Type': '',
        'Balance Update Code': '',
        'Taxable Rewards (ETH)': '',
        'Taxable Rewards (USD)': totalTaxes.toFixed(2),
        'Transaction Hash': '',
        'Block Number': '',
        'Block Time': '',
        'Pre Balance (ETH)': '',
        'Post Balance (ETH)': '',
      },
    ]

    // Combine all rows
    const allRows = [...detailedRows, ...summaryRows]

    // Generate CSV
    const csv = Papa.unparse(allRows)

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `tax-report-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const getEtherscanLink = (txHash: string) => {
    return `https://etherscan.io/tx/${txHash}`
  }

  const formatNumber = (value: number | string | undefined, decimals: number = 6): string => {
    const num = typeof value === 'number' ? value : Number(value) || 0
    return num.toFixed(decimals)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Block Builder Tax Report
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleGenerateReport}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2 font-medium"
            >
              <FileText className="h-4 w-4" />
              Generate Report
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          {(['summary', 'detailed', 'aggregates', 'taxyear'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab === 'taxyear' ? 'Tax Year View' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Block Builder
            </label>
            <select
              value={filterValidator}
              onChange={(e) => setFilterValidator(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">All Block Builders</option>
              {uniqueValidators.map((v) => (
                <option key={v} value={v}>
                  {v.slice(0, 10)}...
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Event Type
            </label>
            <select
              value={filterEventType}
              onChange={(e) => setFilterEventType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">All Types</option>
              {uniqueEventTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterValidator('')
                setFilterDate('')
                setFilterEventType('')
              }}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Pagination Controls - Top */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">Items per page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
          </div>
        </div>

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('validatorAddress')}>
                    Block Builder
                  </th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('date')}>
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('eventType')}>
                    Event Type
                  </th>
                  <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('rewardAmountETH')}>
                    Taxable Rewards (ETH)
                  </th>
                  <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('rewardAmountUSD')}>
                    Taxable Rewards (USD)
                  </th>
                  <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedProcessedData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">
                      {row.validatorAddress.slice(0, 10)}...
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.date}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.eventType}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                      {formatNumber(row.rewardAmountETH, 6)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                      ${formatNumber(row.rewardAmountUSD, 2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={getEtherscanLink(row.transactionHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {currentTabData.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No data found matching the filters
              </div>
            )}
          </div>
        )}

        {/* Detailed Tab */}
        {activeTab === 'detailed' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Block Builder</th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Date</th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Event Type</th>
                  <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Pre Balance (ETH)</th>
                  <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Post Balance (ETH)</th>
                  <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Taxable Rewards (ETH)</th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Tx Hash</th>
                  <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Block</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedProcessedData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">
                      {row.validatorAddress.slice(0, 10)}...
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.date}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.eventType}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                      {formatNumber(row.preBalanceETH, 6)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                      {formatNumber(row.postBalanceETH, 6)}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                      {formatNumber(row.rewardAmountETH, 6)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                      <a
                        href={getEtherscanLink(row.transactionHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {row.transactionHash.slice(0, 10)}...
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                      {row.blockNumber}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {currentTabData.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No data found matching the filters
              </div>
            )}
          </div>
        )}

        {/* Tax Year Tab */}
        {activeTab === 'taxyear' && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200">
                  Tax Year Filter
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tax Year
                  </label>
                  <input
                    type="number"
                    value={taxYear}
                    onChange={(e) => setTaxYear(parseInt(e.target.value) || new Date().getFullYear())}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="2020"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Jurisdiction
                  </label>
                  <select
                    value={taxJurisdiction}
                    onChange={(e) => setTaxJurisdiction(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="US">United States (Jan 1 - Dec 31)</option>
                    <option value="UK">United Kingdom (Apr 6 - Apr 5)</option>
                    <option value="AUS">Australia (Jul 1 - Jun 30)</option>
                    <option value="CUSTOM">Custom (Calendar Year)</option>
                  </select>
                </div>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-4">
                Showing {taxYearData.length} events for tax year {taxYear} ({taxJurisdiction})
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Block Builder</th>
                    <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Date</th>
                    <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Event Type</th>
                    <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Taxable Rewards (ETH)</th>
                    <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Taxable Rewards (USD)</th>
                    <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Tx Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedTaxYearData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">
                        {row.validatorAddress.slice(0, 10)}...
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.date}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.eventType}</td>
                      <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                        {formatNumber(row.rewardAmountETH, 6)}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                        ${formatNumber(row.rewardAmountUSD, 2)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                        <a
                          href={getEtherscanLink(row.transactionHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {row.transactionHash.slice(0, 10)}...
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {currentTabData.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No data found for the selected tax year
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aggregates Tab */}
        {activeTab === 'aggregates' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Period</th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Block Builder</th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Date</th>
                  <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Total Taxable Rewards (ETH)</th>
                  <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Total Taxable Rewards (USD)</th>
                  <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Net Position (ETH)</th>
                  <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Net Position (USD)</th>
                  <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Tx Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedAggregatedData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 capitalize">
                      {row.period}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">
                      {row.validatorAddress?.slice(0, 10)}...
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.date}</td>
                    <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                      {formatNumber(row.totalRewardETH, 6)}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                      ${formatNumber(row.totalRewardUSD, 2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">
                      {formatNumber(row.netPositionETH, 6)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">
                      ${formatNumber(row.netPositionUSD, 2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                      {row.transactionCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {currentTabData.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No aggregated data available
              </div>
            )}
          </div>
        )}

        {/* Pagination Controls - Bottom */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                title="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 border rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                title="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}
      </div>

      {/* Tax Report Modal */}
      {showTaxReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Tax Report
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadTaxReport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download CSV
                </button>
                <button
                  onClick={() => setShowTaxReport(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {taxReport.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No quarterly data available for tax calculation
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
                      Tax Calculation Summary
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Tax is calculated based on quarterly income using progressive tax brackets.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Quarter</th>
                          <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Quarterly Income (USD)</th>
                          <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Tax Rate (%)</th>
                          <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Tax Amount (USD)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {taxReport.map((calc, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                              {calc.quarter}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                              ${formatNumber(calc.quarterlyIncome, 2)}
                            </td>
                            <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400 font-medium">
                              {calc.taxRate}%
                            </td>
                            <td className="px-4 py-3 text-right text-red-600 dark:text-red-400 font-bold">
                              ${formatNumber(calc.taxAmount, 2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 dark:bg-gray-700 font-bold">
                        <tr>
                          <td className="px-4 py-3 text-left text-gray-900 dark:text-white">
                            Total
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                            ${formatNumber(
                              taxReport.reduce((sum, calc) => sum + calc.quarterlyIncome, 0),
                              2
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                            —
                          </td>
                          <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">
                            ${formatNumber(
                              taxReport.reduce((sum, calc) => sum + calc.taxAmount, 0),
                              2
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Tax Brackets</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• 10% - Income below $10,000</li>
                      <li>• 12% - Income $10,000 to $25,000</li>
                      <li>• 22% - Income $25,000 to $40,000</li>
                      <li>• 24% - Income $40,000 to $60,000</li>
                      <li>• 32% - Income $60,000 to $80,000</li>
                      <li>• 35% - Income $80,000 to $100,000</li>
                      <li>• 37% - Income above $100,000</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

