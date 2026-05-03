/**
 * Domain configuration barrel export
 * Following Clean Architecture - centralized exports for domain layer
 */

export { PAGINATION_CONFIG, type PaginationConfig } from './pagination.config'
export {
  RATE_LIMIT_CONFIG,
  getAuthJwtSettings,
  refreshTokenCookieMaxAgeMs,
  type RateLimitConfig,
  type JWTConfig,
  type AuthJwtSettings
} from './auth.config'
