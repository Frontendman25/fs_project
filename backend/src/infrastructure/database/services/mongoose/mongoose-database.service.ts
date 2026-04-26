import mongoose, { Connection } from 'mongoose'

import { IDatabaseService } from '@/domain/services/database.service'
import {
  DatabaseConnectionError,
  DatabaseQueryError,
  DatabaseNotConnectedError,
  DatabaseTransactionError
} from '@/domain/errors'

import { databaseLogger } from '@/infrastructure/utils/logger'

/**
 * Mongoose Database Service - Infrastructure Implementation
 * Following Clean Architecture - Infrastructure layer (services/mongoose subfolder)
 *
 * Concrete implementation of IDatabaseService using Mongoose ODM.
 * Manages Mongoose connection lifecycle and provides MongoDB operations.
 *
 * Features:
 * - Singleton pattern for consistent connection management
 * - Production-ready logging with Pino
 * - Custom error classes for better error handling
 * - Testable with resetInstance method
 *
 * @example
 * ```typescript
 * const dbService = MongooseDatabaseService.getInstance()
 * await dbService.connect('mongodb://localhost:27017/mydb')
 * const client = dbService.getClient()
 * ```
 */
export class MongooseDatabaseService implements IDatabaseService {
  private static instance: MongooseDatabaseService
  private connectionString: string
  private isConnectedFlag: boolean = false

  private constructor(connectionString?: string) {
    this.connectionString =
      connectionString ||
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/fs_project'

    this.setupEventHandlers()
    databaseLogger.info('MongooseDatabaseService initialized')
  }

  /**
   * Get singleton instance of MongooseDatabaseService
   *
   * @param {string} connectionString - Optional MongoDB connection string
   * @returns {MongooseDatabaseService} Singleton instance
   *
   * @example
   * ```typescript
   * const dbService = MongooseDatabaseService.getInstance()
   * ```
   */
  public static getInstance(
    connectionString?: string
  ): MongooseDatabaseService {
    if (!MongooseDatabaseService.instance) {
      MongooseDatabaseService.instance = new MongooseDatabaseService(
        connectionString
      )
    }
    return MongooseDatabaseService.instance
  }

  /**
   * Reset singleton instance (for testing purposes)
   *
   * ⚠️ Warning: Only use this in test environments!
   *
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * // In test teardown
   * await MongooseDatabaseService.resetInstance()
   * ```
   */
  public static async resetInstance(): Promise<void> {
    if (MongooseDatabaseService.instance) {
      try {
        await MongooseDatabaseService.instance.disconnect()
      } catch (error) {
        databaseLogger.warn({ error }, 'Error during instance reset')
      }
      // @ts-ignore - Allow resetting private static field for testing
      MongooseDatabaseService.instance = undefined
      databaseLogger.debug('MongooseDatabaseService instance reset')
    }
  }

  /**
   * Setup Mongoose event handlers for logging
   * @private
   */
  private setupEventHandlers(): void {
    mongoose.connection.on('connected', () => {
      this.isConnectedFlag = true
      databaseLogger.info('MongoDB connected successfully')
    })

    mongoose.connection.on('error', (error) => {
      this.isConnectedFlag = false
      databaseLogger.error({ error }, 'MongoDB connection error')
    })

    mongoose.connection.on('disconnected', () => {
      this.isConnectedFlag = false
      databaseLogger.info('MongoDB disconnected')
    })

    mongoose.connection.on('reconnected', () => {
      this.isConnectedFlag = true
      databaseLogger.info('MongoDB reconnected')
    })
  }

  /**
   * Ensure database is connected before performing operations
   * @private
   * @param {string} operation - Name of the operation
   * @throws {DatabaseNotConnectedError}
   */
  private ensureConnected(operation: string): void {
    if (!this.isConnectedFlag) {
      databaseLogger.error(
        `Operation '${operation}' attempted while disconnected`
      )
      throw new DatabaseNotConnectedError(operation)
    }
  }

  /**
   * Connect to MongoDB database
   *
   * @param {string} connectionString - Optional connection string to override default
   * @returns {Promise<void>}
   * @throws {DatabaseConnectionError}
   *
   * @example
   * ```typescript
   * await dbService.connect('mongodb://localhost:27017/mydb')
   * ```
   */
  public async connect(connectionString?: string): Promise<void> {
    try {
      const connStr = connectionString || this.connectionString

      databaseLogger.info(
        { connectionString: connStr },
        'Connecting to MongoDB...'
      )

      // Check if already connected
      if (mongoose.connection.readyState === 1) {
        databaseLogger.info('MongoDB already connected')
        this.isConnectedFlag = true

        return
      }

      // Connect to MongoDB
      await mongoose.connect(connStr)

      this.isConnectedFlag = true
      databaseLogger.info('MongoDB connected successfully')
    } catch (error) {
      this.isConnectedFlag = false
      databaseLogger.error({ error }, 'Failed to connect to MongoDB')
      throw new DatabaseConnectionError(
        'Failed to connect to MongoDB database',
        error
      )
    }
  }

  /**
   * Disconnect from MongoDB database
   *
   * @returns {Promise<void>}
   * @throws {DatabaseConnectionError}
   *
   * @example
   * ```typescript
   * await dbService.disconnect()
   * ```
   */
  public async disconnect(): Promise<void> {
    try {
      databaseLogger.info('Disconnecting from MongoDB...')

      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect()
        this.isConnectedFlag = false
        databaseLogger.info('MongoDB disconnected successfully')
      } else {
        databaseLogger.info('MongoDB was not connected')
      }
    } catch (error) {
      databaseLogger.error({ error }, 'Failed to disconnect from MongoDB')
      throw new DatabaseConnectionError(
        'Failed to disconnect from MongoDB database',
        error
      )
    }
  }

  /**
   * Get Mongoose connection instance
   *
   * @returns {Connection} Mongoose connection
   * @throws {DatabaseNotConnectedError}
   *
   * @example
   * ```typescript
   * const connection = dbService.getClient()
   * const User = connection.model('User')
   * ```
   */
  public getClient(): typeof mongoose {
    this.ensureConnected('getClient')
    return mongoose
  }

  /**
   * Check if connected to database
   *
   * @returns {boolean}
   *
   * @example
   * ```typescript
   * if (dbService.isConnected()) {
   *   // Perform operations
   * }
   * ```
   */
  public isConnected(): boolean {
    return this.isConnectedFlag && mongoose.connection.readyState === 1
  }

  /**
   * Execute a database transaction
   *
   * MongoDB transactions require a replica set or sharded cluster.
   *
   * @template T
   * @param {Function} fn - Transaction callback
   * @returns {Promise<T>}
   * @throws {DatabaseNotConnectedError}
   * @throws {DatabaseTransactionError}
   *
   * @example
   * ```typescript
   * const result = await dbService.transaction(async (session) => {
   *   const user = await User.create([{ name: 'John' }], { session })
   *   const post = await Post.create([{ userId: user[0]._id }], { session })
   *   return { user, post }
   * })
   * ```
   */
  public async transaction<T>(
    fn: (session: mongoose.ClientSession) => Promise<T>
  ): Promise<T> {
    this.ensureConnected('transaction')

    const session = await mongoose.startSession()

    try {
      databaseLogger.debug('Starting MongoDB transaction')
      session.startTransaction()

      const result = await fn(session)

      await session.commitTransaction()
      databaseLogger.debug('Transaction completed successfully')

      return result
    } catch (error) {
      await session.abortTransaction()
      databaseLogger.error({ error }, 'Transaction failed')
      throw new DatabaseTransactionError('MongoDB transaction failed', error)
    } finally {
      session.endSession()
    }
  }

  /**
   * Check database health
   *
   * @returns {Promise<boolean>}
   *
   * @example
   * ```typescript
   * const healthy = await dbService.healthCheck()
   * ```
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (mongoose.connection.readyState !== 1) {
        return false
      }

      // Perform a simple ping operation
      await mongoose.connection.db?.admin().ping()
      const isHealthy = this.isConnectedFlag

      databaseLogger.debug({ healthy: isHealthy }, 'Database health check')

      return isHealthy
    } catch (error) {
      databaseLogger.error({ error }, 'Database health check failed')
      return false
    }
  }

  /**
   * Get database statistics
   *
   * @returns {Promise<object>} Database statistics
   * @throws {DatabaseNotConnectedError}
   * @throws {DatabaseQueryError}
   *
   * @example
   * ```typescript
   * const stats = await dbService.getDatabaseStats()
   * console.log(`DB Size: ${stats.databaseSize}`)
   * ```
   */
  public async getDatabaseStats(): Promise<{
    databaseName: string
    databaseSize: number
    collections: number
    indexes: number
    objects: number
    connectionState: number
  }> {
    this.ensureConnected('getDatabaseStats')

    try {
      databaseLogger.debug('Retrieving database statistics')

      if (!mongoose.connection.db) {
        throw new DatabaseQueryError('Database connection not available')
      }

      const dbStats = await mongoose.connection.db.stats()
      const collections = await mongoose.connection.db
        .listCollections()
        .toArray()

      const stats = {
        databaseName: mongoose.connection.name,
        databaseSize: dbStats.dataSize,
        collections: collections.length,
        indexes: dbStats.indexes,
        objects: dbStats.objects,
        connectionState: mongoose.connection.readyState
      }

      databaseLogger.debug(stats, 'Database statistics retrieved')

      return stats
    } catch (error) {
      databaseLogger.error({ error }, 'Failed to get database statistics')
      throw new DatabaseQueryError('Failed to get database statistics', error)
    }
  }

  /**
   * Gracefully shutdown the database service
   *
   * @returns {Promise<void>}
   * @throws {DatabaseConnectionError}
   *
   * @example
   * ```typescript
   * process.on('SIGTERM', async () => {
   *   await dbService.shutdown()
   *   process.exit(0)
   * })
   * ```
   */
  public async shutdown(): Promise<void> {
    databaseLogger.info('Shutting down MongooseDatabaseService...')

    try {
      await this.disconnect()
      databaseLogger.info('MongooseDatabaseService shutdown completed')
    } catch (error) {
      databaseLogger.error(
        { error },
        'Error during MongooseDatabaseService shutdown'
      )
      throw new DatabaseConnectionError(
        'Failed to shutdown database service',
        error
      )
    }
  }
}
