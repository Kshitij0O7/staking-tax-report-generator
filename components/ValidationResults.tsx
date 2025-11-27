'use client'

import { CheckCircle, XCircle, AlertCircle, Play, RotateCcw } from 'lucide-react'
import type { ValidatorAddress } from '@/types'

interface ValidationResultsProps {
  validators: ValidatorAddress[]
  errors: string[]
  onProcess: () => void
  onReset: () => void
}

export default function ValidationResults({
  validators,
  errors,
  onProcess,
  onReset,
}: ValidationResultsProps) {
  const isValid = errors.length === 0 && validators.length > 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            File Validation Results
          </h2>
          {isValid ? (
            <CheckCircle className="h-8 w-8 text-green-500" />
          ) : (
            <XCircle className="h-8 w-8 text-red-500" />
          )}
        </div>

        {isValid ? (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-800 dark:text-green-200 font-medium">
                ✓ File validation passed!
              </p>
              <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                Found {validators.length} valid validator address{validators.length !== 1 ? 'es' : ''}
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Row</th>
                    <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {validators.map((validator) => (
                    <tr key={validator.rowNumber} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                        {validator.rowNumber}
                      </td>
                      <td className="px-4 py-2 font-mono text-sm text-gray-900 dark:text-white">
                        {validator.address}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-4">
              <button
                onClick={onProcess}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Play className="h-5 w-5" />
                Process Validators
              </button>
              <button
                onClick={onReset}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <RotateCcw className="h-5 w-5 inline-block mr-2" />
                Reset
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-800 dark:text-red-200 font-medium">
                    Validation failed
                  </p>
                  <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                    Please fix the errors below and try again
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto">
              <ul className="space-y-2">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-600 dark:text-red-400">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={onReset}
              className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <RotateCcw className="h-5 w-5 inline-block mr-2" />
              Upload Different File
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

