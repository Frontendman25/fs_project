import { IPostRepository } from '../../../domain/repositories/post.repository'
import { validateUserIdParamDTO } from '../../dtos/post.dto'

/**
 * Input interface for GetPostCountUseCase
 */
export interface GetPostCountUseCaseInput {
  params: unknown // Raw parameters containing user ID
}

/**
 * Output interface for GetPostCountUseCase
 */
export interface GetPostCountUseCaseOutput {
  count: number
}

/**
 * Get Post Count Use Case - Handles post count retrieval for a user
 * This is part of the Application layer in Clean Architecture
 * Validates user ID and orchestrates post count retrieval
 */
export class GetPostCountUseCase {
  constructor(private postRepository: IPostRepository) {}

  /**
   * Execute the get post count use case
   * @param input - Raw input data containing user ID parameters
   * @returns Promise with post count for the user
   * @throws ValidationError if parameter validation fails
   * @throws InternalServerError if post count retrieval fails
   */
  async execute(
    input: GetPostCountUseCaseInput
  ): Promise<GetPostCountUseCaseOutput> {
    try {
      // Validate parameters using Zod schema
      const validatedParams = validateUserIdParamDTO(input.params)

      // Get post count through repository
      const count = await this.postRepository.countByUser(
        validatedParams.userId
      )

      return { count }
    } catch (error) {
      if (error instanceof Error && error.name === 'ValidationError') {
        throw error
      }

      // Handle unexpected errors
      throw new Error(
        `Failed to get post count: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}
