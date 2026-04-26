import { z } from 'zod'

/**
 * Post validation schemas using Zod
 * This is part of the shared layer in FSD architecture
 * Provides reusable validation schemas for post-related operations
 */

/**
 * Create post validation schema
 */
export const createPostSchema = z.object({
  userId: z.string().min(1, 'User ID is required').trim(),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(2000, 'Content cannot exceed 2000 characters')
    .trim()
    .refine((val) => val.length > 0, 'Content cannot be empty')
})

/**
 * Update post validation schema
 */
export const updatePostSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(2000, 'Content cannot exceed 2000 characters')
    .trim()
    .refine((val) => val.length > 0, 'Content cannot be empty')
})

/**
 * Get posts query validation schema
 */
export const getPostsQuerySchema = z.object({
  userId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
  append: z.boolean().optional().default(false)
})

/**
 * Post ID validation schema
 */
export const postIdSchema = z.string().min(1, 'Post ID is required').trim()

/**
 * User ID validation schema
 */
export const userIdSchema = z.string().min(1, 'User ID is required').trim()

/**
 * Validation helper functions
 */
export const validateCreatePost = (data: unknown) => {
  return createPostSchema.parse(data)
}

export const validateUpdatePost = (data: unknown) => {
  return updatePostSchema.parse(data)
}

export const validateGetPostsQuery = (data: unknown) => {
  return getPostsQuerySchema.parse(data)
}

export const validatePostId = (id: unknown) => {
  return postIdSchema.parse(id)
}

export const validateUserId = (id: unknown) => {
  return userIdSchema.parse(id)
}

/**
 * Safe validation functions that return validation results instead of throwing
 */
export const safeValidateCreatePost = (data: unknown) => {
  return createPostSchema.safeParse(data)
}

export const safeValidateUpdatePost = (data: unknown) => {
  return updatePostSchema.safeParse(data)
}

export const safeValidateGetPostsQuery = (data: unknown) => {
  return getPostsQuerySchema.safeParse(data)
}

export const safeValidatePostId = (id: unknown) => {
  return postIdSchema.safeParse(id)
}

export const safeValidateUserId = (id: unknown) => {
  return userIdSchema.safeParse(id)
}

/**
 * Type exports
 */
export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>
export type GetPostsQueryInput = z.infer<typeof getPostsQuerySchema>
