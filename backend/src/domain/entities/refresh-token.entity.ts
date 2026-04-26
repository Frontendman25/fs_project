/**
 * RefreshToken Entity - Core business object for managing refresh tokens
 * This is part of the Domain layer in Clean Architecture
 * Refresh tokens are long-lived tokens used to generate new access tokens
 */
export interface RefreshToken {
  id: string
  token: string // The actual refresh token string
  userId: string // Reference to the user who owns this token
  expiresAt: Date // When this refresh token expires
  isRevoked: boolean // Whether this token has been revoked/invalidated
  deviceInfo: string // User-Agent or parsed device (e.g. "Chrome on Windows")
  ipAddress: string // Client IP address
  lastUsedAt: Date // Last time this token was used for refresh
  createdAt: Date
  updatedAt: Date
}

/**
 * Data needed to create a new refresh token
 */
export interface CreateRefreshTokenData {
  token: string
  userId: string
  expiresAt: Date
  deviceInfo?: string
  ipAddress?: string
}

/**
 * Data that can be updated for a refresh token
 */
export interface UpdateRefreshTokenData {
  isRevoked?: boolean
  expiresAt?: Date
  lastUsedAt?: Date
}
