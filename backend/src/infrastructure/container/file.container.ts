import { IFileRepository } from '@/domain/repositories/file.repository'
import { IFileStorageService } from '@/domain/services/file-storage.service'
import { IDatabaseFactory } from '@/domain/repositories/database.factory'
import {
  StorageServiceFactory,
  StorageConfigValidator
} from '../services/storage-service.factory'
import { FileEventService } from '../services/file-event.service'
import { FileUseCase } from '../../application/use-cases/file.use-case'
import { FileController } from '../../presentation/controllers/file.controller'

/**
 * File Container - Dependency injection container for file-related services
 * This is part of the Infrastructure layer in Clean Architecture
 * Manages dependency injection and service instantiation
 */
export class FileContainer {
  private _fileRepository!: IFileRepository
  private _fileStorageService!: IFileStorageService
  private _fileEventService!: FileEventService
  private _fileUseCase!: FileUseCase
  private _fileController!: FileController
  private _databaseFactory: IDatabaseFactory
  private _initialized = false

  constructor(databaseFactory: IDatabaseFactory) {
    this._databaseFactory = databaseFactory
    // Don't initialize services immediately - wait until first access
  }

  /**
   * Ensure services are initialized (lazy loading)
   */
  private ensureInitialized(): void {
    if (!this._initialized) {
      this.initializeServices(this._databaseFactory)
      this._initialized = true
    }
  }

  /**
   * Initialize all services with proper dependency injection
   */
  private initializeServices(databaseFactory: IDatabaseFactory): void {
    // Validate configurations
    this.validateConfigurations()

    // Infrastructure layer services using database factory
    this._fileRepository = databaseFactory.getFileRepository()
    this._fileStorageService = StorageServiceFactory.createFromEnvironment()
    this._fileEventService = new FileEventService()

    // Application layer use case
    this._fileUseCase = new FileUseCase(
      this._fileRepository,
      this._fileStorageService,
      this._fileEventService
    )

    // Presentation layer controller
    this._fileController = new FileController(this._fileUseCase)

    // Setup event listeners for monitoring
    this.setupEventListeners()

    // Log configuration summary
    this.logConfigurationSummary()
  }

  /**
   * Setup additional event listeners for monitoring and logging
   */
  private setupEventListeners(): void {
    // Monitor upload events
    this._fileEventService.on('upload:started', (event) => {
      console.log(`📤 File upload initiated: ${event.originalName}`)
    })

    this._fileEventService.on('upload:completed', (event) => {
      console.log(
        `✅ File upload completed: ${event.originalName} (${event.compressionRatio.toFixed(2)}x compression)`
      )
    })

    this._fileEventService.on('upload:error', (event) => {
      console.error(
        `❌ File upload failed: ${event.originalName} - ${event.error.message}`
      )
    })

    // Monitor download events
    this._fileEventService.on('download:started', (event) => {
      console.log(`📥 File download initiated: ${event.originalName}`)
    })

    this._fileEventService.on('download:completed', (event) => {
      console.log(`✅ File download completed: ${event.originalName}`)
    })

    this._fileEventService.on('download:error', (event) => {
      console.error(
        `❌ File download failed: ${event.originalName} - ${event.error.message}`
      )
    })

    // Monitor storage events
    this._fileEventService.on('storage:full', (event) => {
      console.warn(
        `⚠️  Storage warning: Available space is low (${event.availableSpace} bytes)`
      )
    })

    this._fileEventService.on('storage:error', (event) => {
      console.error(`💾 Storage error: ${event.error.message}`)
    })
  }

  /**
   * Validate all configurations before initialization
   */
  private validateConfigurations(): void {
    const storageValidation = StorageConfigValidator.validateEnvironment()
    if (!storageValidation.isValid) {
      console.error('❌ Storage configuration errors:')
      storageValidation.errors.forEach((error) =>
        console.error(`   - ${error}`)
      )
      throw new Error('Invalid storage configuration')
    }

    if (storageValidation.warnings.length > 0) {
      console.warn('⚠️  Storage configuration warnings:')
      storageValidation.warnings.forEach((warning) =>
        console.warn(`   - ${warning}`)
      )
    }
  }

  /**
   * Log configuration summary
   */
  private logConfigurationSummary(): void {
    console.log('📋 File Service Configuration Summary:')
    console.log(StorageConfigValidator.getConfigSummary())

    const storageType = StorageServiceFactory.getStorageTypeFromEnvironment()

    console.log(`🔧 Active Configuration:`)
    console.log(`   Storage: ${storageType.toUpperCase()}`)
  }

  /**
   * Get file repository instance
   * @returns IFileRepository instance
   */
  public getFileRepository(): IFileRepository {
    this.ensureInitialized()
    return this._fileRepository
  }

  /**
   * Get file storage service instance
   * @returns IFileStorageService instance
   */
  public getFileStorageService(): IFileStorageService {
    this.ensureInitialized()
    return this._fileStorageService
  }

  /**
   * Get file event service instance
   * @returns FileEventService instance
   */
  public getFileEventService(): FileEventService {
    this.ensureInitialized()
    return this._fileEventService
  }

  /**
   * Get file use case instance
   * @returns FileUseCase instance
   */
  public getFileUseCase(): FileUseCase {
    this.ensureInitialized()
    return this._fileUseCase
  }

  /**
   * Get file controller instance
   * @returns FileController instance
   */
  public getFileController(): FileController {
    this.ensureInitialized()
    return this._fileController
  }

  /**
   * Cleanup resources and event listeners
   */
  public async cleanup(): Promise<void> {
    this._fileEventService.removeAllListeners()

    console.log('🧹 File container cleanup completed')
  }

  /**
   * Health check for all services
   * @returns Promise that resolves to health status
   */
  public async healthCheck(): Promise<{
    repository: boolean
    storage: boolean
    events: boolean
    overall: boolean
  }> {
    const health = {
      repository: false,
      storage: false,
      events: false,
      overall: false
    }

    try {
      // Test repository connection
      await this._fileRepository.count()
      health.repository = true
    } catch (error) {
      console.error('Repository health check failed:', error)
    }

    try {
      // Test storage service
      const stats = await this._fileStorageService.getStorageStats()
      health.storage = stats !== null
    } catch (error) {
      console.error('Storage health check failed:', error)
    }

    try {
      // Test event service
      health.events =
        this._fileEventService.getListenerCount('upload:started') >= 0
    } catch (error) {
      console.error('Event service health check failed:', error)
    }

    health.overall = health.repository && health.storage && health.events

    return health
  }
}
