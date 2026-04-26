import { IPostRepository } from '../../../domain/repositories/post.repository'
import { NotFoundError, ForbiddenError } from '../../../domain/errors/app.error'
import { validatePostIdParamDTO } from '../../dtos/post.dto'

/**
 * Input interface for DeletePostUseCase
 */
export interface DeletePostUseCaseInput {
  params: unknown // Raw parameters containing post ID
  userId: string // User ID for authorization
}

/**
 * Output interface for DeletePostUseCase
 */
export interface DeletePostUseCaseOutput {
  success: boolean
}

/**
 * Delete Post Use Case - Handles post deletion business logic
 * This is part of the Application layer in Clean Architecture
 * Validates input, enforces authorization, and orchestrates post deletion
 */
export class DeletePostUseCase {
  constructor(private postRepository: IPostRepository) {}

  /**
   * Execute the delete post use case
   * @param input - Raw input data containing deletion parameters
   * @returns Promise with deletion success status
   * @throws ValidationError if parameter validation fails
   * @throws NotFoundError if post is not found
   * @throws ForbiddenError if user doesn't own the post
   * @throws InternalServerError if post deletion fails
   */
  async execute(
    input: DeletePostUseCaseInput
  ): Promise<DeletePostUseCaseOutput> {
    try {
      // Validate parameters using Zod schema
      const validatedParams = validatePostIdParamDTO(input.params)

      // Check if post exists and belongs to user
      const isOwner = await this.postRepository.existsAndBelongsToUser(
        validatedParams.id,
        input.userId
      )

      if (!isOwner) {
        throw new ForbiddenError(
          'You do not have permission to delete this post'
        )
      }

      // Delete post through repository
      const deleted = await this.postRepository.delete(validatedParams.id)

      if (!deleted) {
        throw new NotFoundError('Post')
      }

      return { success: true }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error
      }

      if (error instanceof Error && error.name === 'ValidationError') {
        throw error
      }

      // Handle unexpected errors
      throw new Error(
        `Failed to delete post: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}
