/**
 * Database Services - Barrel Export
 * Following Clean Architecture - Infrastructure layer
 * Central export point for all database service implementations
 */

// Prisma service (PostgreSQL)
export { PrismaDatabaseService } from './prisma/prisma-database.service'

// Mongoose service (MongoDB)
export { MongooseDatabaseService } from './mongoose/mongoose-database.service'

// Shared validation utilities (usable by any database service)
export * from './validation'
