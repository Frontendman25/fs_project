import mongoose, { Connection } from 'mongoose'

import { IDatabaseFactory } from '@/domain/repositories/database.factory'
import { IDatabaseService } from '@/domain/services/database.service'
import { IUserRepository } from '@/domain/repositories/user.repository'
import { IRefreshTokenRepository } from '@/domain/repositories/refresh-token.repository'
import { IPostRepository } from '@/domain/repositories/post.repository'
import { IFileRepository } from '@/domain/repositories/file.repository'
import { IChatRepository } from '@/domain/repositories/chat.repository'

import { MongooseDatabaseService } from '@/infrastructure/database/services/mongoose/mongoose-database.service'
import { MongoDBUserRepository } from '@/infrastructure/repositories/mongodb/mongodb-user.repository'
import { MongoDBRefreshTokenRepository } from '@/infrastructure/repositories/mongodb/mongodb-refresh-token.repository'
import { MongoDBPostRepository } from '@/infrastructure/repositories/mongodb/mongodb-post.repository'
import { MongoDBFileRepository } from '@/infrastructure/repositories/mongodb/mongodb-file.repository'
import { MongoDBChatRepository } from '@/infrastructure/repositories/mongodb/mongodb-chat.repository'
import { logger } from '@/infrastructure/utils/logger'

/**
 * Enum for allowed MongoDB raw query operations
 */
export enum MongoRawQueryOperation {
  FIND = 'find',
  FIND_ONE = 'findOne',
  INSERT_ONE = 'insertOne',
  UPDATE_MANY = 'updateMany',
  DELETE_ONE = 'deleteOne'
}

/**
 * Type for raw query parameters
 */
export interface RawQueryParams {
  filter?: Record<string, unknown>
  update?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Type for database statistics
 */
export interface DatabaseStats {
  databaseName: string
  databaseSize: number
  collections: number
  indexes: number
  objects: number
  avgObjSize: number
  connectionState: number
  host: string
  port: number
}

/**
 * MongoDB Database Factory Implementation
 *
 * Implements IDatabaseFactory using Mongoose ODM for MongoDB.
 * Follows Clean Architecture principles - Infrastructure layer.
 * Uses Abstract Factory pattern to create MongoDB-specific repository instances.
 *
 * @example
 * ```typescript
 * const factory = new MongoDBDatabaseFactory('mongodb://localhost:27017/mydb')
 * await factory.connect()
 * const userRepo = factory.getUserRepository()
 * ```
 */
export class MongoDBDatabaseFactory implements IDatabaseFactory {
  private readonly databaseService: MongooseDatabaseService
  private userRepository: IUserRepository | null = null
  private refreshTokenRepository: IRefreshTokenRepository | null = null
  private postRepository: IPostRepository | null = null
  private fileRepository: IFileRepository | null = null
  private chatRepository: IChatRepository | null = null
  private readonly connectionString: string

  /**
   * Creates a new MongoDBDatabaseFactory instance
   *
   * @param connectionString - Optional MongoDB connection string.
   *                           If not provided, uses MONGODB_URI env var or default.
   */
  constructor(connectionString?: string) {
    this.connectionString =
      connectionString ||
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/auth-app'

    this.databaseService = MongooseDatabaseService.getInstance(
      this.connectionString
    )
  }

  /**
   * Get the user repository instance (singleton pattern)
   *
   * @returns IUserRepository implementation for MongoDB
   */
  getUserRepository(): IUserRepository {
    if (!this.userRepository) {
      this.userRepository = new MongoDBUserRepository(logger)
    }
    return this.userRepository
  }

  /**
   * Get the refresh token repository instance (singleton pattern)
   *
   * @returns IRefreshTokenRepository implementation for MongoDB
   */
  getRefreshTokenRepository(): IRefreshTokenRepository {
    if (!this.refreshTokenRepository) {
      this.refreshTokenRepository = new MongoDBRefreshTokenRepository(logger)
    }
    return this.refreshTokenRepository
  }

  /**
   * Get the post repository instance (singleton pattern)
   *
   * @returns IPostRepository implementation for MongoDB
   */
  getPostRepository(): IPostRepository {
    if (!this.postRepository) {
      this.postRepository = new MongoDBPostRepository(logger)
    }
    return this.postRepository
  }

  /**
   * Get the file repository instance (singleton pattern)
   *
   * @returns IFileRepository implementation for MongoDB
   */
  getFileRepository(): IFileRepository {
    if (!this.fileRepository) {
      this.fileRepository = new MongoDBFileRepository(logger)
    }
    return this.fileRepository
  }

  /**
   * Get the chat repository instance (singleton pattern)
   *
   * @returns IChatRepository implementation for MongoDB
   */
  getChatRepository(): IChatRepository {
    if (!this.chatRepository) {
      const mongooseInstance = this.databaseService.getClient()
      this.chatRepository = new MongoDBChatRepository(mongooseInstance, logger)
    }
    return this.chatRepository
  }

  /**
   * Initialize the database connection
   *
   * Connects to MongoDB using the MongooseDatabaseService.
   * Uses the connection string provided during factory instantiation.
   *
   * @returns Promise that resolves when connection is established
   * @throws Error if connection fails
   */
  async connect(): Promise<void> {
    try {
      logger.info(
        { connectionString: this.connectionString },
        'Connecting to MongoDB database'
      )

      await this.databaseService.connect()

      logger.info('MongoDB database connected successfully')
    } catch (error) {
      logger.error(
        { error, connectionString: this.connectionString },
        'Failed to connect to MongoDB database'
      )
      throw new Error(`Failed to connect to MongoDB database: ${error}`)
    }
  }

  /**
   * Close the database connection
   *
   * Properly closes the Mongoose connection via database service.
   *
   * @returns Promise that resolves when connection is closed
   * @throws Error if disconnection fails
   */
  async disconnect(): Promise<void> {
    try {
      logger.info('Disconnecting from MongoDB database')

      if (this.databaseService.isConnected()) {
        await this.databaseService.disconnect()
        logger.info('MongoDB database disconnected successfully')
      } else {
        logger.info('MongoDB database was not connected')
      }
    } catch (error) {
      logger.error({ error }, 'Failed to disconnect from MongoDB database')
      throw new Error(`Failed to disconnect from MongoDB database: ${error}`)
    }
  }

  /**
   * Get the database type identifier
   *
   * @returns String identifying the database type ('mongodb')
   */
  getDatabaseType(): string {
    return 'mongodb'
  }

  /**
   * Get the Mongoose connection instance
   *
   * Provides direct access to Mongoose connection for advanced operations.
   * Prefer using repository methods when possible.
   *
   * @returns Mongoose Connection instance
   */
  getMongooseConnection(): Connection {
    const client = this.databaseService.getClient() as typeof mongoose
    return client.connection
  }

  /**
   * Execute raw MongoDB queries
   *
   * ⚠️ Use with caution - prefer repository methods when possible.
   * This method allows executing raw queries when repository methods are insufficient.
   *
   * @param collectionName - Name of the MongoDB collection
   * @param operation - Operation to perform (from MongoRawQueryOperation enum)
   * @param query - Query parameters (filter, update, etc.)
   * @returns Promise with query results (type depends on operation)
   * @throws Error if operation is unsupported or query fails
   *
   * @example
   * ```typescript
   * const results = await factory.executeRawQuery(
   *   'users',
   *   MongoRawQueryOperation.FIND,
   *   { filter: { active: true } }
   * )
   * ```
   */
  async executeRawQuery<T = unknown>(
    collectionName: string,
    operation: MongoRawQueryOperation,
    query?: RawQueryParams
  ): Promise<T> {
    try {
      const connection = this.getMongooseConnection()

      if (!connection.db) {
        throw new Error('Database connection not available')
      }

      const collection = connection.db.collection(collectionName)

      switch (operation) {
        case MongoRawQueryOperation.FIND:
          return (await collection.find(query?.filter || {}).toArray()) as T

        case MongoRawQueryOperation.FIND_ONE:
          return (await collection.findOne(query?.filter || {})) as T

        case MongoRawQueryOperation.INSERT_ONE:
          if (!query) {
            throw new Error('Insert operation requires query parameter')
          }
          return (await collection.insertOne(query)) as T

        case MongoRawQueryOperation.UPDATE_MANY:
          if (!query?.filter || !query?.update) {
            throw new Error(
              'UpdateMany operation requires filter and update in query parameter'
            )
          }
          return (await collection.updateMany(query.filter, query.update)) as T

        case MongoRawQueryOperation.DELETE_ONE:
          if (!query?.filter) {
            throw new Error(
              'DeleteOne operation requires filter in query parameter'
            )
          }
          return (await collection.deleteOne(query.filter)) as T

        default:
          throw new Error(`Unsupported operation: ${operation}`)
      }
    } catch (error) {
      logger.error(
        { error, collectionName, operation, query },
        'Failed to execute raw query'
      )
      throw new Error(`Failed to execute raw query: ${error}`)
    }
  }

  /**
   * Check database health/connectivity
   *
   * Performs a ping operation to verify database connectivity.
   *
   * @returns Promise that resolves to boolean indicating database health
   */
  async isHealthy(): Promise<boolean> {
    try {
      if (!this.databaseService.isConnected()) {
        return false
      }

      const connection = this.getMongooseConnection()

      if (!connection.db) {
        return false
      }

      await connection.db.admin().ping()
      return true
    } catch (error) {
      logger.error({ error }, 'Database health check failed')
      return false
    }
  }

  /**
   * Get database statistics for monitoring
   *
   * Returns comprehensive database statistics including size, collections, indexes, etc.
   *
   * @returns Promise with database statistics
   * @throws Error if statistics cannot be retrieved
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    try {
      const connection = this.getMongooseConnection()

      if (!connection.db) {
        throw new Error('Database connection not available')
      }

      const dbStats = await connection.db.stats()
      const collections = await connection.db.listCollections().toArray()

      return {
        databaseName: connection.name,
        databaseSize: dbStats.dataSize,
        collections: collections.length,
        indexes: dbStats.indexes,
        objects: dbStats.objects,
        avgObjSize: dbStats.avgObjSize,
        connectionState: connection.readyState,
        host: connection.host,
        port: connection.port
      }
    } catch (error) {
      logger.error({ error }, 'Failed to get database statistics')
      throw new Error('Failed to get database statistics')
    }
  }

  /**
   * Get the database service instance
   *
   * Provides access to the underlying database service for direct operations.
   *
   * @returns IDatabaseService instance (MongooseDatabaseService)
   */
  getDatabaseService(): IDatabaseService {
    return this.databaseService
  }
}
