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

function readAccessTokenExpiresIn(): string {
  const raw = process.env.ACCESS_TOKEN_EXPIRES_IN?.trim()
  return raw && raw.length > 0 ? raw : '12h'
}

function readRefreshTokenExpiresDays(): number {
  const raw = process.env.REFRESH_TOKEN_EXPIRES_DAYS?.trim()
  if (!raw) {
    return 7
  }
  const n = Number.parseInt(raw, 10)
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
