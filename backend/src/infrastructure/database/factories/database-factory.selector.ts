import { IDatabaseFactory } from '@/domain/repositories/database.factory'

import { PostgreSQLDatabaseFactory } from './postgresql-database.factory'
import { MongoDBDatabaseFactory } from './mongodb-database.factory'

/**
 * Database Factory Selector - Strategy pattern implementation
 * Following Clean Architecture - Infrastructure layer (factories subfolder)
 * Provides a centralized way to select and create the appropriate database factory
 * based on configuration or environment variables
 */
export class DatabaseFactorySelector {
  /**
   * Supported database types
   */
  public static readonly DATABASE_TYPES = {
    POSTGRESQL: 'postgresql',
    MONGODB: 'mongodb'
  } as const

  /**
   * Create and return the appropriate database factory based on configuration
   * @param databaseType - Type of database to use ('postgresql' or 'mongodb')
   * @param connectionString - Optional connection string (uses env vars if not provided)
   * @returns IDatabaseFactory implementation
   */
  static createDatabaseFactory(
    databaseType?: string,
    connectionString?: string
  ): IDatabaseFactory {
    // Get database type from parameter, environment variable, or default to PostgreSQL
    const dbType =
      databaseType ||
      process.env.DATABASE_TYPE ||
      DatabaseFactorySelector.DATABASE_TYPES.POSTGRESQL

    console.log(`🏭 Creating database factory for: ${dbType}`)

    switch (dbType.toLowerCase()) {
      case DatabaseFactorySelector.DATABASE_TYPES.POSTGRESQL:
        return new PostgreSQLDatabaseFactory()

      case DatabaseFactorySelector.DATABASE_TYPES.MONGODB:
        return new MongoDBDatabaseFactory(connectionString)

      default:
        console.warn(
          `⚠️  Unknown database type: ${dbType}, defaulting to PostgreSQL`
        )
        return new PostgreSQLDatabaseFactory()
    }
  }

  /**
   * Get available database types
   * @returns Array of supported database type strings
   */
  static getAvailableDatabaseTypes(): string[] {
    return Object.values(DatabaseFactorySelector.DATABASE_TYPES)
  }

  /**
   * Validate if a database type is supported
   * @param databaseType - Database type to validate
   * @returns Boolean indicating if the database type is supported
   */
  static isValidDatabaseType(databaseType: string): boolean {
    return Object.values(DatabaseFactorySelector.DATABASE_TYPES).includes(
      databaseType as any
    )
  }

  /**
   * Create database factory from environment configuration
   * This method reads configuration from environment variables
   * @returns IDatabaseFactory implementation based on environment config
   */
  static createFromEnvironment(): IDatabaseFactory {
    const databaseType = process.env.DATABASE_TYPE
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.MONGODB_URI ||
      process.env.POSTGRESQL_URL

    console.log('🌍 Creating database factory from environment configuration')
    console.log(`   Database Type: ${databaseType || 'default (postgresql)'}`)
    console.log(
      `   Connection String: ${connectionString ? '[CONFIGURED]' : '[NOT SET]'}`
    )

    return DatabaseFactorySelector.createDatabaseFactory(
      databaseType,
      connectionString
    )
  }
}
