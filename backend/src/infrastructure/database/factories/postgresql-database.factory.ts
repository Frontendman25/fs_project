import { IDatabaseFactory } from '@/domain/repositories/database.factory'
import { IDatabaseService } from '@/domain/services/database.service'
import { IUserRepository } from '@/domain/repositories/user.repository'
import { IRefreshTokenRepository } from '@/domain/repositories/refresh-token.repository'
import { IPostRepository } from '@/domain/repositories/post.repository'
import { IFileRepository } from '@/domain/repositories/file.repository'
import { IChatRepository } from '@/domain/repositories/chat.repository'
import { DatabaseNotConnectedError } from '@/domain/errors'

import { PostgreSQLUserRepository } from '@/infrastructure/repositories/postgresql/postgresql-user.repository'
import { PostgreSQLRefreshTokenRepository } from '@/infrastructure/repositories/postgresql/postgresql-refresh-token.repository'
import { PostgreSQLPostRepository } from '@/infrastructure/repositories/postgresql/postgresql-post.repository'
import { PostgreSQLFileRepository } from '@/infrastructure/repositories/postgresql/postgresql-file.repository'
import { PostgreSQLChatRepository } from '@/infrastructure/repositories/postgresql/postgresql-chat.repository'

import { PrismaDatabaseService } from '@/infrastructure/database/services/prisma/prisma-database.service'
import { logger } from '@/infrastructure/utils/logger'

/**
 * PostgreSQL Database Factory Implementation using Prisma ORM
 * Following Clean Architecture - Infrastructure layer (factories subfolder)
 * Implements the Abstract Factory pattern to create PostgreSQL-specific repository instances
 * Uses PrismaDatabaseService singleton for consistent connection management
 */
export class PostgreSQLDatabaseFactory implements IDatabaseFactory {
  private databaseService: PrismaDatabaseService
  private userRepository: IUserRepository | null = null
  private refreshTokenRepository: IRefreshTokenRepository | null = null
  private postRepository: IPostRepository | null = null
  private fileRepository: IFileRepository | null = null
  private chatRepository: IChatRepository | null = null

  constructor() {
    this.databaseService = PrismaDatabaseService.getInstance()
  }

  /**
   * Ensure database is connected before creating repositories
   * @private
   */
  private ensureConnected(): void {
    if (!this.databaseService.isConnected()) {
      throw new DatabaseNotConnectedError('repository access')
    }
  }

  /**
   * Get the user repository instance (singleton pattern)
   * @returns IUserRepository implementation for PostgreSQL
   */
  getUserRepository(): IUserRepository {
    if (!this.userRepository) {
      this.ensureConnected()
      this.userRepository = new PostgreSQLUserRepository(
        this.databaseService.getClient(),
        logger
      )
    }
    return this.userRepository
  }

  /**
   * Get the refresh token repository instance (singleton pattern)
   * @returns IRefreshTokenRepository implementation for PostgreSQL
   */
  getRefreshTokenRepository(): IRefreshTokenRepository {
    if (!this.refreshTokenRepository) {
      this.ensureConnected()
      this.refreshTokenRepository = new PostgreSQLRefreshTokenRepository(
        this.databaseService.getClient(),
        logger
      )
    }
    return this.refreshTokenRepository
  }

  /**
   * Get the post repository instance (singleton pattern)
   * @returns IPostRepository implementation for PostgreSQL
   */
  getPostRepository(): IPostRepository {
    if (!this.postRepository) {
      this.ensureConnected()
      this.postRepository = new PostgreSQLPostRepository(
        this.databaseService.getClient(),
        logger
      )
    }
    return this.postRepository
  }

  /**
   * Get the file repository instance (singleton pattern)
   * @returns IFileRepository implementation for PostgreSQL
   */
  getFileRepository(): IFileRepository {
    if (!this.fileRepository) {
      this.ensureConnected()
      this.fileRepository = new PostgreSQLFileRepository(
        this.databaseService.getClient(),
        logger
      )
    }
    return this.fileRepository
  }

  /**
   * Get the chat repository instance (singleton pattern)
   * @returns IChatRepository implementation for PostgreSQL
   */
  getChatRepository(): IChatRepository {
    if (!this.chatRepository) {
      this.ensureConnected()
      this.chatRepository = new PostgreSQLChatRepository(
        this.databaseService.getClient(),
        logger
      )
    }
    return this.chatRepository
  }

  /**
   * Initialize the database connection
   * This method connects to PostgreSQL using Prisma
   * @returns Promise that resolves when connection is established
   */
  async connect(): Promise<void> {
    try {
      await this.databaseService.connect()
    } catch (error) {
      console.error('❌ Failed to connect to PostgreSQL database:', error)
      throw new Error('Failed to connect to PostgreSQL database')
    }
  }

  /**
   * Close the database connection
   * This method properly closes the Prisma connection
   * @returns Promise that resolves when connection is closed
   */
  async disconnect(): Promise<void> {
    try {
      await this.databaseService.disconnect()
    } catch (error) {
      console.error('❌ Failed to disconnect from PostgreSQL database:', error)
      throw new Error('Failed to disconnect from PostgreSQL database')
    }
  }

  /**
   * Get the database type/name for logging purposes
   * @returns String identifying the database type
   */
  getDatabaseType(): string {
    return 'postgresql'
  }

  /**
   * Get the database service instance for direct database access
   * @returns IDatabaseService instance (PrismaDatabaseService)
   */
  getDatabaseService(): IDatabaseService {
    return this.databaseService
  }

  /**
   * Execute raw SQL queries (use with caution)
   * This method allows executing raw SQL when repository methods are not sufficient
   * @param query - Raw SQL query string
   * @param params - Query parameters
   * @returns Promise with query results
   */
  async executeRawQuery(query: string, ...params: any[]): Promise<any> {
    try {
      return await this.databaseService.executeRawQuery(query, ...params)
    } catch (error) {
      console.error('Error executing raw query:', error)
      throw new Error('Failed to execute raw query')
    }
  }

  /**
   * Check database health/connectivity
   * @returns Promise that resolves to boolean indicating database health
   */
  async isHealthy(): Promise<boolean> {
    try {
      return await this.databaseService.healthCheck()
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }

  /**
   * Get database statistics for monitoring
   * @returns Promise with database statistics
   */
  async getDatabaseStats(): Promise<any> {
    try {
      return await this.databaseService.getDatabaseStats()
    } catch (error) {
      console.error('Error getting database stats:', error)
      throw new Error('Failed to get database statistics')
    }
  }
}
