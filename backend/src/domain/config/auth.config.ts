/**
 * Authentication configuration constants
 * Following Clean Architecture - Domain layer contains business rules and constants
 */

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  /**
   * Maximum number of login attempts before rate limiting kicks in
   */
  MAX_LOGIN_ATTEMPTS: 5,

  /**
   * Time window for rate limiting (in milliseconds)
   * 15 minutes = 15 * 60 * 1000 ms
   */
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,

  /**
   * Time to wait before allowing retry (in seconds)
   */
  RETRY_DELAY_SECONDS: 60
} as const

/**
 * JWT token configuration
 */
export const JWT_CONFIG = {
  /**
   * Access token expiration time (in seconds)
   * 15 minutes = 15 * 60 seconds
   */
  ACCESS_TOKEN_EXPIRES_IN: 15 * 60,

  /**
   * Refresh token expiration time (in seconds)
   * 7 days = 7 * 24 * 60 * 60 seconds
   */
  REFRESH_TOKEN_EXPIRES_IN: 7 * 24 * 60 * 60
} as const

/**
 * Type for rate limit configuration
 */
export type RateLimitConfig = typeof RATE_LIMIT_CONFIG

/**
 * Type for JWT configuration
 */
export type JWTConfig = typeof JWT_CONFIG
