/**
 * Post Entity - Core domain entity for posts
 * This is part of the Domain layer in Clean Architecture
 * Represents a post with its core business rules and properties
 */
export interface Post {
  id: string
  userId: string
  content: string
  createdAt: Date
  updatedAt?: Date
}

/**
 * Create Post Data - Input for creating a new post
 */
export interface CreatePostData {
  userId: string
  content: string
}

/**
 * Update Post Data - Input for updating an existing post
 */
export interface UpdatePostData {
  content?: string
}

/**
 * Post with User Info - Extended post entity for presentation
 * Includes user information for display purposes
 */
export interface PostWithUser extends Post {
  user: {
    id: string
    username: string
    email: string
  }
}

/**
 * Cursor Pagination Parameters
 */
export interface CursorPaginationParams {
  cursor?: string
  limit?: number
  userId?: string
}

/**
 * Cursor Pagination Result
 */
export interface CursorPaginationResult<T> {
  data: T[]
  nextCursor?: string
  hasMore: boolean
  total?: number
}