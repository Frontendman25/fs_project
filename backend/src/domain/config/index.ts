/**
 * Domain configuration barrel export
 * Following Clean Architecture - centralized exports for domain layer
 */

export { PAGINATION_CONFIG, type PaginationConfig } from './pagination.config'
export {
  RATE_LIMIT_CONFIG,
  JWT_CONFIG,
  type RateLimitConfig,
  type JWTConfig
} from './auth.config'
