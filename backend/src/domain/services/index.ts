/**
 * Domain Services - Barrel Export
 * Following Clean Architecture - Domain layer
 *
 * This module exports service INTERFACES (contracts) that define business capabilities.
 * These are pure interfaces with NO implementation logic.
 *
 * Concrete implementations belong in:
 * - Infrastructure layer: For technical services (database, external APIs)
 * - Application layer: For application/business logic services (UserService, etc.)
 *
 * Currently exported interfaces:
 * - IDatabaseService: Database connection and operations contract
 * - IFileEventService: File-related event handling contract
 * - IFileStorageService: File storage operations contract
 * - IChatService: Chat-related operations contract
 * - IChatEventService: Chat-related event handling contract
 * - ILoggerService: Logging functionality contract
 *
 * Add new service interfaces here as needed (e.g., ICacheService, IEmailService)
 */

export * from './database.service'
export * from './file-event.service'
export * from './file-storage.service'
export * from './chat.service'
export * from './chat-event.service'
export * from './logger.service'
