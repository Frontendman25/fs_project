/**
 * Database Service Interface
 * Following Clean Architecture - Domain layer
 *
 * Defines the contract for database service implementations.
 * This interface belongs in the Domain layer as it defines business capabilities,
 * not implementation details.
 *
 * Different database implementations (Prisma, Mongoose, TypeORM) will implement this interface.
 */
export interface IDatabaseService {
  /**
   * Connect to the database
   * @returns Promise that resolves when connected
   */
  connect(): Promise<void>

  /**
   * Disconnect from the database
   * @returns Promise that resolves when disconnected
   */
  disconnect(): Promise<void>

  /**
   * Get the database client instance
   * @returns Database client (type depends on implementation)
   */
  getClient(): any

  /**
   * Check if connected to database
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean

  /**
   * Execute a database transaction
   * @param fn - Transaction callback
   * @returns Promise with transaction result
   */
  transaction<T>(fn: (client: any) => Promise<T>): Promise<T>

  /**
   * Check database health
   * @returns Promise with health status
   */
  healthCheck(): Promise<boolean>
}
