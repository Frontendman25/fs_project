/**
 * Redis Chat Repository Implementation
 * Following Clean Architecture - Infrastructure layer
 * Implements chat data persistence using Redis with JSON serialization
 *
 * Features:
 * - CRUD operations with TTL support
 * - Redis Pub/Sub for real-time events
 * - Atomic updates via MULTI/EXEC
 * - Parallel Redis reads with Promise.all
 * - Configurable TTL values
 * - Custom domain error handling
 * - Helper methods for serialization
 *
 * @example
 * ```typescript
 * const repository = new RedisChatRepository('redis://localhost:6379')
 * await repository.connect()
 *
 * // Create a room
 * const room = await repository.createRoom({
 *   name: 'General Chat',
 *   type: 'public',
 *   createdBy: 'user123'
 * })
 *
 * // Send a message
 * const message = await repository.createMessage({
 *   roomId: room.id,
 *   senderId: 'user123',
 *   senderUsername: 'john_doe',
 *   content: 'Hello everyone!'
 * })
 * ```
 */

import { createClient, type RedisClientType } from 'redis'
import { v4 as uuidv4 } from 'uuid'

import { IChatRepository, PaginatedResult } from '@/domain/repositories/chat.repository'
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
import {
  ChatRoomNotFoundError,
  ChatMessageNotFoundError,
  UserNotMemberError,
  RedisConnectionError
} from '@/domain/errors/chat.errors'

/**
 * Configuration interface for Redis repository
 */
interface RedisChatConfig {
  redisUrl?: string
  ttl: {
    rooms: number // TTL for rooms in seconds
    messages: number // TTL for messages in seconds
    members: number // TTL for members in seconds
    notifications: number // TTL for notifications in seconds
  }
  pubSubChannels: {
    newMessage: string
    roomUpdate: string
    userJoined: string
    userLeft: string
  }
}

export class RedisChatRepository implements IChatRepository {
  private client: RedisClientType
  private publisher: RedisClientType
  private subscriber: RedisClientType
  private isConnected = false
  private config: RedisChatConfig

  constructor(config?: Partial<RedisChatConfig>) {
    const defaultConfig: RedisChatConfig = {
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      ttl: {
        rooms: 86400 * 30, // 30 days
        messages: 86400 * 7, // 7 days
        members: 86400 * 30, // 30 days
        notifications: 86400 * 7 // 7 days
      },
      pubSubChannels: {
        newMessage: 'chat:new_message',
        roomUpdate: 'chat:room_update',
        userJoined: 'chat:user_joined',
        userLeft: 'chat:user_left'
      }
    }

    this.config = { ...defaultConfig, ...config }

    // Create separate clients for different operations
    this.client = createClient({ url: this.config.redisUrl })
    this.publisher = createClient({ url: this.config.redisUrl })
    this.subscriber = createClient({ url: this.config.redisUrl })

    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    const clients = [this.client, this.publisher, this.subscriber]

    clients.forEach((client, index) => {
      client.on('connect', () => {
        console.log(`🔗 Redis client ${index + 1} connected`)
        if (index === 0) this.isConnected = true
      })

      client.on('error', (error) => {
        console.error(`❌ Redis client ${index + 1} error:`, error)
        if (index === 0) this.isConnected = false
      })

      client.on('disconnect', () => {
        console.log(`🔌 Redis client ${index + 1} disconnected`)
        if (index === 0) this.isConnected = false
      })
    })
  }

  /**
   * Connect all Redis clients
   * @example
   * ```typescript
   * await repository.connect()
   * ```
   */
  async connect(): Promise<void> {
    try {
      await Promise.all([
        this.client.connect(),
        this.publisher.connect(),
        this.subscriber.connect()
      ])
      this.isConnected = true
    } catch (error) {
      throw new RedisConnectionError('connect')
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.connect()
    }
  }

  /**
   * Helper method to serialize data to JSON
   * @param data - Data to serialize
   * @returns JSON string
   * @example
   * ```typescript
   * const json = this.getJson({ id: '123', name: 'Test' })
   * ```
   */
  private getJson(data: any): string {
    return JSON.stringify(data)
  }

  /**
   * Helper method to deserialize JSON to typed object
   * @param json - JSON string to deserialize
   * @param type - Type to deserialize to
   * @returns Deserialized object
   * @example
   * ```typescript
   * const room = this.setJson<ChatRoom>(jsonData)
   * ```
   */
  private setJson<T>(json: string): T {
    return JSON.parse(json) as T
  }

  /**
   * Publish event to Redis Pub/Sub
   * @param channel - Channel to publish to
   * @param data - Data to publish
   * @example
   * ```typescript
   * await this.publishEvent('chat:new_message', { roomId: '123', message: 'Hello' })
   * ```
   */
  private async publishEvent(channel: string, data: any): Promise<void> {
    try {
      await this.publisher.publish(channel, this.getJson(data))
    } catch (error) {
      console.error(`Failed to publish to channel ${channel}:`, error)
    }
  }

  // Chat Room operations

  /**
   * Create a new chat room with atomic operations
   * @param roomData - Room creation data
   * @returns Created chat room
   * @example
   * ```typescript
   * const room = await repository.createRoom({
   *   name: 'General Chat',
   *   type: 'public',
   *   createdBy: 'user123'
   * })
   * ```
   */
  async createRoom(roomData: CreateChatRoomData): Promise<ChatRoom> {
    await this.ensureConnected()

    const room: ChatRoom = {
      id: uuidv4(),
      ...roomData,
      createdAt: new Date(),
      updatedAt: new Date(),
      memberCount: 0,
      isActive: true
    }

    // Use MULTI/EXEC for atomic operations
    const multi = this.client.multi()
    const key = `room:${room.id}`

    multi.setEx(key, this.config.ttl.rooms, this.getJson(room))
    multi.sAdd('rooms:index', room.id)
    multi.sAdd(`rooms:type:${room.type}`, room.id)

    const results = await multi.exec()

    if (
      !results ||
      results.some(
        (result) => result && Array.isArray(result) && result[0] !== null
      )
    ) {
      throw new RedisConnectionError('create_room')
    }

    // Publish room creation event
    await this.publishEvent(this.config.pubSubChannels.roomUpdate, {
      type: 'room_created',
      room
    })

    return room
  }

  /**
   * Find a chat room by its ID
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
    await this.ensureConnected()

    const key = `room:${roomId}`
    const data = await this.client.get(key)

    if (!data) {
      return null
    }

    const room = this.setJson<ChatRoom>(data)
    return {
      ...room,
      createdAt: new Date(room.createdAt),
      updatedAt: new Date(room.updatedAt)
    }
  }

  /**
   * Find rooms by query with parallel Redis reads
   * @param query - Query parameters for filtering rooms
   * @returns Array of matching chat rooms
   * @example
   * ```typescript
   * const publicRooms = await repository.findRoomsByQuery({
   *   type: 'public',
   *   limit: 10
   * })
   * ```
   */
  async findRoomsByQuery(query: ChatRoomQuery): Promise<PaginatedResult<ChatRoom>> {
    await this.ensureConnected()

    const limit = query.limit || 20
    const take = limit + 1

    // Use parallel reads for better performance
    const [allRoomIds, typeRoomIds] = await Promise.all([
      this.client.sMembers('rooms:index'),
      query.type
        ? this.client.sMembers(`rooms:type:${query.type}`)
        : Promise.resolve([])
    ])

    // Filter room IDs based on type if specified
    const roomIds = query.type ? typeRoomIds : allRoomIds

    // Parallel read of all rooms
    const roomPromises = roomIds.map((roomId) => this.findRoomById(roomId))
    const rooms = await Promise.all(roomPromises)

    // Filter and sort results
    let filteredRooms = rooms
      .filter(
        (room): room is ChatRoom =>
          room !== null && this.matchesRoomQuery(room, query)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // Apply cursor if specified
    if (query.cursor) {
      const cursorIndex = filteredRooms.findIndex(r => r.id === query.cursor)
      if (cursorIndex >= 0) {
        filteredRooms = filteredRooms.slice(cursorIndex + 1)
      }
    }

    const hasMore = filteredRooms.length > limit
    const resultItems = hasMore ? filteredRooms.slice(0, limit) : filteredRooms
    const nextCursor = hasMore && resultItems.length > 0
      ? resultItems[resultItems.length - 1].id
      : undefined

    return {
      items: resultItems,
      hasMore,
      nextCursor
    }
  }

  private matchesRoomQuery(room: ChatRoom, query: ChatRoomQuery): boolean {
    if (query.type && room.type !== query.type) return false
    if (query.userId && !this.isUserMemberOfRoom(room.id, query.userId))
      return false
    return true
  }

  async updateRoom(
    roomId: string,
    updates: Partial<ChatRoom>
  ): Promise<ChatRoom | null> {
    await this.ensureConnected()

    const room = await this.findRoomById(roomId)
    if (!room) {
      throw new ChatRoomNotFoundError(roomId)
    }

    const updatedRoom = {
      ...room,
      ...updates,
      updatedAt: new Date()
    }

    const key = `room:${roomId}`
    await this.client.setEx(key, 86400 * 30, JSON.stringify(updatedRoom))

    return updatedRoom
  }

  async deleteRoom(roomId: string): Promise<boolean> {
    await this.ensureConnected()

    const key = `room:${roomId}`
    const result = await this.client.del(key)

    // Remove from rooms index
    await this.client.sRem('rooms:index', roomId)

    // Delete all related data
    await this.client.del(`room:${roomId}:members`)
    await this.client.del(`room:${roomId}:messages`)

    return result > 0
  }

  // Chat Message operations

  /**
   * Create a new message with atomic operations and Pub/Sub notification
   * @param messageData - Message creation data
   * @returns Created chat message
   * @example
   * ```typescript
   * const message = await repository.createMessage({
   *   roomId: 'room-123',
   *   senderId: 'user-456',
   *   senderUsername: 'john_doe',
   *   content: 'Hello everyone!'
   * })
   * ```
   */
  async createMessage(
    messageData: CreateChatMessageData
  ): Promise<ChatMessage> {
    await this.ensureConnected()

    const message: ChatMessage = {
      id: uuidv4(),
      ...messageData,
      messageType: messageData.messageType || 'text',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Use MULTI/EXEC for atomic operations
    const multi = this.client.multi()
    const key = `message:${message.id}`

    multi.setEx(key, this.config.ttl.messages, this.getJson(message))
    multi.lPush(`room:${message.roomId}:messages`, message.id)
    multi.lTrim(`room:${message.roomId}:messages`, 0, 999) // Keep last 1000 messages

    const results = await multi.exec()

    if (
      !results ||
      results.some(
        (result) => result && Array.isArray(result) && result[0] !== null
      )
    ) {
      throw new RedisConnectionError('create_message')
    }

    // Publish new message event for real-time updates
    await this.publishEvent(this.config.pubSubChannels.newMessage, {
      type: 'new_message',
      roomId: message.roomId,
      message
    })

    return message
  }

  async findMessageById(messageId: string): Promise<ChatMessage | null> {
    await this.ensureConnected()

    const key = `message:${messageId}`
    const data = await this.client.get(key)

    if (!data) {
      return null
    }

    const message = JSON.parse(data) as ChatMessage
    return {
      ...message,
      createdAt: new Date(message.createdAt),
      updatedAt: new Date(message.updatedAt),
      editedAt: message.editedAt ? new Date(message.editedAt) : undefined,
      deletedAt: message.deletedAt ? new Date(message.deletedAt) : undefined
    }
  }

  async findMessagesByQuery(query: ChatMessageQuery): Promise<PaginatedResult<ChatMessage>> {
    await this.ensureConnected()

    const limit = query.limit || 50
    const take = limit + 1

    const messageIds = await this.client.lRange(
      `room:${query.roomId}:messages`,
      0,
      -1
    )
    const messages: ChatMessage[] = []

    for (const messageId of messageIds) {
      const message = await this.findMessageById(messageId)
      if (message && this.matchesMessageQuery(message, query)) {
        messages.push(message)
      }
    }

    let sortedMessages = messages.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )

    if (query.cursor) {
      const cursorIndex = sortedMessages.findIndex(m => m.id === query.cursor)
      if (cursorIndex >= 0) {
        sortedMessages = sortedMessages.slice(cursorIndex + 1)
      }
    }

    const hasMore = sortedMessages.length > limit
    const resultItems = hasMore ? sortedMessages.slice(0, limit) : sortedMessages
    const nextCursor = hasMore && resultItems.length > 0
      ? resultItems[resultItems.length - 1].id
      : undefined

    return {
      items: resultItems,
      hasMore,
      nextCursor
    }
  }

  private matchesMessageQuery(
    message: ChatMessage,
    query: ChatMessageQuery
  ): boolean {
    if (query.before && message.createdAt >= query.before) return false
    if (query.after && message.createdAt <= query.after) return false
    return true
  }

  async updateMessage(
    messageId: string,
    updates: Partial<ChatMessage>
  ): Promise<ChatMessage | null> {
    await this.ensureConnected()

    const message = await this.findMessageById(messageId)
    if (!message) {
      throw new ChatMessageNotFoundError(messageId)
    }

    const updatedMessage = {
      ...message,
      ...updates,
      updatedAt: new Date()
    }

    const key = `message:${messageId}`
    await this.client.setEx(key, 86400 * 30, JSON.stringify(updatedMessage))

    return updatedMessage
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    await this.ensureConnected()

    const key = `message:${messageId}`
    const result = await this.client.del(key)

    return result > 0
  }

  // Chat Member operations
  async addMember(memberData: CreateChatMemberData): Promise<ChatMember> {
    await this.ensureConnected()

    const member: ChatMember = {
      id: uuidv4(),
      ...memberData,
      role: memberData.role || 'member',
      joinedAt: new Date(),
      isOnline: false,
      isTyping: false
    }

    const key = `member:${member.roomId}:${member.userId}`
    await this.client.setEx(key, 86400 * 30, JSON.stringify(member))

    // Add to room members set
    await this.client.sAdd(`room:${member.roomId}:members`, member.userId)

    // Update room member count
    const memberCount = await this.client.sCard(`room:${member.roomId}:members`)
    await this.updateRoom(member.roomId, { memberCount })

    return member
  }

  async findMember(roomId: string, userId: string): Promise<ChatMember | null> {
    await this.ensureConnected()

    const key = `member:${roomId}:${userId}`
    const data = await this.client.get(key)

    if (!data) {
      return null
    }

    const member = JSON.parse(data) as ChatMember
    return {
      ...member,
      joinedAt: new Date(member.joinedAt),
      lastSeenAt: member.lastSeenAt ? new Date(member.lastSeenAt) : undefined,
      typingUntil: member.typingUntil ? new Date(member.typingUntil) : undefined
    }
  }

  async findMembersByRoom(
    roomId: string,
    limit = 100,
    cursor?: string
  ): Promise<PaginatedResult<ChatMember>> {
    await this.ensureConnected()

    const take = limit + 1

    const userIds = await this.client.sMembers(`room:${roomId}:members`)
    const members: ChatMember[] = []

    for (const userId of userIds) {
      const member = await this.findMember(roomId, userId)
      if (member) {
        members.push(member)
      }
    }

    let sortedMembers = members.sort(
      (a, b) => b.joinedAt.getTime() - a.joinedAt.getTime()
    )

    if (cursor) {
      const cursorIndex = sortedMembers.findIndex(m => m.id === cursor)
      if (cursorIndex >= 0) {
        sortedMembers = sortedMembers.slice(cursorIndex + 1)
      }
    }

    const hasMore = sortedMembers.length > limit
    const resultItems = hasMore ? sortedMembers.slice(0, limit) : sortedMembers
    const nextCursor = hasMore && resultItems.length > 0
      ? resultItems[resultItems.length - 1].id
      : undefined

    return {
      items: resultItems,
      hasMore,
      nextCursor
    }
  }

  async updateMember(
    roomId: string,
    userId: string,
    updates: Partial<ChatMember>
  ): Promise<ChatMember | null> {
    await this.ensureConnected()

    const member = await this.findMember(roomId, userId)
    if (!member) {
      return null
    }

    const updatedMember = {
      ...member,
      ...updates
    }

    const key = `member:${roomId}:${userId}`
    await this.client.setEx(key, 86400 * 30, JSON.stringify(updatedMember))

    return updatedMember
  }

  async removeMember(roomId: string, userId: string): Promise<boolean> {
    await this.ensureConnected()

    const key = `member:${roomId}:${userId}`
    const result = await this.client.del(key)

    // Remove from room members set
    await this.client.sRem(`room:${roomId}:members`, userId)

    // Update room member count
    const memberCount = await this.client.sCard(`room:${roomId}:members`)
    await this.updateRoom(roomId, { memberCount })

    return result > 0
  }

  // Chat Notification operations
  async createNotification(
    notification: Omit<ChatNotification, 'id' | 'createdAt'>
  ): Promise<ChatNotification> {
    await this.ensureConnected()

    const newNotification: ChatNotification = {
      id: uuidv4(),
      ...notification,
      createdAt: new Date()
    }

    const key = `notification:${newNotification.id}`
    await this.client.setEx(key, 86400 * 7, JSON.stringify(newNotification)) // 7 days TTL

    // Add to user notifications list
    await this.client.lPush(
      `user:${newNotification.userId}:notifications`,
      newNotification.id
    )

    return newNotification
  }

  async findNotificationsByUser(
    userId: string,
    limit = 50,
    cursor?: string
  ): Promise<PaginatedResult<ChatNotification>> {
    await this.ensureConnected()

    const take = limit + 1

    const notificationIds = await this.client.lRange(
      `user:${userId}:notifications`,
      0,
      -1
    )
    const notifications: ChatNotification[] = []

    for (const notificationId of notificationIds) {
      const key = `notification:${notificationId}`
      const data = await this.client.get(key)

      if (data) {
        const notification = JSON.parse(data) as ChatNotification
        notifications.push({
          ...notification,
          createdAt: new Date(notification.createdAt)
        })
      }
    }

    let sortedNotifications = notifications.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )

    if (cursor) {
      const cursorIndex = sortedNotifications.findIndex(n => n.id === cursor)
      if (cursorIndex >= 0) {
        sortedNotifications = sortedNotifications.slice(cursorIndex + 1)
      }
    }

    const hasMore = sortedNotifications.length > limit
    const resultItems = hasMore ? sortedNotifications.slice(0, limit) : sortedNotifications
    const nextCursor = hasMore && resultItems.length > 0
      ? resultItems[resultItems.length - 1].id
      : undefined

    return {
      items: resultItems,
      hasMore,
      nextCursor
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    await this.ensureConnected()

    const key = `notification:${notificationId}`
    const data = await this.client.get(key)

    if (!data) {
      return false
    }

    const notification = JSON.parse(data) as ChatNotification
    notification.isRead = true

    await this.client.setEx(key, 86400 * 7, JSON.stringify(notification))

    return true
  }

  async markAllNotificationsAsRead(
    userId: string,
    roomId?: string
  ): Promise<boolean> {
    await this.ensureConnected()

    const page = await this.findNotificationsByUser(userId)
    const notifications = page.items

    for (const notification of notifications) {
      if (!roomId || notification.roomId === roomId) {
        await this.markNotificationAsRead(notification.id)
      }
    }

    return true
  }

  // Utility operations
  async getRoomMemberCount(roomId: string): Promise<number> {
    await this.ensureConnected()

    return await this.client.sCard(`room:${roomId}:members`)
  }

  async isUserMemberOfRoom(roomId: string, userId: string): Promise<boolean> {
    await this.ensureConnected()

    const result = await this.client.sIsMember(`room:${roomId}:members`, userId)
    return Boolean(result)
  }

  async getUserRooms(
    userId: string,
    limit = 50,
    cursor?: string
  ): Promise<PaginatedResult<ChatRoom>> {
    await this.ensureConnected()

    const take = limit + 1

    const roomIds = await this.client.sMembers('rooms:index')
    const userRooms: ChatRoom[] = []

    for (const roomId of roomIds) {
      const isMember = await this.isUserMemberOfRoom(roomId, userId)
      if (isMember) {
        const room = await this.findRoomById(roomId)
        if (room) {
          userRooms.push(room)
        }
      }
    }

    let sortedRooms = userRooms.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )

    if (cursor) {
      const cursorIndex = sortedRooms.findIndex(r => r.id === cursor)
      if (cursorIndex >= 0) {
        sortedRooms = sortedRooms.slice(cursorIndex + 1)
      }
    }

    const hasMore = sortedRooms.length > limit
    const resultItems = hasMore ? sortedRooms.slice(0, limit) : sortedRooms
    const nextCursor = hasMore && resultItems.length > 0
      ? resultItems[resultItems.length - 1].id
      : undefined

    return {
      items: resultItems,
      hasMore,
      nextCursor
    }
  }

  /**
   * Disconnect all Redis clients
   * @example
   * ```typescript
   * await repository.disconnect()
   * ```
   */
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await Promise.all([
        this.client.disconnect(),
        this.publisher.disconnect(),
        this.subscriber.disconnect()
      ])
      this.isConnected = false
    }
  }

  /**
   * Subscribe to Redis Pub/Sub channels for real-time events
   * This method can be used by WebSocket gateways to listen for chat events
   * @param onMessage - Callback function for handling messages
   * @example
   * ```typescript
   * await repository.subscribeToEvents((channel, message) => {
   *   // Handle real-time events
   *   if (channel === 'chat:new_message') {
   *     socketIO.to(`room:${message.roomId}`).emit('message_received', message.message)
   *   }
   * })
   * ```
   */
  async subscribeToEvents(
    onMessage: (channel: string, message: any) => void
  ): Promise<void> {
    await this.ensureConnected()

    const channels = Object.values(this.config.pubSubChannels)

    await this.subscriber.subscribe(channels, (message, channel) => {
      try {
        const data = this.setJson(message)
        onMessage(channel, data)
      } catch (error) {
        console.error(
          `Error processing message from channel ${channel}:`,
          error
        )
      }
    })
  }
}

/**
 * EXTENSION EXAMPLES - Event-Driven Architecture
 *
 * 1. Redis Streams for Event Sourcing:
 * ```typescript
 * // Add to RedisChatRepository
 * async appendToStream(streamName: string, event: any): Promise<void> {
 *   await this.client.xAdd(streamName, '*', event)
 * }
 *
 * async readStream(streamName: string, fromId: string = '0'): Promise<any[]> {
 *   const messages = await this.client.xRead({ key: streamName, id: fromId })
 *   return messages[0]?.messages || []
 * }
 * ```
 *
 * 2. Persistence Sync with MongoDB/PostgreSQL:
 * ```typescript
 * // Create a sync service that listens to Redis events
 * class ChatPersistenceSync {
 *   constructor(
 *     private redisRepo: RedisChatRepository,
 *     private mongoRepo: MongoChatRepository
 *   ) {}
 *
 *   async startSync(): Promise<void> {
 *     await this.redisRepo.subscribeToEvents(async (channel, data) => {
 *       switch (data.type) {
 *         case 'new_message':
 *           await this.mongoRepo.createMessage(data.message)
 *           break
 *         case 'room_created':
 *           await this.mongoRepo.createRoom(data.room)
 *           break
 *       }
 *     })
 *   }
 * }
 * ```
 *
 * 3. CQRS Pattern with Redis:
 * ```typescript
 * // Command side (writes to Redis)
 * class ChatCommandHandler {
 *   async handleSendMessage(command: SendMessageCommand): Promise<void> {
 *     await this.redisRepo.createMessage(command.messageData)
 *   }
 * }
 *
 * // Query side (reads from optimized views)
 * class ChatQueryHandler {
 *   async getRecentMessages(roomId: string): Promise<ChatMessage[]> {
 *     // Read from optimized Redis data structures
 *     return await this.redisRepo.findMessagesByQuery({ roomId, limit: 50 })
 *   }
 * }
 * ```
 *
 * 4. Microservices Integration:
 * ```typescript
 * // User service integration
 * class ChatUserIntegration {
 *   async onUserJoined(userId: string): Promise<void> {
 *     // Auto-join user to default rooms
 *     const defaultRooms = await this.redisRepo.findRoomsByQuery({ type: 'public' })
 *     for (const room of defaultRooms) {
 *       await this.redisRepo.addMember({
 *         roomId: room.id,
 *         userId,
 *         username: await this.getUsername(userId)
 *       })
 *     }
 *   }
 * }
 * ```
 */
