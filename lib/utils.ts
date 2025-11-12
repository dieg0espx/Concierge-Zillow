import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')

  // Format as (XXX) XXX-XXXX for US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }

  // Format as +X (XXX) XXX-XXXX for international numbers with country code
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }

  // Return original if format doesn't match
  return phone
}

export function formatCurrency(amount: string | number): string {
  // Convert to string and remove any non-numeric characters except decimal point and minus
  const numericString = typeof amount === 'string'
    ? amount.replace(/[^0-9.-]+/g, '')
    : amount.toString()

  const number = parseFloat(numericString)

  // Check if valid number
  if (isNaN(number)) {
    return '$0'
  }

  // Format with $ and comma separators
  return `$${number.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function formatNumber(value: string | number): string {
  // Convert to string and remove any non-numeric characters except decimal point and minus
  const numericString = typeof value === 'string'
    ? value.replace(/[^0-9.-]+/g, '')
    : value.toString()

  const number = parseFloat(numericString)

  // Check if valid number
  if (isNaN(number)) {
    return '0'
  }

  // Format with comma separators
  return number.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
