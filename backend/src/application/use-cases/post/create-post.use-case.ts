import { IPostRepository } from '../../../domain/repositories/post.repository'
import { Post } from '../../../domain/entities/post.entity'
import { ValidationError } from '../../../domain/errors/app.error'
import { validateCreatePostDTO } from '../../dtos/post.dto'

/**
 * Input interface for CreatePostUseCase
 */
export interface CreatePostUseCaseInput {
  data: unknown // Raw input data to be validated
}

/**
 * Output interface for CreatePostUseCase
 */
export interface CreatePostUseCaseOutput {
  post: Post
}

/**
 * Create Post Use Case - Handles post creation business logic
 * This is part of the Application layer in Clean Architecture
 * Validates input, enforces business rules, and orchestrates post creation
 */
export class CreatePostUseCase {
  constructor(private postRepository: IPostRepository) {}

  /**
   * Execute the create post use case
   * @param input - Raw input data containing post creation information
   * @returns Promise with created post data
   * @throws ValidationError if input validation fails
   * @throws InternalServerError if post creation fails
   */
  async execute(
    input: CreatePostUseCaseInput
  ): Promise<CreatePostUseCaseOutput> {
    try {
      // Validate input data using Zod schema
      const validatedData = validateCreatePostDTO(input.data)

      // Create post through repository
      const post = await this.postRepository.create(validatedData)

      return { post }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }

      // Handle unexpected errors
      throw new Error(
        `Failed to create post: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}
