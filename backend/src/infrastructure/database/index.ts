/**
 * Database Infrastructure - Barrel Export
 * Following Clean Architecture - Infrastructure layer
 * Organized structure:
 * - factories/: Database factory implementations (Abstract Factory pattern)
 * - services/: Database service implementations (connection management)
 * - schemas/: Database schema definitions (MongoDB, etc.)
 */

// Factories
export * from './factories'

// Services
export * from './services'

// Schemas
export * from './schemas'


