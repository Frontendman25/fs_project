import { IDatabaseService } from '@/domain/services/database.service'

import { IUserRepository } from './user.repository'
import { IRefreshTokenRepository } from './refresh-token.repository'
import { IPostRepository } from './post.repository'
import { IFileRepository } from './file.repository'
import { IChatRepository } from './chat.repository'

/**
 * Database Factory Interface - Abstract factory pattern for creating repository instances
 * This is part of the Domain layer in Clean Architecture
 * This interface allows us to easily switch between different database implementations
 * (PostgreSQL with Prisma, MongoDB with Mongoose, etc.) at runtime
 */
export interface IDatabaseFactory {
  /**
   * Get the user repository instance
   * @returns IUserRepository implementation
   */
  getUserRepository(): IUserRepository

  /**
   * Get the refresh token repository instance
   * @returns IRefreshTokenRepository implementation
   */
  getRefreshTokenRepository(): IRefreshTokenRepository

  /**
   * Get the post repository instance
   * @returns IPostRepository implementation
   */
  getPostRepository(): IPostRepository

  /**
   * Get the file repository instance
   * @returns IFileRepository implementation
   */
  getFileRepository(): IFileRepository

  /**
   * Get the chat repository instance
   * @returns IChatRepository implementation
   */
  getChatRepository(): IChatRepository

  /**
   * Initialize the database connection
   * @returns Promise that resolves when connection is established
   */
  connect(): Promise<void>

  /**
   * Close the database connection
   * @returns Promise that resolves when connection is closed
   */
  disconnect(): Promise<void>

  /**
   * Get the database type/name for logging purposes
   * @returns String identifying the database type (e.g., 'postgresql', 'mongodb')
   */
  getDatabaseType(): string

  /**
   * Check database health/connectivity
   * @returns Promise that resolves to boolean indicating database health
   */
  isHealthy(): Promise<boolean>

  /**
   * Get database statistics for monitoring
   * @returns Promise with database statistics
   */
  getDatabaseStats(): Promise<any>

  /**
   * Get the database service instance for direct database access
   * This allows access to the underlying database client through IDatabaseService.getClient()
   * @returns IDatabaseService instance
   */
  getDatabaseService(): IDatabaseService
}
