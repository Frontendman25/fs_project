import { IPostRepository } from '../../../domain/repositories/post.repository'
import {
  validateUpdatePostDTO,
  validatePostIdParamDTO
} from '../../dtos/post.dto'
import { Post } from '../../../domain/entities/post.entity'
import { NotFoundError, ForbiddenError } from '../../../domain/errors/app.error'

/**
 * Input interface for UpdatePostUseCase
 */
export interface UpdatePostUseCaseInput {
  params: unknown // Raw parameters containing post ID
  data: unknown // Raw update data
  userId: string // User ID for authorization
}

/**
 * Output interface for UpdatePostUseCase
 */
export interface UpdatePostUseCaseOutput {
  post: Post
}

/**
 * Update Post Use Case - Handles post update business logic
 * This is part of the Application layer in Clean Architecture
 * Validates input, enforces authorization, and orchestrates post updates
 */
export class UpdatePostUseCase {
  constructor(private postRepository: IPostRepository) {}

  /**
   * Execute the update post use case
   * @param input - Raw input data containing update parameters and data
   * @returns Promise with updated post data
   * @throws ValidationError if input validation fails
   * @throws NotFoundError if post is not found
   * @throws ForbiddenError if user doesn't own the post
   * @throws InternalServerError if post update fails
   */
  async execute(
    input: UpdatePostUseCaseInput
  ): Promise<UpdatePostUseCaseOutput> {
    try {
      // Validate parameters and data using Zod schemas
      const validatedParams = validatePostIdParamDTO(input.params)
      const validatedData = validateUpdatePostDTO(input.data)

      // Check if post exists and belongs to user
      const isOwner = await this.postRepository.existsAndBelongsToUser(
        validatedParams.id,
        input.userId
      )

      if (!isOwner) {
        throw new ForbiddenError(
          'You do not have permission to update this post'
        )
      }

      // Update post through repository
      const post = await this.postRepository.update(
        validatedParams.id,
        validatedData
      )

      if (!post) {
        throw new NotFoundError('Post')
      }

      return { post }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error
      }

      if (error instanceof Error && error.name === 'ValidationError') {
        throw error
      }

      // Handle unexpected errors
      throw new Error(
        `Failed to update post: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}
