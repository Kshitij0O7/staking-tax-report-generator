'use client'

import { useState, useMemo } from 'react'
import FileUpload from '@/components/FileUpload'
import ValidationResults from '@/components/ValidationResults'
import ProcessingStatus from '@/components/ProcessingStatus'
import ResultsDisplay from '@/components/ResultsDisplay'
import { validateFile } from '@/lib/fileValidator'
import { processValidators } from '@/lib/bitqueryProcessor'
import { normalizeData, groupData, generateAggregates } from '@/lib/dataProcessor'
import type { ValidatorAddress, BalanceUpdate, ProcessedData, AggregatedData } from '@/types'
import { Plus, X } from 'lucide-react'

export default function Home() {
  const [step, setStep] = useState<'upload' | 'validation' | 'processing' | 'results'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [validators, setValidators] = useState<ValidatorAddress[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [rawData, setRawData] = useState<BalanceUpdate[]>([])
  const [processedData, setProcessedData] = useState<ProcessedData[]>([])
  const [aggregatedData, setAggregatedData] = useState<AggregatedData[]>([])
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 })
  const [manualAddresses, setManualAddresses] = useState<string[]>([''])

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile)
    setStep('validation')
    
    const { validators: validatedValidators, errors } = await validateFile(selectedFile)
    setValidators(validatedValidators)
    setValidationErrors(errors)
    
    if (errors.length === 0 && validatedValidators.length > 0) {
      // Auto-proceed to processing if validation passes
      handleProcess()
    }
  }

  const handleManualAddressSubmit = () => {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
    const errors: string[] = []
    const validatedValidators: ValidatorAddress[] = []
    const seenAddresses = new Set<string>()

    manualAddresses.forEach((address, index) => {
      const trimmedAddress = address.trim()
      if (!trimmedAddress) return

      const normalizedAddress = trimmedAddress.toLowerCase()
      if (seenAddresses.has(normalizedAddress)) {
        errors.push(`Address ${index + 1}: Duplicate address ${trimmedAddress}`)
        return
      }
      seenAddresses.add(normalizedAddress)

      if (!ethAddressRegex.test(trimmedAddress)) {
        errors.push(`Address ${index + 1}: Invalid Ethereum address format: ${trimmedAddress}`)
        return
      }

      validatedValidators.push({ address: trimmedAddress, rowNumber: index + 1 })
    })

    if (validatedValidators.length === 0) {
      errors.push('Please enter at least one valid validator address')
      setValidationErrors(errors)
      return
    }

    setValidators(validatedValidators)
    setValidationErrors(errors)
    setStep('validation')
    
    if (errors.length === 0) {
      handleProcess()
    }
  }

  const addAddressField = () => {
    setManualAddresses([...manualAddresses, ''])
  }

  const removeAddressField = (index: number) => {
    if (manualAddresses.length > 1) {
      setManualAddresses(manualAddresses.filter((_, i) => i !== index))
    }
  }

  const updateAddress = (index: number, value: string) => {
    const updated = [...manualAddresses]
    updated[index] = value
    setManualAddresses(updated)
  }

  // Generate sample data for display
  const sampleData = useMemo(() => {
    const sampleValidators = [
      '0x6adb3bab5730852eb53987ea89d8e8f16393c200',
      '0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5',
      '0x1234567890123456789012345678901234567890'
    ]
    const eventTypes = ['Reward', 'Penalty', 'Withdrawal']
    const dates = ['2024-01-15', '2024-02-10', '2024-03-05', '2024-04-20', '2024-05-12']
    
    return Array.from({ length: 5 }, (_, i) => ({
      validatorAddress: sampleValidators[i % sampleValidators.length],
      date: dates[i % dates.length],
      eventType: eventTypes[i % eventTypes.length],
      rewardAmountETH: (Math.random() * 0.5 + 0.1).toFixed(6),
      rewardAmountUSD: (Math.random() * 2000 + 300).toFixed(2),
      penaltyAmountETH: Math.random() > 0.7 ? (Math.random() * 0.05).toFixed(6) : '0.000000',
      penaltyAmountUSD: Math.random() > 0.7 ? (Math.random() * 100).toFixed(2) : '0.00',
      transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
      blockNumber: Math.floor(Math.random() * 20000000 + 18000000)
    }))
  }, [])

  const handleProcess = async () => {
    if (validators.length === 0) return
    
    setStep('processing')
    setProcessingProgress({ current: 0, total: validators.length })
    
    try {
      // Fetch data from Bitquery
      const balanceUpdates = await processValidators(
        validators,
        (current, total) => setProcessingProgress({ current, total })
      )
      
      setRawData(balanceUpdates)
      
      // Normalize and process data
      const normalized = normalizeData(balanceUpdates)
      const grouped = groupData(normalized)
      const aggregated = generateAggregates(grouped)
      
      setProcessedData(grouped)
      setAggregatedData(aggregated)
      setStep('results')
    } catch (error) {
      console.error('Processing error:', error)
      alert('Error processing validators. Please try again.')
      setStep('validation')
    }
  }

  const handleReset = () => {
    setFile(null)
    setValidators([])
    setValidationErrors([])
    setRawData([])
    setProcessedData([])
    setAggregatedData([])
    setProcessingProgress({ current: 0, total: 0 })
    setManualAddresses([''])
    setStep('upload')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-white">
            Staking Tax Calculator
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Calculate tax reports from validator addresses
          </p>

          {step === 'upload' && (
            <div className="space-y-8">
              {/* File Upload Section */}
              <div>
                <FileUpload onFileSelect={handleFileSelect} />
              </div>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    OR
                  </span>
                </div>
              </div>

              {/* Manual Address Entry Section */}
              <div className="max-w-2xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Enter Validator Addresses Manually
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                    Add validator addresses one by one. Click "Add Address" to add more fields.
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    {manualAddresses.map((address, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => updateAddress(index, e.target.value)}
                          placeholder={`Validator address ${index + 1} (0x...)`}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {manualAddresses.length > 1 && (
                          <button
                            onClick={() => removeAddressField(index)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remove address"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={addAddressField}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Address
                    </button>
                    <button
                      onClick={handleManualAddressSubmit}
                      className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Process Addresses
                    </button>
                  </div>
                </div>
              </div>

              {/* Sample Data Table */}
              <div className="max-w-7xl mx-auto mt-12">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Sample Data Preview
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                    This is an example of the data structure you'll see after processing your validator addresses.
                  </p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Validator</th>
                          <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Date</th>
                          <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Event Type</th>
                          <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Reward (ETH)</th>
                          <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Reward (USD)</th>
                          <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Penalty (ETH)</th>
                          <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Penalty (USD)</th>
                          <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Block #</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sampleData.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">
                              {row.validatorAddress.slice(0, 10)}...
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.date}</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.eventType}</td>
                            <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                              {row.rewardAmountETH}
                            </td>
                            <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                              ${row.rewardAmountUSD}
                            </td>
                            <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">
                              {row.penaltyAmountETH}
                            </td>
                            <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">
                              ${row.penaltyAmountUSD}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                              {row.blockNumber.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'validation' && (
            <ValidationResults
              validators={validators}
              errors={validationErrors}
              onProcess={handleProcess}
              onReset={handleReset}
            />
          )}

          {step === 'processing' && (
            <ProcessingStatus
              progress={processingProgress}
              onCancel={handleReset}
            />
          )}

          {step === 'results' && (
            <ResultsDisplay
              processedData={processedData}
              aggregatedData={aggregatedData}
              rawData={rawData}
              onReset={handleReset}
            />
          )}
        </div>
      </div>
    </main>
  )
}

