/**
 * Chat Container - Dependency injection container for chat-related services
 * This is part of the Infrastructure layer in Clean Architecture
 * Manages dependency injection and service instantiation for chat functionality
 *
 * Features:
 * - Hybrid repository (main DB + optional Redis cache)
 * - Pino logging integration
 * - Zod validation
 * - Comprehensive JSDoc documentation
 *
 * @example
 * ```typescript
 * const container = new ChatContainer(socketIO, databaseFactory, logger)
 *
 * // Get chat service
 * const chatService = container.getChatService()
 *
 * // Create a room
 * const room = await chatService.createRoom({
 *   name: 'General Chat',
 *   type: 'public',
 *   createdBy: 'user123'
 * })
 * ```
 */

import { Server as SocketIOServer } from 'socket.io'

import { IDatabaseFactory } from '@/domain/repositories/database.factory'
import { IChatRepository } from '@/domain/repositories/chat.repository'
import { IChatService } from '@/domain/services/chat.service'
import { IChatEventService } from '@/domain/services/chat-event.service'
import { ILoggerService } from '@/domain/services/logger.service'

import { HybridChatRepository } from '@/infrastructure/repositories/hybrid/hybrid-chat.repository'
import { RedisChatRepository } from '@/infrastructure/repositories/redis/redis-chat.repository'
import { SocketIOChatEventService } from '@/infrastructure/services/socket-io-chat-event.service'

import { ChatServiceOrchestrator } from '@/application/orchestrators/chat/chat.service.orchestrator'

import { ChatController } from '@/presentation/controllers/chat.controller'

export class ChatContainer {
  private _chatRepository!: IChatRepository
  private _chatEventService!: IChatEventService
  private _chatService!: IChatService
  private _chatController!: ChatController
  private _socketIO!: SocketIOServer
  private _databaseFactory!: IDatabaseFactory
  private _logger!: ILoggerService
  private _redisRepo?: RedisChatRepository
  private _initialized = false

  /**
   * Create a new chat container
   * @param socketIO - Socket.IO server instance
   * @param databaseFactory - Database factory for main database access
   * @param logger - Pino logger instance
   * @param redisRepo - Optional Redis repository for caching
   * @example
   * ```typescript
   * const container = new ChatContainer(
   *   socketIO,
   *   databaseFactory,
   *   logger,
   *   redisRepo // optional
   * )
   * ```
   */
  constructor(
    socketIO: SocketIOServer,
    databaseFactory: IDatabaseFactory,
    logger: ILoggerService,
    redisRepo?: RedisChatRepository
  ) {
    this._socketIO = socketIO
    this._databaseFactory = databaseFactory
    this._logger = logger.child({ service: 'ChatContainer' })
    this._redisRepo = redisRepo
    // Don't initialize services immediately - wait until first access
  }

  /**
   * Ensure services are initialized (lazy loading)
   */
  private ensureInitialized(): void {
    if (!this._initialized) {
      this.initializeServices()
      this._initialized = true
    }
  }

  /**
   * Initialize all services with proper dependency injection
   * Uses hybrid repository pattern with main database + optional Redis cache
   */
  private initializeServices(): void {
    this._logger.info('Initializing chat services...')

    try {
      // Infrastructure layer services
      this._chatRepository = new HybridChatRepository(
        this._databaseFactory,
        this._redisRepo,
        this._logger
      )

      this._chatEventService = new SocketIOChatEventService(this._socketIO)

      // Application layer service
      this._chatService = new ChatServiceOrchestrator(
        this._chatRepository,
        this._chatEventService
      )

      // Presentation layer controller
      this._chatController = new ChatController(this._chatService)

      this._logger.info(
        {
          useRedisCache: !!this._redisRepo,
          databaseType: this._databaseFactory.getDatabaseType()
        },
        'Chat services initialized successfully'
      )
    } catch (error) {
      this._logger.error({ error }, 'Failed to initialize chat services')
      throw error
    }
  }

  /**
   * Get chat repository instance
   * @returns IChatRepository instance (HybridChatRepository)
   * @example
   * ```typescript
   * const repository = container.getChatRepository()
   * const room = await repository.findRoomById('room-123')
   * ```
   */
  public getChatRepository(): IChatRepository {
    this.ensureInitialized()
    return this._chatRepository
  }

  /**
   * Get chat event service instance
   * @returns IChatEventService instance (SocketIOChatEventService)
   * @example
   * ```typescript
   * const eventService = container.getChatEventService()
   * await eventService.emitMessageReceived('room-123', message)
   * ```
   */
  public getChatEventService(): IChatEventService {
    this.ensureInitialized()
    return this._chatEventService
  }

  /**
   * Get chat service instance
   * @returns IChatService instance (ChatService)
   * @example
   * ```typescript
   * const chatService = container.getChatService()
   * const room = await chatService.createRoom({
   *   name: 'General Chat',
   *   type: 'public',
   *   createdBy: 'user123'
   * })
   * ```
   */
  public getChatService(): IChatService {
    this.ensureInitialized()
    return this._chatService
  }

  /**
   * Get chat controller instance
   * @returns ChatController instance
   * @example
   * ```typescript
   * const controller = container.getChatController()
   * // Use in Express routes
   * app.post('/api/chat/rooms', controller.createRoom)
   * ```
   */
  public getChatController(): ChatController {
    this.ensureInitialized()
    return this._chatController
  }

  /**
   * Get Socket.IO server instance
   * @returns SocketIOServer instance
   * @example
   * ```typescript
   * const io = container.getSocketIO()
   * io.emit('message', 'Hello World')
   * ```
   */
  public getSocketIO(): SocketIOServer {
    return this._socketIO
  }

  /**
   * Cleanup resources and connections
   * @example
   * ```typescript
   * await container.cleanup()
   * console.log('Chat container cleaned up')
   * ```
   */
  public async cleanup(): Promise<void> {
    this._logger.info('Starting chat container cleanup...')

    try {
      if (this._chatRepository && 'disconnect' in this._chatRepository) {
        await (this._chatRepository as any).disconnect()
      }

      if (this._redisRepo) {
        await this._redisRepo.disconnect()
      }

      this._logger.info('Chat container cleanup completed successfully')
    } catch (error) {
      this._logger.error({ error }, 'Error during chat container cleanup')
      throw error
    }
  }

  /**
   * Health check for all chat services
   * @returns Promise that resolves to health status
   * @example
   * ```typescript
   * const health = await container.healthCheck()
   * if (health.overall) {
   *   console.log('All chat services are healthy')
   * }
   * ```
   */
  public async healthCheck(): Promise<{
    repository: boolean
    eventService: boolean
    socketIO: boolean
    redis: boolean
    overall: boolean
    details: {
      databaseType: string
      useRedisCache: boolean
    }
  }> {
    this._logger.debug('Starting chat services health check...')

    const health = {
      repository: false,
      eventService: false,
      socketIO: false,
      redis: false,
      overall: false,
      details: {
        databaseType: this._databaseFactory.getDatabaseType(),
        useRedisCache: !!this._redisRepo
      }
    }

    try {
      // Test repository connection
      if (this._chatRepository) {
        await this._chatRepository.findRoomsByQuery({ limit: 1 })
        health.repository = true
        this._logger.debug('Repository health check passed')
      }
    } catch (error) {
      this._logger.warn({ error }, 'Repository health check failed')
    }

    try {
      // Test event service
      health.eventService = this._chatEventService !== undefined
      this._logger.debug('Event service health check passed')
    } catch (error) {
      this._logger.warn({ error }, 'Event service health check failed')
    }

    try {
      // Test Socket.IO
      health.socketIO = this._socketIO !== undefined
      this._logger.debug('Socket.IO health check passed')
    } catch (error) {
      this._logger.warn({ error }, 'Socket.IO health check failed')
    }

    try {
      // Test Redis if available
      if (this._redisRepo) {
        const stats = await (this._chatRepository as any).getCacheStats?.()
        health.redis = stats?.redisConnected || false
        this._logger.debug('Redis health check passed')
      } else {
        health.redis = true // No Redis, so it's "healthy"
      }
    } catch (error) {
      this._logger.warn({ error }, 'Redis health check failed')
    }

    health.overall =
      health.repository &&
      health.eventService &&
      health.socketIO &&
      health.redis

    this._logger.info({ health }, 'Chat services health check completed')
    return health
  }
}
