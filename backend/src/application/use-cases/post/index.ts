/**
 * Use Cases Barrel Export - Centralized exports for all use cases
 * This is part of the Application layer in Clean Architecture
 * Provides clean imports for use case classes
 */

export { CreatePostUseCase } from './create-post.use-case'
export { GetPostsUseCase } from './get-posts.use-case'
export { GetPostByIdUseCase } from './get-post-by-id.use-case'
export { UpdatePostUseCase } from './update-post.use-case'
export { DeletePostUseCase } from './delete-post.use-case'
export { GetPostCountUseCase } from './get-post-count.use-case'

// Export input/output types
export type { CreatePostUseCaseInput, CreatePostUseCaseOutput } from './create-post.use-case'
export type { GetPostsUseCaseInput, GetPostsUseCaseOutput } from './get-posts.use-case'
export type { GetPostByIdUseCaseInput, GetPostByIdUseCaseOutput } from './get-post-by-id.use-case'
export type { UpdatePostUseCaseInput, UpdatePostUseCaseOutput } from './update-post.use-case'
export type { DeletePostUseCaseInput, DeletePostUseCaseOutput } from './delete-post.use-case'
export type { GetPostCountUseCaseInput, GetPostCountUseCaseOutput } from './get-post-count.use-case'