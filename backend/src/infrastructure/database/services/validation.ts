import { z } from 'zod'

/**
 * Database Service Validation Schemas
 * Following Clean Architecture - Infrastructure layer
 * Provides input validation for database operations using Zod
 */

/**
 * Raw Query Input Schema
 * Validates input for executeRawQuery method
 */
export const rawQueryInputSchema = z.object({
  query: z
    .string()
    .min(1, 'Query cannot be empty')
    .max(10000, 'Query is too long (max 10000 characters)')
    .refine(
      (query) => {
        // Prevent multiple statements (basic SQL injection prevention)
        const dangerousPatterns = [
          /;\s*DROP/i,
          /;\s*DELETE/i,
          /;\s*TRUNCATE/i,
          /--/,
          /\/\*/
        ]
        return !dangerousPatterns.some((pattern) => pattern.test(query))
      },
      { message: 'Query contains potentially dangerous patterns' }
    ),
  params: z.array(z.any()).optional().default([])
})

/**
 * Type inference for raw query input
 */
export type RawQueryInput = z.infer<typeof rawQueryInputSchema>

/**
 * Validate raw query input
 * @param input - Input to validate
 * @returns Validated input
 * @throws ValidationError if input is invalid
 */
export function validateRawQueryInput(input: {
  query: string
  params?: any[]
}): RawQueryInput {
  return rawQueryInputSchema.parse(input)
}
