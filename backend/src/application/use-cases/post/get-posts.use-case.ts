import { IPostRepository } from '../../../domain/repositories/post.repository'
import { PostWithUser, CursorPaginationResult } from '../../../domain/entities/post.entity'
import { validateGetPostsQueryDTO } from '../../dtos/post.dto'

/**
 * Input interface for GetPostsUseCase
 */
export interface GetPostsUseCaseInput {
  query: unknown // Raw query parameters to be validated
}

/**
 * Output interface for GetPostsUseCase
 */
export interface GetPostsUseCaseOutput {
  posts: CursorPaginationResult<PostWithUser>
}

/**
 * Get Posts Use Case - Handles post retrieval with cursor pagination
 * This is part of the Application layer in Clean Architecture
 * Validates query parameters and orchestrates post retrieval
 */
export class GetPostsUseCase {
  constructor(private postRepository: IPostRepository) {}

  /**
   * Execute the get posts use case
   * @param input - Raw input data containing query parameters
   * @returns Promise with paginated posts including user information
   * @throws ValidationError if query validation fails
   * @throws InternalServerError if post retrieval fails
   */
  async execute(input: GetPostsUseCaseInput): Promise<GetPostsUseCaseOutput> {
    try {
      // Validate query parameters using Zod schema
      const validatedQuery = validateGetPostsQueryDTO(input.query)

      // Get posts with user information and cursor pagination
      const posts = await this.postRepository.findWithUserAndCursor(validatedQuery)

      return { posts }
    } catch (error) {
      if (error instanceof Error && error.name === 'ValidationError') {
        throw error
      }
      
      // Handle unexpected errors
      throw new Error(`Failed to get posts: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}