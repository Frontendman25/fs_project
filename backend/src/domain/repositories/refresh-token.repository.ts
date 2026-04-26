import {
  RefreshToken,
  CreateRefreshTokenData,
  UpdateRefreshTokenData
} from '../entities/refresh-token.entity'

/**
 * RefreshToken Repository Interface - Defines contract for refresh token data access
 * This is part of the Domain layer in Clean Architecture
 * This interface allows us to switch between different database implementations
 * (PostgreSQL with Prisma, MongoDB with Mongoose, etc.) without changing business logic
 */
export interface IRefreshTokenRepository {
  /**
   * Find a refresh token by its token string
   * @param token - The refresh token string
   * @returns Promise that resolves to RefreshToken or null if not found
   */
  findByToken(token: string): Promise<RefreshToken | null>

  /**
   * Find a refresh token by its unique ID
   * @param id - RefreshToken's unique identifier
   * @returns Promise that resolves to RefreshToken or null if not found
   */
  findById(id: string): Promise<RefreshToken | null>

  /**
   * Find all refresh tokens for a specific user
   * @param userId - User's unique identifier
   * @returns Promise that resolves to array of RefreshTokens
   */
  findByUserId(userId: string): Promise<RefreshToken[]>

  /**
   * Create a new refresh token in the database
   * @param tokenData - Data needed to create a refresh token
   * @returns Promise that resolves to the created RefreshToken
   */
  create(tokenData: CreateRefreshTokenData): Promise<RefreshToken>

  /**
   * Update an existing refresh token
   * @param id - RefreshToken's unique identifier
   * @param tokenData - Data to update
   * @returns Promise that resolves to updated RefreshToken or null if not found
   */
  update(
    id: string,
    tokenData: UpdateRefreshTokenData
  ): Promise<RefreshToken | null>

  /**
   * Delete a refresh token from the database
   * @param id - RefreshToken's unique identifier
   * @returns Promise that resolves to boolean indicating success
   */
  delete(id: string): Promise<boolean>

  /**
   * Revoke (mark as invalid) a refresh token
   * @param token - The refresh token string to revoke
   * @returns Promise that resolves to boolean indicating success
   */
  revokeToken(token: string): Promise<boolean>

  /**
   * Revoke all refresh tokens for a specific user
   * @param userId - User's unique identifier
   * @returns Promise that resolves to number of tokens revoked
   */
  revokeAllUserTokens(userId: string): Promise<number>

  /**
   * Clean up expired refresh tokens from the database
   * @returns Promise that resolves to number of tokens deleted
   */
  deleteExpiredTokens(): Promise<number>
}
