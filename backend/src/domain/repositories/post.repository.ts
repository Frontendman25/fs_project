import {
  Post,
  CreatePostData,
  UpdatePostData,
  CursorPaginationParams,
  CursorPaginationResult,
  PostWithUser
} from '../entities/post.entity'

/**
 * Post Repository Interface - Abstract contract for post data access
 * This is part of the Domain layer in Clean Architecture
 * Defines the contract that all post repository implementations must follow
 */
export interface IPostRepository {
  /**
   * Create a new post
   * @param postData - Post creation data
   * @returns Promise with created post
   */
  create(postData: CreatePostData): Promise<Post>

  /**
   * Find post by ID
   * @param id - Post ID
   * @returns Promise with post or null if not found
   */
  findById(id: string): Promise<Post | null>

  /**
   * Find posts with cursor pagination
   * @param params - Pagination parameters
   * @returns Promise with paginated posts
   */
  findWithCursor(
    params: CursorPaginationParams
  ): Promise<CursorPaginationResult<Post>>

  /**
   * Find posts with user info and cursor pagination
   * @param params - Pagination parameters
   * @returns Promise with paginated posts including user info
   */
  findWithUserAndCursor(
    params: CursorPaginationParams
  ): Promise<CursorPaginationResult<PostWithUser>>

  /**
   * Update a post
   * @param id - Post ID
   * @param updateData - Update data
   * @returns Promise with updated post or null if not found
   */
  update(id: string, updateData: UpdatePostData): Promise<Post | null>

  /**
   * Delete a post
   * @param id - Post ID
   * @returns Promise with boolean indicating success
   */
  delete(id: string): Promise<boolean>

  /**
   * Count posts by user
   * @param userId - User ID
   * @returns Promise with post count
   */
  countByUser(userId: string): Promise<number>

  /**
   * Check if post exists and belongs to user
   * @param id - Post ID
   * @param userId - User ID
   * @returns Promise with boolean indicating ownership
   */
  existsAndBelongsToUser(id: string, userId: string): Promise<boolean>
}
