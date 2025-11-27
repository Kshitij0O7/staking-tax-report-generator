'use client'

import { useState } from 'react'
import FileUpload from '@/components/FileUpload'
import ValidationResults from '@/components/ValidationResults'
import ProcessingStatus from '@/components/ProcessingStatus'
import ResultsDisplay from '@/components/ResultsDisplay'
import { validateFile } from '@/lib/fileValidator'
import { processValidators } from '@/lib/bitqueryProcessor'
import { normalizeData, groupData, generateAggregates } from '@/lib/dataProcessor'
import type { ValidatorAddress, BalanceUpdate, ProcessedData, AggregatedData } from '@/types'

export default function Home() {
  const [step, setStep] = useState<'upload' | 'validation' | 'processing' | 'results'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [validators, setValidators] = useState<ValidatorAddress[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [rawData, setRawData] = useState<BalanceUpdate[]>([])
  const [processedData, setProcessedData] = useState<ProcessedData[]>([])
  const [aggregatedData, setAggregatedData] = useState<AggregatedData[]>([])
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 })

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
            <FileUpload onFileSelect={handleFileSelect} />
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

