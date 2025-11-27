import * as XLSX from 'xlsx'
import Papa from 'papaparse'

export interface ValidationResult {
  validators: { address: string; rowNumber: number }[]
  errors: string[]
}

export async function validateFile(file: File): Promise<ValidationResult> {
  const errors: string[] = []
  const validators: { address: string; rowNumber: number }[] = []
  const seenAddresses = new Set<string>()

  try {
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    let addresses: string[] = []

    if (fileExtension === 'csv') {
      const text = await file.text()
      const result = Papa.parse<string[]>(text, { header: false, skipEmptyLines: true })
      
      if (result.errors.length > 0) {
        errors.push(`CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`)
      }

      // Extract addresses from all rows (assuming first column or header)
      addresses = result.data
        .map((row, index) => ({ value: row[0]?.trim(), rowNumber: index + 1 }))
        .filter(item => item.value)
        .map(item => item.value!)
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1, defval: '' })
      
      // Extract addresses from first column
      addresses = data
        .map((row, index) => ({ value: row[0]?.toString().trim(), rowNumber: index + 1 }))
        .filter(item => item.value)
        .map(item => item.value!)
    } else {
      errors.push('Unsupported file format. Please upload a CSV or Excel file.')
      return { validators: [], errors }
    }

    // Validate addresses
    addresses.forEach((address, index) => {
      const rowNumber = index + 1
      
      // Check for empty addresses
      if (!address || address.length === 0) {
        errors.push(`Row ${rowNumber}: Empty address`)
        return
      }

      // Check for duplicates
      const normalizedAddress = address.toLowerCase()
      if (seenAddresses.has(normalizedAddress)) {
        errors.push(`Row ${rowNumber}: Duplicate address ${address}`)
        return
      }
      seenAddresses.add(normalizedAddress)

      // Basic Ethereum address validation (0x followed by 40 hex characters)
      const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
      if (!ethAddressRegex.test(address)) {
        errors.push(`Row ${rowNumber}: Invalid Ethereum address format: ${address}`)
        return
      }

      validators.push({ address, rowNumber })
    })

    if (validators.length === 0) {
      errors.push('No valid validator addresses found in file')
    }

  } catch (error) {
    errors.push(`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return { validators, errors }
}

