'use client'

import { Loader2, X } from 'lucide-react'

interface ProcessingStatusProps {
  progress: { current: number; total: number }
  onCancel: () => void
}

export default function ProcessingStatus({ progress, onCancel }: ProcessingStatusProps) {
  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Processing Block Builders
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Fetching balance updates from Bitquery...
          </p>
        </div>

        <div className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
              Processing block builders
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Please wait while we fetch transaction data from Bitquery...
            </p>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-500">
            {percentage}% complete
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onCancel}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
              Cancel Processing
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

