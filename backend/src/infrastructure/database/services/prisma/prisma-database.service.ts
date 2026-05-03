import { PrismaClient, Prisma } from '@prisma/client'

import {
  DatabaseConnectionError,
  DatabaseQueryError,
  DatabaseNotConnectedError,
  DatabaseTransactionError,
  DatabaseHealthCheckError
} from '@/domain/errors'

import { IDatabaseService } from '@/domain/services/database.service'

import { databaseLogger } from '@/infrastructure/utils/logger'
import {
  validateRawQueryInput,
  RawQueryInput
} from '@/infrastructure/database/services/validation'

/**
 * Prisma Database Service - Infrastructure Implementation
 * Following Clean Architecture - Infrastructure layer (services/prisma subfolder)
 *
 * Concrete implementation of DatabaseService using Prisma ORM.
 * Manages PrismaClient instance lifecycle, connection state, and provides
 * type-safe database operations with comprehensive error handling.
 *
 * Features:
 * - Singleton pattern for consistent connection management
 * - Production-ready logging with Pino
 * - Custom error classes for better error handling
 * - Input validation using Zod
 * - Type-safe Prisma event handlers
 * - Testable with resetInstance method
 *
 * @example
 * ```typescript
 * const dbService = PrismaDatabaseService.getInstance()
 * await dbService.connect()
 * const client = dbService.getClient()
 * ```
 */
export class PrismaDatabaseService implements IDatabaseService {
  private static instance: PrismaDatabaseService
  private prisma: PrismaClient
  private isConnectedFlag: boolean = false

  private constructor() {
    this.prisma = new PrismaClient({
      log: this.getLogLevels(),
      errorFormat: 'pretty'
    })

    this.setupEventHandlers()
    databaseLogger.info('PrismaDatabaseService initialized')
  }

  /**
   * Get singleton instance of PrismaDatabaseService
   *
   * Implements the Singleton pattern to ensure only one database
   * connection manager exists throughout the application lifecycle.
   *
   * @returns {PrismaDatabaseService} Singleton instance
   *
   * @example
   * ```typescript
   * const dbService = PrismaDatabaseService.getInstance()
   * ```
   */
  public static getInstance(): PrismaDatabaseService {
    if (!PrismaDatabaseService.instance) {
      PrismaDatabaseService.instance = new PrismaDatabaseService()
    }
    return PrismaDatabaseService.instance
  }

  /**
   * Reset singleton instance (for testing purposes)
   *
   * Disconnects the current instance and clears it, allowing
   * a fresh instance to be created. Useful for test isolation.
   *
   * ⚠️ Warning: Only use this in test environments!
   *
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * // In test teardown
   * await PrismaDatabaseService.resetInstance()
   * ```
   */
  public static async resetInstance(): Promise<void> {
    if (PrismaDatabaseService.instance) {
      try {
        await PrismaDatabaseService.instance.disconnect()
      } catch (error) {
        databaseLogger.warn({ error }, 'Error during instance reset')
      }
      // @ts-ignore - Allow resetting private static field for testing
      PrismaDatabaseService.instance = undefined
      databaseLogger.debug('PrismaDatabaseService instance reset')
    }
  }

  /**
   * Get Prisma log levels based on environment
   * @private
   * @returns {Array} Array of log levels
   */
  private getLogLevels(): Array<'query' | 'info' | 'warn' | 'error'> {
    const sqlTraceEnabled = process.env.SQL_TRACE === 'true'
    if (process.env.NODE_ENV === 'development') {
      return sqlTraceEnabled
        ? ['query', 'info', 'warn', 'error']
        : ['info', 'warn', 'error']
    }
    return sqlTraceEnabled ? ['query', 'error'] : ['error']
  }

  /**
   * Setup Prisma event handlers for logging and monitoring
   * Note: Event handlers temporarily disabled due to TypeScript compatibility issues
   *
   * @private
   */
  private setupEventHandlers(): void {
    // Event handlers temporarily disabled
    // TODO: Re-enable with proper TypeScript types when Prisma client is updated
    databaseLogger.debug(
      'Prisma event handlers disabled for TypeScript compatibility'
    )
  }

  /**
   * Ensure database is connected before performing operations
   *
   * Internal helper method to check connection status and throw
   * appropriate error if not connected. Reduces code duplication.
   *
   * @private
   * @param {string} operation - Name of the operation being attempted
   * @throws {DatabaseNotConnectedError} If database is not connected
   *
   * @example
   * ```typescript
   * this.ensureConnected('getClient')
   * ```
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
   * Connect to the PostgreSQL database
   *
   * Establishes a connection to PostgreSQL using Prisma.
   * Performs a test query (SELECT 1) to verify the connection.
   * Updates connection status flag on success.
   *
   * @returns {Promise<void>} Resolves when connected
   * @throws {DatabaseConnectionError} If connection fails
   *
   * @example
   * ```typescript
   * try {
   *   await dbService.connect()
   *   console.log('Connected successfully')
   * } catch (error) {
   *   console.error('Connection failed:', error)
   * }
   * ```
   */
  public async connect(): Promise<void> {
    try {
      databaseLogger.info('Connecting to PostgreSQL database via Prisma...')

      // Establish connection
      await this.prisma.$connect()

      // Verify connection with test query
      await this.prisma.$queryRaw`SELECT 1`

      this.isConnectedFlag = true
      databaseLogger.info('PostgreSQL database connected successfully')
    } catch (error) {
      this.isConnectedFlag = false
      databaseLogger.error(
        { error },
        'Failed to connect to PostgreSQL database'
      )
      throw new DatabaseConnectionError(
        'Failed to connect to PostgreSQL database',
        error
      )
    }
  }

  /**
   * Disconnect from the PostgreSQL database
   *
   * Gracefully closes the Prisma connection and updates connection status.
   * Safe to call multiple times - handles already disconnected state.
   *
   * @returns {Promise<void>} Resolves when disconnected
   * @throws {DatabaseConnectionError} If disconnection fails
   *
   * @example
   * ```typescript
   * await dbService.disconnect()
   * ```
   */
  public async disconnect(): Promise<void> {
    try {
      databaseLogger.info('Disconnecting from PostgreSQL database...')

      await this.prisma.$disconnect()

      this.isConnectedFlag = false
      databaseLogger.info('PostgreSQL database disconnected successfully')
    } catch (error) {
      databaseLogger.error(
        {
          error
        },
        'Failed to disconnect from PostgreSQL database'
      )
      throw new DatabaseConnectionError(
        'Failed to disconnect from PostgreSQL database',
        error
      )
    }
  }

  /**
   * Get the PrismaClient instance
   *
   * Returns the underlying Prisma client for direct database access.
   * Only available when connected - ensures safe database operations.
   *
   * @returns {PrismaClient} Prisma client instance
   * @throws {DatabaseNotConnectedError} If database is not connected
   *
   * @example
   * ```typescript
   * const client = dbService.getClient()
   * const users = await client.user.findMany()
   * ```
   */
  public getClient(): PrismaClient {
    this.ensureConnected('getClient')
    return this.prisma
  }

  /**
   * Check if connected to database
   *
   * @returns {boolean} True if connected, false otherwise
   *
   * @example
   * ```typescript
   * if (dbService.isConnected()) {
   *   // Perform database operations
   * }
   * ```
   */
  public isConnected(): boolean {
    return this.isConnectedFlag
  }

  /**
   * Execute a database transaction
   *
   * Wraps multiple database operations in a Prisma transaction.
   * Ensures atomicity - all operations succeed or all fail.
   * Automatically handles commit/rollback.
   *
   * Prisma's $transaction method provides:
   * - Automatic rollback on error
   * - Isolation levels
   * - Connection pooling
   *
   * @template T - Return type of the transaction
   * @param {Function} fn - Transaction callback receiving PrismaClient
   * @returns {Promise<T>} Result of the transaction
   * @throws {DatabaseNotConnectedError} If database is not connected
   * @throws {DatabaseTransactionError} If transaction fails
   *
   * @example
   * ```typescript
   * const result = await dbService.transaction(async (prisma) => {
   *   const user = await prisma.user.create({ data: { name: 'John' } })
   *   const post = await prisma.post.create({ data: { userId: user.id } })
   *   return { user, post }
   * })
   * ```
   */
  public async transaction<T>(
    fn: (
      client: Omit<
        PrismaClient,
        | '$connect'
        | '$disconnect'
        | '$on'
        | '$transaction'
        | '$use'
        | '$extends'
      >
    ) => Promise<T>
  ): Promise<T> {
    this.ensureConnected('transaction')

    try {
      databaseLogger.debug('Starting database transaction')
      const result = await this.prisma.$transaction(fn)
      databaseLogger.debug('Transaction completed successfully')
      return result
    } catch (error) {
      databaseLogger.error({ error }, 'Transaction failed')
      throw new DatabaseTransactionError('Database transaction failed', error)
    }
  }

  /**
   * Check database health
   *
   * Performs a simple query (SELECT 1) to verify database connectivity.
   * Non-throwing - returns boolean status instead.
   * Useful for health check endpoints.
   *
   * @returns {Promise<boolean>} True if healthy, false otherwise
   *
   * @example
   * ```typescript
   * app.get('/health', async (req, res) => {
   *   const healthy = await dbService.healthCheck()
   *   res.status(healthy ? 200 : 503).json({ healthy })
   * })
   * ```
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      const isHealthy = this.isConnectedFlag
      databaseLogger.debug({ healthy: isHealthy }, 'Database health check')
      return isHealthy
    } catch (error) {
      databaseLogger.error({ error }, 'Database health check failed')
      return false
    }
  }

  /**
   * Execute raw SQL query
   *
   * Executes a raw SQL query using Prisma's $queryRawUnsafe.
   * ⚠️ Use with caution - bypasses Prisma's type safety!
   *
   * Features:
   * - Input validation using Zod
   * - SQL injection prevention (basic)
   * - Parameter binding support
   * - Type inference for results
   *
   * @template T - Expected result type
   * @param {string} query - Raw SQL query
   * @param {...any[]} params - Query parameters
   * @returns {Promise<T[]>} Query results
   * @throws {DatabaseNotConnectedError} If database is not connected
   * @throws {DatabaseQueryError} If query execution fails
   * @throws {ValidationError} If input validation fails
   *
   * @example
   * ```typescript
   * const users = await dbService.executeRawQuery<User>(
   *   'SELECT * FROM users WHERE age > $1',
   *   18
   * )
   * ```
   */
  public async executeRawQuery<T = any>(
    query: string,
    ...params: any[]
  ): Promise<T[]> {
    this.ensureConnected('executeRawQuery')

    try {
      // Validate input
      const validatedInput = validateRawQueryInput({ query, params })

      databaseLogger.debug(
        {
          query: validatedInput.query,
          paramsCount: validatedInput.params.length
        },
        'Executing raw query'
      )

      const result = (await this.prisma.$queryRawUnsafe(
        validatedInput.query,
        ...validatedInput.params
      )) as T[]

      databaseLogger.debug(
        {
          resultCount: result.length
        },
        'Raw query executed successfully'
      )

      return result
    } catch (error) {
      databaseLogger.error({ error, query }, 'Raw query execution failed')
      throw new DatabaseQueryError('Failed to execute raw query', error)
    }
  }

  /**
   * Get database statistics
   *
   * Retrieves comprehensive database statistics including:
   * - Database size (bytes and human-readable)
   * - Active connection count
   * - Prisma metrics (queries, connections, etc.)
   *
   * Uses Prisma's $queryRaw for PostgreSQL-specific queries
   * and $metrics for Prisma-specific statistics.
   *
   * @returns {Promise<DatabaseStats>} Database statistics
   * @throws {DatabaseNotConnectedError} If database is not connected
   * @throws {DatabaseQueryError} If stats retrieval fails
   *
   * @example
   * ```typescript
   * const stats = await dbService.getDatabaseStats()
   * console.log(`DB Size: ${stats.databaseSize}`)
   * console.log(`Connections: ${stats.connectionCount}`)
   * ```
   */
  public async getDatabaseStats(): Promise<{
    databaseSize: string
    connectionCount: number
    prismaMetrics: any
  }> {
    this.ensureConnected('getDatabaseStats')

    try {
      databaseLogger.debug('Retrieving database statistics')

      // Get database size using PostgreSQL-specific query
      const [sizeResult] = await this.prisma.$queryRaw<
        Array<{
          size_bytes: bigint
          size_pretty: string
        }>
      >`
        SELECT 
          pg_database_size(current_database()) as size_bytes,
          pg_size_pretty(pg_database_size(current_database())) as size_pretty
      `

      // Get active connection count
      const [connectionResult] = await this.prisma.$queryRaw<
        Array<{
          count: bigint
        }>
      >`
        SELECT COUNT(*) as count 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `

      // Get Prisma metrics (queries, connection pool, etc.)
      // Note: $metrics might not be available in all Prisma versions
      const prismaMetrics = null // await this.prisma.$metrics.json()

      const stats = {
        databaseSize: sizeResult?.size_pretty || 'Unknown',
        connectionCount: Number(connectionResult?.count || 0),
        prismaMetrics
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
   * Performs cleanup and disconnects from the database.
   * Should be called during application shutdown.
   *
   * @returns {Promise<void>}
   * @throws {DatabaseConnectionError} If shutdown fails
   *
   * @example
   * ```typescript
   * // In application shutdown handler
   * process.on('SIGTERM', async () => {
   *   await dbService.shutdown()
   *   process.exit(0)
   * })
   * ```
   */
  public async shutdown(): Promise<void> {
    databaseLogger.info('Shutting down PrismaDatabaseService...')

    try {
      await this.disconnect()
      databaseLogger.info('PrismaDatabaseService shutdown completed')
    } catch (error) {
      databaseLogger.error(
        {
          error
        },
        'Error during PrismaDatabaseService shutdown'
      )
      throw new DatabaseConnectionError(
        'Failed to shutdown database service',
        error
      )
    }
  }
}
