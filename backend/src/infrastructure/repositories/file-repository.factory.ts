import { PrismaClient } from '@prisma/client'

import { IFileRepository } from '@/domain/repositories/file.repository'

import { logger } from '@/infrastructure/utils/logger'

import { MongoDBFileRepository } from './mongodb/mongodb-file.repository'
import { PostgreSQLFileRepository } from './postgresql/postgresql-file.repository'

export {
  RepositoryConfigValidator,
  type IRepositoryValidationResult
} from './repository-config.validator'

/**
 * File Repository Factory - Creates appropriate file repository based on database type
 * This is part of the Infrastructure layer in Clean Architecture
 * Allows switching between MongoDB and PostgreSQL for file metadata storage
 */
export class FileRepositoryFactory {
  /**
   * Create a file repository based on database type
   * @param databaseType - Type of database ('mongodb' or 'postgresql')
   * @param config - Configuration object for the repository
   * @returns IFileRepository implementation
   */
  static createFileRepository(
    databaseType: 'mongodb' | 'postgresql',
    config?: IRepositoryConfig
  ): IFileRepository {
    switch (databaseType.toLowerCase()) {
      case 'mongodb':
        return new MongoDBFileRepository(logger)

      case 'postgresql':
        const prismaClient =
          config?.postgresql?.prismaClient || new PrismaClient()
        return new PostgreSQLFileRepository(prismaClient, logger)

      default:
        console.warn(
          `Unknown database type: ${databaseType}. Falling back to MongoDB.`
        )
        return new MongoDBFileRepository(logger)
    }
  }

  /**
   * Create file repository from environment variables
   * @param prismaClient - Optional Prisma client instance
   * @returns IFileRepository implementation
   */
  static createFromEnvironment(prismaClient?: PrismaClient): IFileRepository {
    const databaseType = (process.env.DATABASE_TYPE || 'mongodb') as
      | 'mongodb'
      | 'postgresql'

    // Only initialize Prisma when using PostgreSQL to avoid unnecessary initialization errors
    const config: IRepositoryConfig =
      databaseType === 'postgresql'
        ? {
            postgresql: {
              prismaClient: prismaClient || new PrismaClient()
            }
          }
        : {}

    return this.createFileRepository(databaseType, config)
  }

  /**
   * Get available database types for file repositories
   * @returns Array of available database types
   */
  static getAvailableDatabaseTypes(): ('mongodb' | 'postgresql')[] {
    return ['mongodb', 'postgresql']
  }

  /**
   * Get database type from environment
   * @returns Current database type from environment
   */
  static getDatabaseTypeFromEnvironment(): 'mongodb' | 'postgresql' {
    return (process.env.DATABASE_TYPE || 'mongodb') as 'mongodb' | 'postgresql'
  }

  /**
   * Validate database configuration
   * @param databaseType - Type of database
   * @param config - Configuration object
   * @returns boolean indicating if configuration is valid
   */
  static validateConfig(
    databaseType: 'mongodb' | 'postgresql',
    config?: IRepositoryConfig
  ): boolean {
    switch (databaseType.toLowerCase()) {
      case 'mongodb':
        // MongoDB configuration is handled by mongoose connection
        return true

      case 'postgresql':
        // PostgreSQL requires Prisma client
        return !!(config?.postgresql?.prismaClient || process.env.DATABASE_URL)

      default:
        return false
    }
  }
}

/**
 * Repository configuration interfaces
 */
export interface IRepositoryConfig {
  postgresql?: {
    prismaClient?: PrismaClient
  }
}
