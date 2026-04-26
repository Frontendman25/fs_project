import { apiClient } from './client'
import type { ApiResponse } from '../types/api'

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

/**
 * Posts API service for frontend-backend communication
 * Follows Feature-Sliced Design architecture
 */
export const postsApi = {
  /**
   * Create a new post
   * @param data - Post creation data
   * @returns Promise with created post
   */
  async createPost(data: CreatePostDTO): Promise<ApiResponse<Post>> {
    return apiClient.post('/api/posts', data)
  },

  /**
   * Get posts with cursor pagination
   * @param query - Query parameters for pagination
   * @returns Promise with paginated posts
   */
  async getPosts(
    query: GetPostsQuery = {}
  ): Promise<ApiResponse<PaginatedPostsResponse>> {
    const searchParams = new URLSearchParams()

    if (query.userId) searchParams.append('userId', query.userId)
    if (query.cursor) searchParams.append('cursor', query.cursor)
    if (query.limit) searchParams.append('limit', query.limit.toString())

    const queryString = searchParams.toString()
    const url = queryString ? `/api/posts?${queryString}` : '/api/posts'

    return apiClient.get(url)
  },

  /**
   * Get a specific post by ID
   * @param id - Post ID
   * @returns Promise with post data
   */
  async getPostById(id: string): Promise<ApiResponse<Post>> {
    return apiClient.get(`/api/posts/${id}`)
  },

  /**
   * Update a post
   * @param id - Post ID
   * @param data - Update data
   * @param userId - User ID for authorization
   * @returns Promise with updated post
   */
  async updatePost(
    id: string,
    data: UpdatePostDTO,
    userId: string
  ): Promise<ApiResponse<Post>> {
    return apiClient.put(`/api/posts/${id}`, { ...data, userId })
  },

  /**
   * Delete a post
   * @param id - Post ID
   * @param userId - User ID for authorization
   * @returns Promise with deletion result
   */
  async deletePost(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/posts/${id}`)
  },

  /**
   * Get post count for a user
   * @param userId - User ID
   * @returns Promise with post count
   */
  async getPostCount(userId: string): Promise<ApiResponse<{ count: number }>> {
    return apiClient.get(`/api/posts/count/${userId}`)
  }
}
