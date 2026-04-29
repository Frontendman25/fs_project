import { IDatabaseFactory } from '@/domain/repositories/database.factory'
import { IPostRepository } from '@/domain/repositories/post.repository'

import {
  CreatePostUseCase,
  GetPostsUseCase,
  GetPostByIdUseCase,
  UpdatePostUseCase,
  DeletePostUseCase,
  GetPostCountUseCase
} from '@/application/use-cases/post'

import { PostController } from '@/presentation/controllers/post.controller'

/**
 * Post Container - Dependency injection container for post-related services
 * This is part of the Infrastructure layer in Clean Architecture
 * Manages the lifecycle and dependencies of post-related components
 */
export class PostContainer {
  private postRepository!: IPostRepository
  private createPostUseCase!: CreatePostUseCase
  private getPostsUseCase!: GetPostsUseCase
  private getPostByIdUseCase!: GetPostByIdUseCase
  private updatePostUseCase!: UpdatePostUseCase
  private deletePostUseCase!: DeletePostUseCase
  private getPostCountUseCase!: GetPostCountUseCase
  private postController!: PostController
  private databaseFactory: IDatabaseFactory
  private initialized = false

  constructor(databaseFactory: IDatabaseFactory) {
    this.databaseFactory = databaseFactory
    // Don't initialize services immediately - wait until first access
  }

  /**
   * Ensure services are initialized (lazy loading)
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      // Initialize PostRepository using databaseFactory
      this.postRepository = this.createPostRepository(this.databaseFactory)

      // Initialize all use cases with repository dependency
      this.createPostUseCase = new CreatePostUseCase(this.postRepository)
      this.getPostsUseCase = new GetPostsUseCase(this.postRepository)
      this.getPostByIdUseCase = new GetPostByIdUseCase(this.postRepository)
      this.updatePostUseCase = new UpdatePostUseCase(this.postRepository)
      this.deletePostUseCase = new DeletePostUseCase(this.postRepository)
      this.getPostCountUseCase = new GetPostCountUseCase(this.postRepository)

      // Initialize PostController with all use cases
      this.postController = new PostController(
        this.createPostUseCase,
        this.getPostsUseCase,
        this.getPostByIdUseCase,
        this.updatePostUseCase,
        this.deletePostUseCase,
        this.getPostCountUseCase
      )

      this.initialized = true
    }
  }

  /**
   * Create the appropriate PostRepository based on database type
   * The repository is created directly from the database factory
   * @param databaseFactory - Database factory
   * @returns IPostRepository implementation
   */
  private createPostRepository(
    databaseFactory: IDatabaseFactory
  ): IPostRepository {
    // Use the database factory to get the appropriate repository
    // This follows Clean Architecture by letting the factory handle database-specific logic
    return databaseFactory.getPostRepository()
  }

  /**
   * Get the PostRepository instance
   * @returns IPostRepository instance
   */
  getPostRepository(): IPostRepository {
    this.ensureInitialized()
    return this.postRepository
  }

  /**
   * Get individual use case instances
   */
  getCreatePostUseCase(): CreatePostUseCase {
    this.ensureInitialized()
    return this.createPostUseCase
  }

  getGetPostsUseCase(): GetPostsUseCase {
    this.ensureInitialized()
    return this.getPostsUseCase
  }

  getGetPostByIdUseCase(): GetPostByIdUseCase {
    this.ensureInitialized()
    return this.getPostByIdUseCase
  }

  getUpdatePostUseCase(): UpdatePostUseCase {
    this.ensureInitialized()
    return this.updatePostUseCase
  }

  getDeletePostUseCase(): DeletePostUseCase {
    this.ensureInitialized()
    return this.deletePostUseCase
  }

  getGetPostCountUseCase(): GetPostCountUseCase {
    this.ensureInitialized()
    return this.getPostCountUseCase
  }

  /**
   * Get the PostController instance
   * @returns PostController instance
   */
  getPostController(): PostController {
    this.ensureInitialized()
    return this.postController
  }

  /**
   * Cleanup resources
   * Called when the application is shutting down
   */
  cleanup(): void {
    console.log('PostContainer: Cleanup completed')
  }
}
