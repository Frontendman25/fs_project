/**
 * Post-related constants
 * Following Feature-Sliced Design - shared layer for cross-cutting concerns
 */

/**
 * Post configuration constants
 */
export const POST_CONSTANTS = {
  /**
   * Maximum number of characters allowed in a post
   */
  MAX_CONTENT_LENGTH: 2000,

  /**
   * Default number of posts to load initially
   */
  DEFAULT_POST_LIMIT: 20,

  /**
   * Maximum number of posts that can be loaded at once
   */
  MAX_POST_LIMIT: 100
} as const

/**
 * Type for post constants
 */
export type PostConstants = typeof POST_CONSTANTS
