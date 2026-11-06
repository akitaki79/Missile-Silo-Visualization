import { LIMITS } from '@/config/defaults'
import type { FieldErrors, NumericField, NumericInputs } from '@/types'

/** Parse one text field. Returns the number, or an error message for inline display. */
export function parseField(field: NumericField, raw: string): number | string {
  const { min, max, integer } = LIMITS[field]
  const text = raw.trim()
  if (text === '') return 'Required'
  const value = Number(text)
  if (!Number.isFinite(value)) return 'Enter a number'
  if (integer && !Number.isInteger(value)) return 'Enter a whole number'
  if (value < min || value > max) return `Must be between ${fmt(min)} and ${fmt(max)}`
  return value
}

/** Validate every field at once. `values` is complete only when `errors` is empty. */
export function validateInputs(inputs: NumericInputs): {
  values: Partial<Record<NumericField, number>>
  errors: FieldErrors
} {
  const values: Partial<Record<NumericField, number>> = {}
  const errors: FieldErrors = {}
  for (const field of Object.keys(inputs) as NumericField[]) {
    const result = parseField(field, inputs[field])
    if (typeof result === 'string') errors[field] = result
    else values[field] = result
  }
  return { values, errors }
}

function fmt(n: number): string {
  return n.toLocaleString('en-US')
}
