import { z } from 'zod'

/**
 * Create Post DTO Schema - Validation schema for creating posts
 * This is part of the Application layer in Clean Architecture
 * Defines the input contract for CreatePostUseCase
 */
export const CreatePostDTOSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(2000, 'Content cannot exceed 2000 characters')
    .trim()
})

/**
 * Update Post DTO Schema - Validation schema for updating posts
 * This is part of the Application layer in Clean Architecture
 * Defines the input contract for UpdatePostUseCase
 */
export const UpdatePostDTOSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(2000, 'Content cannot exceed 2000 characters')
    .trim()
})

/**
 * Get Posts Query DTO Schema - Validation schema for post pagination queries
 * This is part of the Application layer in Clean Architecture
 * Defines the input contract for GetPostsUseCase
 */
export const GetPostsQueryDTOSchema = z.object({
  userId: z.string().optional(),
  cursor: z.iso.datetime().optional(),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20)
})

/**
 * Post ID Param Schema - Validation schema for post ID parameters
 * This is part of the Application layer in Clean Architecture
 * Defines the input contract for GetPostByIdUseCase, UpdatePostUseCase, DeletePostUseCase
 */
export const PostIdParamSchema = z.object({
  id: z.string().min(1, 'Post ID is required')
})

/**
 * User ID Param Schema - Validation schema for user ID parameters
 * This is part of the Application layer in Clean Architecture
 * Defines the input contract for GetPostCountUseCase
 */
export const UserIdParamSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
})

/**
 * TypeScript types inferred from Zod schemas
 * These types are used by use cases and controllers
 */
export type CreatePostDTO = z.infer<typeof CreatePostDTOSchema>
export type UpdatePostDTO = z.infer<typeof UpdatePostDTOSchema>
export type GetPostsQueryDTO = z.infer<typeof GetPostsQueryDTOSchema>
export type PostIdParamDTO = z.infer<typeof PostIdParamSchema>
export type UserIdParamDTO = z.infer<typeof UserIdParamSchema>

/**
 * Validation helper functions
 * These functions are used by use cases to validate input data
 */
export const validateCreatePostDTO = (data: unknown): CreatePostDTO => {
  return CreatePostDTOSchema.parse(data)
}

export const validateUpdatePostDTO = (data: unknown): UpdatePostDTO => {
  return UpdatePostDTOSchema.parse(data)
}

export const validateGetPostsQueryDTO = (data: unknown): GetPostsQueryDTO => {
  return GetPostsQueryDTOSchema.parse(data)
}

export const validatePostIdParamDTO = (data: unknown): PostIdParamDTO => {
  return PostIdParamSchema.parse(data)
}

export const validateUserIdParamDTO = (data: unknown): UserIdParamDTO => {
  return UserIdParamSchema.parse(data)
}
