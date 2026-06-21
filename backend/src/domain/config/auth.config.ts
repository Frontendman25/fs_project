/**
 * Authentication configuration constants
 * Following Clean Architecture - Domain layer contains business rules and constants
 */

import { normalizeUrl } from './backend-url.config'

/**
 * Frontend origin — JWT `aud` (audience), aligned with CORS `FRONTEND_URL`.
 * Required in production.
 */
export function getJwtAudience(): string {
  const raw = process.env.FRONTEND_URL?.trim()
  if (raw) {
    return normalizeUrl(raw)
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FRONTEND_URL must be set in production (JWT audience and CORS)'
    )
  }

  return 'http://localhost:3000'
}

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

function readAccessTokenExpiresIn(): string {
  const raw = process.env.ACCESS_TOKEN_EXPIRES_IN?.trim()
  return raw && raw.length > 0 ? raw : '12h'
}

function readRefreshTokenExpiresDays(): number {
  const raw = process.env.REFRESH_TOKEN_EXPIRES_DAYS?.trim()
  if (!raw) {
    return 7
  }
  // const n = Number.parseInt(raw, 10)
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) && n > 0 ? n : 7
}

export type AuthJwtSettings = {
  accessTokenExpiresIn: string
  refreshTokenExpiresDays: number
}

/**
 * JWT / refresh timing (read lazily so `dotenv` runs before first use).
 * - `accessTokenExpiresIn` → `jwt.sign` `expiresIn` (jsonwebtoken string/number rules).
 * - `refreshTokenExpiresDays` → DB `expiresAt` and refresh cookie `maxAge`.
 */
export function getAuthJwtSettings(): AuthJwtSettings {
  return {
    accessTokenExpiresIn: readAccessTokenExpiresIn(),
    refreshTokenExpiresDays: readRefreshTokenExpiresDays()
  }
}

/**
 * httpOnly refresh cookie `maxAge` in milliseconds — aligned with refresh token TTL.
 */
export function refreshTokenCookieMaxAgeMs(): number {
  return readRefreshTokenExpiresDays() * 24 * 60 * 60 * 1000
}

/**
 * Type for rate limit configuration
 */
export type RateLimitConfig = typeof RATE_LIMIT_CONFIG

/**
 * Type for JWT timing configuration
 */
export type JWTConfig = AuthJwtSettings
