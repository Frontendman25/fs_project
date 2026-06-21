/**
 * Post interface matching backend Post entity
 */
export interface Post {
  id: string
  userId: string
  content: string
  createdAt: string
  updatedAt?: string
}

/**
 * Post with User information
 */
export interface PostWithUser extends Post {
  user: {
    id: string
    username: string
    email: string
  }
}

/**
 * Create Post DTO
 */
export interface CreatePostDTO {
  userId: string
  content: string
}

/**
 * Update Post DTO
 */
export interface UpdatePostDTO {
  content: string
}

/**
 * Get Posts Query Parameters
 */
export interface GetPostsQuery {
  userId?: string
  cursor?: string
  limit?: number
}

/**
 * Paginated Posts Response
 */
export interface PaginatedPostsResponse {
  data: PostWithUser[]
  pagination: {
    nextCursor?: string
    hasMore: boolean
  }
}
