/**
 * Pagination configuration constants
 * Following Clean Architecture - Domain layer contains business rules and constants
 */

/**
 * Default pagination limits for posts
 */
export const PAGINATION_CONFIG = {
  /**
   * Default number of posts to return when no limit is specified
   */
  DEFAULT_POST_LIMIT: 20,
  
  /**
   * Maximum number of posts that can be requested in a single query
   * Prevents abuse and ensures performance
   */
  MAX_POST_LIMIT: 100,
  
  /**
   * Default number of users to return when no limit is specified
   */
  DEFAULT_USER_LIMIT: 20,
  
  /**
   * Maximum number of users that can be requested in a single query
   */
  MAX_USER_LIMIT: 100,
  
  /**
   * Default number of files to return when no limit is specified
   */
  DEFAULT_FILE_LIMIT: 20,
  
  /**
   * Maximum number of files that can be requested in a single query
   */
  MAX_FILE_LIMIT: 100
} as const

/**
 * Type for pagination configuration
 */
export type PaginationConfig = typeof PAGINATION_CONFIG
