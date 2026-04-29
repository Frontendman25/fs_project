/**
 * Hybrid Chat Repository Implementation
 * Following Clean Architecture - Infrastructure layer
 * Uses main database as primary storage with Redis as optional cache
 *
 * This repository implements the Cache-Aside pattern:
 * 1. Read: Check Redis cache first, fallback to main database
 * 2. Write: Write to main database first, then update/invalidate cache
 * 3. Delete: Delete from main database, then invalidate cache
 *
 * @example
 * ```typescript
 * const repository = new HybridChatRepository(
 *   databaseFactory,
 *   redisRepository, // optional
 *   logger
 * )
 *
 * // Create a room (writes to main DB, optionally caches in Redis)
 * const room = await repository.createRoom({
 *   name: 'General Chat',
 *   type: 'public',
 *   createdBy: 'user123'
 * })
 *
 * // Get room (checks Redis cache first, falls back to main DB)
 * const foundRoom = await repository.findRoomById(room.id)
 * ```
 */

import { ILoggerService } from '@/domain/services/logger.service'
import { IDatabaseFactory } from '@/domain/repositories/database.factory'
import {
  IChatRepository,
  PaginatedResult
} from '@/domain/repositories/chat.repository'
import {
  ChatRoom,
  ChatMessage,
  ChatMember,
  ChatNotification,
  CreateChatRoomData,
  CreateChatMessageData,
  CreateChatMemberData,
  ChatMessageQuery,
  ChatRoomQuery
} from '@/domain/entities/chat.entity'

import { RedisChatRepository } from '@/infrastructure/repositories/redis/redis-chat.repository'
import { logger as defaultLogger } from '@/infrastructure/utils/logger'

/**
 * Configuration for hybrid repository
 */
interface HybridChatConfig {
  useRedisCache: boolean
  cacheTTL: {
    rooms: number
    messages: number
    members: number
    notifications: number
  }
  cacheKeys: {
    room: (id: string) => string
    message: (id: string) => string
    member: (roomId: string, userId: string) => string
    notification: (id: string) => string
    roomMessages: (roomId: string) => string
    roomMembers: (roomId: string) => string
    userRooms: (userId: string) => string
  }
}

export class HybridChatRepository implements IChatRepository {
  private logger: ILoggerService
  private chatRepository: IChatRepository
  private redisRepo?: RedisChatRepository
  private config: HybridChatConfig

  constructor(
    databaseFactory: IDatabaseFactory,
    redisRepo?: RedisChatRepository,
    logger?: ILoggerService
  ) {
    const actualLogger = logger || defaultLogger
    this.chatRepository = databaseFactory.getChatRepository()
    this.redisRepo = redisRepo
    this.logger = actualLogger.child({ service: 'HybridChatRepository' })

    this.config = {
      useRedisCache: !!redisRepo,
      cacheTTL: {
        rooms: 300, // 5 minutes
        messages: 60, // 1 minute
        members: 300, // 5 minutes
        notifications: 600 // 10 minutes
      },
      cacheKeys: {
        room: (id: string) => `chat:room:${id}`,
        message: (id: string) => `chat:message:${id}`,
        member: (roomId: string, userId: string) =>
          `chat:member:${roomId}:${userId}`,
        notification: (id: string) => `chat:notification:${id}`,
        roomMessages: (roomId: string) => `chat:room:${roomId}:messages`,
        roomMembers: (roomId: string) => `chat:room:${roomId}:members`,
        userRooms: (userId: string) => `chat:user:${userId}:rooms`
      }
    }

    this.logger.info(
      {
        useRedisCache: this.config.useRedisCache,
        cacheTTL: this.config.cacheTTL
      },
      'Hybrid chat repository initialized'
    )
  }

  /**
   * Create a new chat room
   * Writes to main database first, then optionally caches in Redis
   * @param roomData - Room creation data
   * @returns Created chat room
   * @example
   * ```typescript
   * const room = await repository.createRoom({
   *   name: 'General Chat',
   *   type: 'public',
   *   createdBy: 'user123'
   * })
   * console.log(`Created room: ${room.name}`)
   * ```
   */
  async createRoom(roomData: CreateChatRoomData): Promise<ChatRoom> {
    this.logger.info({ roomData }, 'Creating chat room (hybrid)')

    try {
      // 1. Write to main database first
      const room = await this.chatRepository.createRoom(roomData)

      // 2. Optionally cache in Redis
      if (this.config.useRedisCache && this.redisRepo) {
        try {
          await this.redisRepo.createRoom(roomData)
          this.logger.debug({ roomId: room.id }, 'Room cached in Redis')
        } catch (error) {
          this.logger.warn(
            { error, roomId: room.id },
            'Failed to cache room in Redis'
          )
          // Don't fail the operation if Redis caching fails
        }
      }

      this.logger.info(
        { roomId: room.id, roomName: room.name },
        'Chat room created successfully'
      )
      return room
    } catch (error) {
      this.logger.error({ error, roomData }, 'Failed to create chat room')
      throw error
    }
  }

  /**
   * Find a chat room by ID
   * Checks Redis cache first, falls back to main database
   * @param roomId - Room ID to search for
   * @returns Chat room or null if not found
   * @example
   * ```typescript
   * const room = await repository.findRoomById('room-123')
   * if (room) {
   *   console.log(`Found room: ${room.name}`)
   * }
   * ```
   */
  async findRoomById(roomId: string): Promise<ChatRoom | null> {
    this.logger.debug({ roomId }, 'Finding chat room by ID (hybrid)')

    try {
      // 1. Try Redis cache first
      if (this.config.useRedisCache && this.redisRepo) {
        try {
          const cachedRoom = await this.redisRepo.findRoomById(roomId)
          if (cachedRoom) {
            this.logger.debug({ roomId }, 'Room found in Redis cache')
            return cachedRoom
          }
        } catch (error) {
          this.logger.warn({ error, roomId }, 'Failed to read from Redis cache')
          // Continue to database fallback
        }
      }

      // 2. Fallback to main database
      const room = await this.chatRepository.findRoomById(roomId)

      // 3. Cache the result if found
      if (room && this.config.useRedisCache && this.redisRepo) {
        try {
          await this.redisRepo.createRoom({
            name: room.name,
            type: room.type,
            description: room.description,
            createdBy: room.createdBy
          })
          this.logger.debug(
            { roomId },
            'Room cached in Redis after database read'
          )
        } catch (error) {
          this.logger.warn({ error, roomId }, 'Failed to cache room in Redis')
        }
      }

      return room
    } catch (error) {
      this.logger.error({ error, roomId }, 'Failed to find chat room by ID')
      return null
    }
  }

  /**
   * Find rooms by query
   * Uses main database for complex queries, Redis for simple caching
   * @param query - Query parameters for filtering rooms
   * @returns Array of matching chat rooms
   * @example
   * ```typescript
   * const publicRooms = await repository.findRoomsByQuery({
   *   type: 'public',
   *   limit: 10
   * })
   * console.log(`Found ${publicRooms.length} public rooms`)
   * ```
   */
  async findRoomsByQuery(
    query: ChatRoomQuery
  ): Promise<PaginatedResult<ChatRoom>> {
    this.logger.debug({ query }, 'Finding rooms by query (hybrid)')

    try {
      const result = await this.chatRepository.findRoomsByQuery(query)

      this.logger.debug(
        {
          query,
          resultCount: result.items.length,
          hasMore: result.hasMore
        },
        'Rooms found by query'
      )

      return result
    } catch (error) {
      this.logger.error({ error, query }, 'Failed to find rooms by query')
      return { items: [], hasMore: false }
    }
  }

  /**
   * Update a chat room
   * Updates main database first, then invalidates Redis cache
   * @param roomId - Room ID to update
   * @param updates - Updates to apply
   * @returns Updated chat room or null if not found
   * @example
   * ```typescript
   * const updatedRoom = await repository.updateRoom('room-123', {
   *   name: 'Updated Room Name',
   *   description: 'New description'
   * })
   * ```
   */
  async updateRoom(
    roomId: string,
    updates: Partial<ChatRoom>
  ): Promise<ChatRoom | null> {
    this.logger.info({ roomId, updates }, 'Updating chat room (hybrid)')

    try {
      // 1. Update main database first
      const updatedRoom = await this.chatRepository.updateRoom(roomId, updates)

      if (updatedRoom) {
        // 2. Invalidate Redis cache
        if (this.config.useRedisCache && this.redisRepo) {
          try {
            // Delete from Redis cache to force refresh on next read
            await this.redisRepo.deleteRoom(roomId)
            this.logger.debug({ roomId }, 'Room cache invalidated in Redis')
          } catch (error) {
            this.logger.warn(
              { error, roomId },
              'Failed to invalidate Redis cache'
            )
          }
        }

        this.logger.info({ roomId }, 'Chat room updated successfully')
      }

      return updatedRoom
    } catch (error) {
      this.logger.error(
        { error, roomId, updates },
        'Failed to update chat room'
      )
      throw error
    }
  }

  /**
   * Delete a chat room
   * Deletes from main database first, then invalidates Redis cache
   * @param roomId - Room ID to delete
   * @returns True if deleted, false otherwise
   * @example
   * ```typescript
   * const deleted = await repository.deleteRoom('room-123')
   * if (deleted) {
   *   console.log('Room deleted successfully')
   * }
   * ```
   */
  async deleteRoom(roomId: string): Promise<boolean> {
    this.logger.info({ roomId }, 'Deleting chat room (hybrid)')

    try {
      // 1. Delete from main database first
      const deleted = await this.chatRepository.deleteRoom(roomId)

      if (deleted) {
        // 2. Invalidate Redis cache
        if (this.config.useRedisCache && this.redisRepo) {
          try {
            await this.redisRepo.deleteRoom(roomId)
            this.logger.debug({ roomId }, 'Room cache invalidated in Redis')
          } catch (error) {
            this.logger.warn(
              { error, roomId },
              'Failed to invalidate Redis cache'
            )
          }
        }

        this.logger.info({ roomId }, 'Chat room deleted successfully')
      }

      return deleted
    } catch (error) {
      this.logger.error({ error, roomId }, 'Failed to delete chat room')
      return false
    }
  }

  // Delegate other methods to database repository for now
  // In a full implementation, these would also use the hybrid pattern

  async createMessage(
    messageData: CreateChatMessageData
  ): Promise<ChatMessage> {
    this.logger.info({ messageData }, 'Creating chat message (hybrid)')
    return await this.chatRepository.createMessage(messageData)
  }

  async findMessageById(messageId: string): Promise<ChatMessage | null> {
    this.logger.debug({ messageId }, 'Finding message by ID (hybrid)')
    return await this.chatRepository.findMessageById(messageId)
  }

  async findMessagesByQuery(
    query: ChatMessageQuery
  ): Promise<PaginatedResult<ChatMessage>> {
    this.logger.debug({ query }, 'Finding messages by query (hybrid)')
    return await this.chatRepository.findMessagesByQuery(query)
  }

  async updateMessage(
    messageId: string,
    updates: Partial<ChatMessage>
  ): Promise<ChatMessage | null> {
    this.logger.info({ messageId, updates }, 'Updating chat message (hybrid)')
    return await this.chatRepository.updateMessage(messageId, updates)
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    this.logger.info({ messageId }, 'Deleting chat message (hybrid)')
    return await this.chatRepository.deleteMessage(messageId)
  }

  async addMember(memberData: CreateChatMemberData): Promise<ChatMember> {
    this.logger.info({ memberData }, 'Adding chat member (hybrid)')
    return await this.chatRepository.addMember(memberData)
  }

  async findMember(roomId: string, userId: string): Promise<ChatMember | null> {
    this.logger.debug({ roomId, userId }, 'Finding chat member (hybrid)')
    return await this.chatRepository.findMember(roomId, userId)
  }

  async findMembersByRoom(
    roomId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginatedResult<ChatMember>> {
    this.logger.debug(
      { roomId, limit, cursor },
      'Finding room members (hybrid)'
    )
    return await this.chatRepository.findMembersByRoom(roomId, limit, cursor)
  }

  async updateMember(
    roomId: string,
    userId: string,
    updates: Partial<ChatMember>
  ): Promise<ChatMember | null> {
    this.logger.info(
      { roomId, userId, updates },
      'Updating chat member (hybrid)'
    )
    return await this.chatRepository.updateMember(roomId, userId, updates)
  }

  async removeMember(roomId: string, userId: string): Promise<boolean> {
    this.logger.info({ roomId, userId }, 'Removing chat member (hybrid)')
    return await this.chatRepository.removeMember(roomId, userId)
  }

  async createNotification(
    notification: Omit<ChatNotification, 'id' | 'createdAt'>
  ): Promise<ChatNotification> {
    this.logger.info({ notification }, 'Creating chat notification (hybrid)')
    return await this.chatRepository.createNotification(notification)
  }

  async findNotificationsByUser(
    userId: string,
    limit = 50,
    cursor?: string
  ): Promise<PaginatedResult<ChatNotification>> {
    this.logger.debug(
      { userId, limit, cursor },
      'Finding user notifications (hybrid)'
    )
    return await this.chatRepository.findNotificationsByUser(
      userId,
      limit,
      cursor
    )
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    this.logger.info(
      { notificationId },
      'Marking notification as read (hybrid)'
    )
    return await this.chatRepository.markNotificationAsRead(notificationId)
  }

  async markAllNotificationsAsRead(
    userId: string,
    roomId?: string
  ): Promise<boolean> {
    this.logger.info(
      { userId, roomId },
      'Marking all notifications as read (hybrid)'
    )
    return await this.chatRepository.markAllNotificationsAsRead(userId, roomId)
  }

  async getRoomMemberCount(roomId: string): Promise<number> {
    this.logger.debug({ roomId }, 'Getting room member count (hybrid)')
    return await this.chatRepository.getRoomMemberCount(roomId)
  }

  async isUserMemberOfRoom(roomId: string, userId: string): Promise<boolean> {
    this.logger.debug(
      { roomId, userId },
      'Checking if user is member of room (hybrid)'
    )
    return await this.chatRepository.isUserMemberOfRoom(roomId, userId)
  }

  async getUserRooms(
    userId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginatedResult<ChatRoom>> {
    this.logger.debug({ userId, limit, cursor }, 'Getting user rooms (hybrid)')
    return await this.chatRepository.getUserRooms(userId, limit, cursor)
  }

  /**
   * Get cache statistics for monitoring
   * @returns Cache statistics
   * @example
   * ```typescript
   * const stats = await repository.getCacheStats()
   * console.log(`Cache hit rate: ${stats.hitRate}%`)
   * ```
   */
  async getCacheStats(): Promise<{
    useRedisCache: boolean
    cacheTTL: HybridChatConfig['cacheTTL']
    redisConnected: boolean
  }> {
    return {
      useRedisCache: this.config.useRedisCache,
      cacheTTL: this.config.cacheTTL,
      redisConnected: this.redisRepo ? true : false
    }
  }
}
