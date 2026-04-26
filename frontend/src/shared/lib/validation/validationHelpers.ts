import { z } from 'zod'

/**
 * Validation helper functions
 * This is part of the shared layer in FSD architecture
 * Provides reusable validation utilities to reduce code duplication
 */

/**
 * Generic string validation schema with customizable rules
 */
export const createStringSchema = (
  fieldName: string,
  options: {
    min?: number
    max?: number
    required?: boolean
    trim?: boolean
  } = {}
) => {
  let schema = z.string()

  if (options.trim !== false) {
    schema = schema.trim()
  }

  if (options.required !== false) {
    schema = schema.min(1, `${fieldName} is required`)
  }

  if (options.min) {
    schema = schema.min(
      options.min,
      `${fieldName} must be at least ${options.min} characters`
    )
  }

  if (options.max) {
    schema = schema.max(
      options.max,
      `${fieldName} cannot exceed ${options.max} characters`
    )
  }

  return schema
}

/**
 * Generic validation wrapper that handles error formatting
 */
export const validateAndFormatErrors = <T>(
  validation: z.ZodSafeParseResult<T>,
  operationName: string
): { success: true; data: T } | { success: false; error: string } => {
  if (validation.success) {
    return { success: true, data: validation.data }
  }

  const errorMessage = validation.error.issues
    .map((err) => `${err.path.join('.')}: ${err.message}`)
    .join(', ')

  return {
    success: false,
    error: `${operationName} validation failed: ${errorMessage}`
  }
}

/**
 * Reusable validation functions for common patterns
 */
export const validateString = (
  value: unknown,
  fieldName: string,
  options: {
    min?: number
    max?: number
    required?: boolean
    trim?: boolean
  } = {}
) => {
  const schema = createStringSchema(fieldName, options)
  const result = schema.safeParse(value)
  return validateAndFormatErrors(result, fieldName)
}

export const validateOptionalString = (
  value: unknown,
  fieldName: string,
  options: {
    min?: number
    max?: number
    trim?: boolean
  } = {}
) => {
  const schema = createStringSchema(fieldName, { ...options, required: false })
  const result = schema.safeParse(value)
  return validateAndFormatErrors(result, fieldName)
}

/**
 * Validation for numeric values
 */
export const validateNumber = (
  value: unknown,
  fieldName: string,
  options: {
    min?: number
    max?: number
    required?: boolean
    integer?: boolean
  } = {}
) => {
  let schema = z.coerce.number()

  if (options.integer) {
    schema = schema.int(`${fieldName} must be an integer`)
  }

  if (options.min !== undefined) {
    schema = schema.min(
      options.min,
      `${fieldName} must be at least ${options.min}`
    )
  }

  if (options.max !== undefined) {
    schema = schema.max(
      options.max,
      `${fieldName} cannot exceed ${options.max}`
    )
  }

  const result = schema.safeParse(value)
  return validateAndFormatErrors(result, fieldName)
}
