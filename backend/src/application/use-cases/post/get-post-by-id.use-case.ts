import { IPostRepository } from '../../../domain/repositories/post.repository'
import { Post } from '../../../domain/entities/post.entity'
import { NotFoundError } from '../../../domain/errors/app.error'
import { validatePostIdParamDTO } from '../../dtos/post.dto'

/**
 * Input interface for GetPostByIdUseCase
 */
export interface GetPostByIdUseCaseInput {
  params: unknown // Raw parameters containing post ID
}

/**
 * Output interface for GetPostByIdUseCase
 */
export interface GetPostByIdUseCaseOutput {
  post: Post
}

/**
 * Get Post By ID Use Case - Handles single post retrieval
 * This is part of the Application layer in Clean Architecture
 * Validates post ID and orchestrates post retrieval
 */
export class GetPostByIdUseCase {
  constructor(private postRepository: IPostRepository) {}

  /**
   * Execute the get post by ID use case
   * @param input - Raw input data containing post ID parameters
   * @returns Promise with post data
   * @throws ValidationError if parameter validation fails
   * @throws NotFoundError if post is not found
   * @throws InternalServerError if post retrieval fails
   */
  async execute(
    input: GetPostByIdUseCaseInput
  ): Promise<GetPostByIdUseCaseOutput> {
    try {
      // Validate parameters using Zod schema
      const validatedParams = validatePostIdParamDTO(input.params)

      // Get post by ID through repository
      const post = await this.postRepository.findById(validatedParams.id)

      if (!post) {
        throw new NotFoundError('Post')
      }

      return { post }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }

      if (error instanceof Error && error.name === 'ValidationError') {
        throw error
      }

      // Handle unexpected errors
      throw new Error(
        `Failed to get post: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}
