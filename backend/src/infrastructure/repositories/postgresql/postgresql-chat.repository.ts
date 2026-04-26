/**
 * PostgreSQL Chat Repository Implementation
 * Following Clean Architecture - Infrastructure layer
 * Implements chat data persistence using Prisma ORM
 */

import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

import { ILoggerService } from '@/domain/services/logger.service'
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
import { ChatRoomNotFoundError } from '@/domain/errors/chat.errors'

/**
 * PostgreSQL Chat Repository
 * 
 * Implements chat data persistence for PostgreSQL database using Prisma ORM.
 * 
 * Design Patterns:
 * - Repository Pattern: Abstracts data access logic
 * - Dependency Injection: Receives PrismaClient and ILoggerService via constructor
 * 
 * @example
 * ```typescript
 * const repository = new PostgreSQLChatRepository(prisma, logger)
 * 
 * // Create a room
 * const room = await repository.createRoom({
 *   name: 'General Chat',
 *   type: 'public',
 *   createdBy: 'user123'
 * })
 * 
 * // Find room by ID
 * const foundRoom = await repository.findRoomById(room.id)
 * ```
 */
export class PostgreSQLChatRepository implements IChatRepository {
  private logger: ILoggerService

  constructor(
    private prisma: PrismaClient,
    logger: ILoggerService
  ) {
    this.logger = logger.child({ service: 'PostgreSQLChatRepository' })
  }

  /**
   * Creates a new chat room
   * 
   * @param roomData - Data for creating the room
   * @returns Promise resolving to the created ChatRoom
   * @throws Error if creation fails
   * 
   * @example
   * ```typescript
   * const room = await repository.createRoom({
   *   name: 'Team Discussion',
   *   type: 'private',
   *   description: 'Internal team chat',
   *   createdBy: 'user-123'
   * })
   * console.log(room.id) // Generated UUID
   * ```
   */
  async createRoom(roomData: CreateChatRoomData): Promise<ChatRoom> {
    this.logger.info({ roomData }, 'Creating new chat room')

    try {
      const room = await this.prisma.chatRoom.create({
        data: {
          id: uuidv4(),
          name: roomData.name,
          type: roomData.type,
          description: roomData.description,
          createdBy: roomData.createdBy,
          memberCount: 0,
          isActive: true
        }
      })

      const result: ChatRoom = {
        id: room.id,
        name: room.name,
        type: room.type as 'public' | 'private',
        description: room.description || undefined,
        createdBy: room.createdBy,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        memberCount: room.memberCount,
        isActive: room.isActive
      }

      this.logger.info(
        { roomId: result.id, roomName: result.name },
        'Chat room created successfully'
      )
      return result
    } catch (error) {
      this.logger.error({ error, roomData }, 'Failed to create chat room')
      throw error
    }
  }

  /**
   * Finds a chat room by its unique identifier
   * 
   * @param roomId - UUID of the room to find
   * @returns Promise resolving to ChatRoom or null if not found
   * 
   * @example
   * ```typescript
   * const room = await repository.findRoomById('550e8400-e29b-41d4-a716-446655440000')
   * if (room) {
   *   console.log(`Found room: ${room.name}`)
   * }
   * ```
   */
  async findRoomById(roomId: string): Promise<ChatRoom | null> {
    this.logger.debug({ roomId }, 'Finding chat room by ID')

    try {
      const room = await this.prisma.chatRoom.findUnique({
        where: { id: roomId }
      })

      if (!room) {
        return null
      }

      return {
        id: room.id,
        name: room.name,
        type: room.type as 'public' | 'private',
        description: room.description || undefined,
        createdBy: room.createdBy,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        memberCount: room.memberCount,
        isActive: room.isActive
      }
    } catch (error) {
      this.logger.error({ error, roomId }, 'Failed to find chat room by ID')
      return null
    }
  }

  /**
   * Finds rooms matching the provided query criteria with pagination support
   * 
   * @param query - Query parameters for filtering and pagination
   * @returns Promise resolving to array of ChatRoom objects
   * 
   * @example
   * ```typescript
   * // Find public rooms
   * const publicRooms = await repository.findRoomsByQuery({
   *   type: 'public',
   *   limit: 10
   * })
   * 
   * // Find rooms for specific user with cursor pagination
   * const userRooms = await repository.findRoomsByQuery({
   *   userId: 'user-123',
   *   limit: 20,
   *   cursor: 'last-room-id'
   * })
   * ```
   */
  async findRoomsByQuery(query: ChatRoomQuery): Promise<PaginatedResult<ChatRoom>> {
    this.logger.debug({ query }, 'Finding rooms by query')

    try {
      const limit = query.limit || 20
      const take = limit + 1

      const where: {
        type?: 'public' | 'private'
        members?: { some: { userId: string } }
        id?: { not?: string }
        createdAt?: { lt?: Date }
      } = {}

      if (query.type) {
        where.type = query.type
      }

      if (query.userId) {
        where.members = {
          some: {
            userId: query.userId
          }
        }
      }

      if (query.cursor) {
        const cursorRoom = await this.prisma.chatRoom.findUnique({
          where: { id: query.cursor },
          select: { createdAt: true }
        })
        if (cursorRoom) {
          where.createdAt = { lt: cursorRoom.createdAt }
        }
      }

      const rooms = await this.prisma.chatRoom.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          id: true,
          name: true,
          type: true,
          description: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          memberCount: true,
          isActive: true
        }
      })

      const hasMore = rooms.length > limit
      const resultItems = hasMore ? rooms.slice(0, limit) : rooms
      const nextCursor = hasMore && resultItems.length > 0
        ? resultItems[resultItems.length - 1].id
        : undefined

      return {
        items: resultItems.map((room) => ({
          id: room.id,
          name: room.name,
          type: room.type as 'public' | 'private',
          description: room.description || undefined,
          createdBy: room.createdBy,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
          memberCount: room.memberCount,
          isActive: room.isActive
        })),
        hasMore,
        nextCursor
      }
    } catch (error) {
      this.logger.error({ error, query }, 'Failed to find rooms by query')
      return { items: [], hasMore: false }
    }
  }

  /**
   * Updates an existing chat room with partial data
   * 
   * @param roomId - UUID of the room to update
   * @param updates - Partial ChatRoom data to update
   * @returns Promise resolving to updated ChatRoom or null if not found
   * @throws ChatRoomNotFoundError if room doesn't exist
   * 
   * @example
   * ```typescript
   * const updated = await repository.updateRoom('room-id', {
   *   name: 'New Room Name',
   *   description: 'Updated description'
   * })
   * ```
   */
  async updateRoom(
    roomId: string,
    updates: Partial<ChatRoom>
  ): Promise<ChatRoom | null> {
    this.logger.info({ roomId, updates }, 'Updating chat room')

    try {
      const updatedRoom = await this.prisma.chatRoom.update({
        where: { id: roomId },
        data: {
          ...(updates.name && { name: updates.name }),
          ...(updates.type && { type: updates.type }),
          ...(updates.description !== undefined && {
            description: updates.description
          }),
          ...(updates.isActive !== undefined && { isActive: updates.isActive }),
          ...(updates.memberCount !== undefined && {
            memberCount: updates.memberCount
          }),
          updatedAt: new Date()
        }
      })

      return {
        id: updatedRoom.id,
        name: updatedRoom.name,
        type: updatedRoom.type as 'public' | 'private',
        description: updatedRoom.description || undefined,
        createdBy: updatedRoom.createdBy,
        createdAt: updatedRoom.createdAt,
        updatedAt: updatedRoom.updatedAt,
        memberCount: updatedRoom.memberCount,
        isActive: updatedRoom.isActive
      }
    } catch (error: any) {
      if (error.code === 'P2025') {
        // Record not found
        throw new ChatRoomNotFoundError(roomId)
      }
      this.logger.error(
        { error, roomId, updates },
        'Failed to update chat room'
      )
      throw error
    }
  }

  /**
   * Deletes a chat room and all associated data
   * 
   * @param roomId - UUID of the room to delete
   * @returns Promise resolving to true if deleted, false otherwise
   * 
   * @example
   * ```typescript
   * const deleted = await repository.deleteRoom('room-id')
   * if (deleted) {
   *   console.log('Room deleted successfully')
   * }
   * ```
   */
  async deleteRoom(roomId: string): Promise<boolean> {
    this.logger.info({ roomId }, 'Deleting chat room')

    try {
      await this.prisma.chatRoom.delete({
        where: { id: roomId }
      })

      this.logger.info({ roomId }, 'Chat room deleted successfully')
      return true
    } catch (error: any) {
      if (error.code === 'P2025') {
        // Record not found
        return false
      }
      this.logger.error({ error, roomId }, 'Failed to delete chat room')
      return false
    }
  }

  /**
   * Creates a new chat message in a room
   * 
   * @param messageData - Data for creating the message
   * @returns Promise resolving to the created ChatMessage
   * @throws Error if creation fails
   * 
   * @example
   * ```typescript
   * const message = await repository.createMessage({
   *   roomId: 'room-123',
   *   senderId: 'user-456',
   *   senderUsername: 'john_doe',
   *   content: 'Hello, world!',
   *   messageType: 'text'
   * })
   * ```
   */
  async createMessage(
    messageData: CreateChatMessageData
  ): Promise<ChatMessage> {
    this.logger.info({ messageData }, 'Creating chat message')

    try {
      const message = await this.prisma.chatMessage.create({
        data: {
          id: uuidv4(),
          roomId: messageData.roomId,
          senderId: messageData.senderId,
          senderUsername: messageData.senderUsername,
          content: messageData.content,
          messageType: messageData.messageType || 'text',
          metadata: messageData.metadata ? (messageData.metadata as any) : undefined,
          replyTo: messageData.replyTo || undefined
        }
      })

      const result: ChatMessage = {
        id: message.id,
        roomId: message.roomId,
        senderId: message.senderId,
        senderUsername: message.senderUsername,
        content: message.content,
        messageType: message.messageType as
          | 'text'
          | 'image'
          | 'file'
          | 'system',
        metadata: message.metadata as ChatMessage['metadata'] || undefined,
        replyTo: message.replyTo || undefined,
        editedAt: message.editedAt || undefined,
        deletedAt: message.deletedAt || undefined,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt
      }

      this.logger.info({ messageId: result.id }, 'Message created successfully')
      return result
    } catch (error) {
      this.logger.error({ error, messageData }, 'Failed to create message')
      throw error
    }
  }

  /**
   * Finds a message by its unique identifier
   * 
   * @param messageId - UUID of the message to find
   * @returns Promise resolving to ChatMessage or null if not found
   * 
   * @example
   * ```typescript
   * const message = await repository.findMessageById('msg-123')
   * if (message) {
   *   console.log(message.content)
   * }
   * ```
   */
  async findMessageById(messageId: string): Promise<ChatMessage | null> {
    this.logger.debug({ messageId }, 'Finding message by ID')

    try {
      const message = await this.prisma.chatMessage.findUnique({
        where: { id: messageId }
      })

      if (!message) {
        return null
      }

      return {
        id: message.id,
        roomId: message.roomId,
        senderId: message.senderId,
        senderUsername: message.senderUsername,
        content: message.content,
        messageType: message.messageType as 'text' | 'image' | 'file' | 'system',
        metadata: message.metadata as ChatMessage['metadata'] || undefined,
        replyTo: message.replyTo || undefined,
        editedAt: message.editedAt || undefined,
        deletedAt: message.deletedAt || undefined,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt
      }
    } catch (error) {
      this.logger.error({ error, messageId }, 'Failed to find message')
      return null
    }
  }

  /**
   * Finds messages matching the provided query criteria
   * 
   * @param query - Query parameters for filtering messages
   * @returns Promise resolving to array of ChatMessage objects
   * 
   * @example
   * ```typescript
   * // Get recent messages from a room
   * const messages = await repository.findMessagesByQuery({
   *   roomId: 'room-123',
   *   limit: 50
   * })
   * 
   * // Get messages with cursor pagination
   * const nextMessages = await repository.findMessagesByQuery({
   *   roomId: 'room-123',
   *   cursor: 'last-message-id',
   *   limit: 20
   * })
   * ```
   */
  async findMessagesByQuery(query: ChatMessageQuery): Promise<PaginatedResult<ChatMessage>> {
    this.logger.debug({ query }, 'Finding messages by query')

    try {
      const limit = query.limit || 50
      const take = limit + 1

      const where: {
        roomId: string
        deletedAt: null
        createdAt?: { lt?: Date; gt?: Date }
      } = {
        roomId: query.roomId,
        deletedAt: null
      }

      if (query.before) {
        where.createdAt = { ...where.createdAt, lt: query.before }
      }
      if (query.after) {
        where.createdAt = { ...where.createdAt, gt: query.after }
      }

      if (query.cursor) {
        const cursorMessage = await this.prisma.chatMessage.findUnique({
          where: { id: query.cursor },
          select: { createdAt: true }
        })
        if (cursorMessage) {
          where.createdAt = { ...where.createdAt, lt: cursorMessage.createdAt }
        }
      }

      const messages = await this.prisma.chatMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          id: true,
          roomId: true,
          senderId: true,
          senderUsername: true,
          content: true,
          messageType: true,
          metadata: true,
          replyTo: true,
          editedAt: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true
        }
      })

      const hasMore = messages.length > limit
      const resultItems = hasMore ? messages.slice(0, limit) : messages
      const nextCursor = hasMore && resultItems.length > 0
        ? resultItems[resultItems.length - 1].id
        : undefined

      return {
        items: resultItems.map((message) => ({
          id: message.id,
          roomId: message.roomId,
          senderId: message.senderId,
          senderUsername: message.senderUsername,
          content: message.content,
          messageType: message.messageType as 'text' | 'image' | 'file' | 'system',
          metadata: message.metadata as ChatMessage['metadata'] || undefined,
          replyTo: message.replyTo || undefined,
          editedAt: message.editedAt || undefined,
          deletedAt: message.deletedAt || undefined,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt
        })),
        hasMore,
        nextCursor
      }
    } catch (error) {
      this.logger.error({ error, query }, 'Failed to find messages')
      return { items: [], hasMore: false }
    }
  }

  /**
   * Updates an existing chat message
   * 
   * @param messageId - UUID of the message to update
   * @param updates - Partial ChatMessage data to update
   * @returns Promise resolving to updated ChatMessage or null if not found
   * 
   * @example
   * ```typescript
   * const updated = await repository.updateMessage('msg-123', {
   *   content: 'Updated content'
   * })
   * ```
   */
  async updateMessage(
    messageId: string,
    updates: Partial<ChatMessage>
  ): Promise<ChatMessage | null> {
    this.logger.info({ messageId, updates }, 'Updating chat message')

    try {
      const updatedMessage = await this.prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          ...(updates.content && { content: updates.content }),
          ...(updates.messageType && { messageType: updates.messageType }),
          ...(updates.metadata !== undefined && { metadata: updates.metadata }),
          editedAt: new Date(),
          updatedAt: new Date()
        }
      })

      return {
        id: updatedMessage.id,
        roomId: updatedMessage.roomId,
        senderId: updatedMessage.senderId,
        senderUsername: updatedMessage.senderUsername,
        content: updatedMessage.content,
        messageType: updatedMessage.messageType as
          | 'text'
          | 'image'
          | 'file'
          | 'system',
        metadata: updatedMessage.metadata as ChatMessage['metadata'] || undefined,
        replyTo: updatedMessage.replyTo || undefined,
        editedAt: updatedMessage.editedAt || undefined,
        deletedAt: updatedMessage.deletedAt || undefined,
        createdAt: updatedMessage.createdAt,
        updatedAt: updatedMessage.updatedAt
      }
    } catch (error: any) {
      if (error.code === 'P2025') {
        // Record not found
        return null
      }
      this.logger.error({ error, messageId }, 'Failed to update message')
      return null
    }
  }

  /**
   * Deletes a chat message (soft delete)
   * 
   * @param messageId - UUID of the message to delete
   * @returns Promise resolving to true if deleted, false otherwise
   * 
   * @example
   * ```typescript
   * const deleted = await repository.deleteMessage('msg-123')
   * ```
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    this.logger.info({ messageId }, 'Deleting chat message')

    try {
      await this.prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          deletedAt: new Date(),
          content: '[Deleted]',
          updatedAt: new Date()
        }
      })

      this.logger.info({ messageId }, 'Message deleted successfully')
      return true
    } catch (error: any) {
      if (error.code === 'P2025') {
        // Record not found
        return false
      }
      this.logger.error({ error, messageId }, 'Failed to delete message')
      return false
    }
  }

  /**
   * Adds a member to a chat room
   * 
   * @param memberData - Data for adding the member
   * @returns Promise resolving to the created ChatMember
   * @throws Error if addition fails
   * 
   * @example
   * ```typescript
   * const member = await repository.addMember({
   *   roomId: 'room-123',
   *   userId: 'user-456',
   *   username: 'john_doe',
   *   role: 'member'
   * })
   * ```
   */
  async addMember(memberData: CreateChatMemberData): Promise<ChatMember> {
    this.logger.info({ memberData }, 'Adding chat member')

    try {
      const member = await this.prisma.chatMember.create({
        data: {
          id: uuidv4(),
          roomId: memberData.roomId,
          userId: memberData.userId,
          username: memberData.username,
          role: memberData.role || 'member',
          isOnline: false,
          isTyping: false
        }
      })

      // Update room member count
      await this.prisma.chatRoom.update({
        where: { id: memberData.roomId },
        data: {
          memberCount: {
            increment: 1
          }
        }
      })

      const result: ChatMember = {
        id: member.id,
        roomId: member.roomId,
        userId: member.userId,
        username: member.username,
        role: member.role as 'admin' | 'moderator' | 'member',
        joinedAt: member.joinedAt,
        lastSeenAt: member.lastSeenAt || undefined,
        isOnline: member.isOnline,
        isTyping: member.isTyping,
        typingUntil: member.typingUntil || undefined
      }

      this.logger.info(
        { roomId: memberData.roomId, userId: memberData.userId },
        'Member added successfully'
      )
      return result
    } catch (error) {
      this.logger.error({ error, memberData }, 'Failed to add member')
      throw error
    }
  }

  /**
   * Finds a specific member in a room
   * 
   * @param roomId - UUID of the room
   * @param userId - UUID of the user
   * @returns Promise resolving to ChatMember or null if not found
   * 
   * @example
   * ```typescript
   * const member = await repository.findMember('room-123', 'user-456')
   * if (member) {
   *   console.log(`Role: ${member.role}`)
   * }
   * ```
   */
  async findMember(roomId: string, userId: string): Promise<ChatMember | null> {
    this.logger.debug({ roomId, userId }, 'Finding chat member')

    try {
      const member = await this.prisma.chatMember.findUnique({
        where: {
          roomId_userId: {
            roomId,
            userId
          }
        }
      })

      if (!member) {
        return null
      }

      return {
        id: member.id,
        roomId: member.roomId,
        userId: member.userId,
        username: member.username,
        role: member.role as 'admin' | 'moderator' | 'member',
        joinedAt: member.joinedAt,
        lastSeenAt: member.lastSeenAt || undefined,
        isOnline: member.isOnline,
        isTyping: member.isTyping,
        typingUntil: member.typingUntil || undefined
      }
    } catch (error) {
      this.logger.error({ error, roomId, userId }, 'Failed to find member')
      return null
    }
  }

  /**
   * Finds all members of a specific room
   * 
   * @param roomId - UUID of the room
   * @returns Promise resolving to array of ChatMember objects
   * 
   * @example
   * ```typescript
   * const members = await repository.findMembersByRoom('room-123')
   * console.log(`Room has ${members.length} members`)
   * ```
   */
  async findMembersByRoom(
    roomId: string,
    limit = 100,
    cursor?: string
  ): Promise<PaginatedResult<ChatMember>> {
    this.logger.debug({ roomId, limit, cursor }, 'Finding room members')

    try {
      const take = limit + 1

      const where: {
        roomId: string
        joinedAt?: { lt: Date }
      } = { roomId }

      if (cursor) {
        const cursorMember = await this.prisma.chatMember.findUnique({
          where: { id: cursor },
          select: { joinedAt: true }
        })
        if (cursorMember) {
          where.joinedAt = { lt: cursorMember.joinedAt }
        }
      }

      const members = await this.prisma.chatMember.findMany({
        where,
        orderBy: { joinedAt: 'desc' },
        take,
        select: {
          id: true,
          roomId: true,
          userId: true,
          username: true,
          role: true,
          joinedAt: true,
          lastSeenAt: true,
          isOnline: true,
          isTyping: true,
          typingUntil: true
        }
      })

      const hasMore = members.length > limit
      const resultItems = hasMore ? members.slice(0, limit) : members
      const nextCursor = hasMore && resultItems.length > 0
        ? resultItems[resultItems.length - 1].id
        : undefined

      return {
        items: resultItems.map((member: {
          id: string,
          roomId: string,
          userId: string,
          username: string,
          role: string,
          joinedAt: Date,
          lastSeenAt: Date | null,
          isOnline: boolean,
          isTyping: boolean,
          typingUntil: Date | null
        }) => ({
          id: member.id,
          roomId: member.roomId,
          userId: member.userId,
          username: member.username,
          role: member.role as 'admin' | 'moderator' | 'member',
          joinedAt: member.joinedAt,
          lastSeenAt: member.lastSeenAt || undefined,
          isOnline: member.isOnline,
          isTyping: member.isTyping,
          typingUntil: member.typingUntil || undefined
        })),
        hasMore,
        nextCursor
      }
    } catch (error) {
      this.logger.error({ error, roomId }, 'Failed to find room members')
      return { items: [], hasMore: false }
    }
  }

  /**
   * Updates a room member's data
   * 
   * @param roomId - UUID of the room
   * @param userId - UUID of the user
   * @param updates - Partial ChatMember data to update
   * @returns Promise resolving to updated ChatMember or null if not found
   * 
   * @example
   * ```typescript
   * const updated = await repository.updateMember('room-123', 'user-456', {
   *   role: 'admin',
   *   isOnline: true
   * })
   * ```
   */
  async updateMember(
    roomId: string,
    userId: string,
    updates: Partial<ChatMember>
  ): Promise<ChatMember | null> {
    this.logger.info({ roomId, userId, updates }, 'Updating chat member')

    try {
      const updatedMember = await this.prisma.chatMember.update({
        where: {
          roomId_userId: {
            roomId,
            userId
          }
        },
        data: {
          ...(updates.role && { role: updates.role }),
          ...(updates.isOnline !== undefined && { isOnline: updates.isOnline }),
          ...(updates.isTyping !== undefined && { isTyping: updates.isTyping }),
          ...(updates.lastSeenAt !== undefined && {
            lastSeenAt: updates.lastSeenAt
          }),
          ...(updates.typingUntil !== undefined && {
            typingUntil: updates.typingUntil
          })
        }
      })

      return {
        id: updatedMember.id,
        roomId: updatedMember.roomId,
        userId: updatedMember.userId,
        username: updatedMember.username,
        role: updatedMember.role as 'admin' | 'moderator' | 'member',
        joinedAt: updatedMember.joinedAt,
        lastSeenAt: updatedMember.lastSeenAt || undefined,
        isOnline: updatedMember.isOnline,
        isTyping: updatedMember.isTyping,
        typingUntil: updatedMember.typingUntil || undefined
      }
    } catch (error: any) {
      if (error.code === 'P2025') {
        // Record not found
        return null
      }
      this.logger.error({ error, roomId, userId }, 'Failed to update member')
      return null
    }
  }

  /**
   * Removes a member from a room
   * 
   * @param roomId - UUID of the room
   * @param userId - UUID of the user
   * @returns Promise resolving to true if removed, false otherwise
   * 
   * @example
   * ```typescript
   * const removed = await repository.removeMember('room-123', 'user-456')
   * ```
   */
  async removeMember(roomId: string, userId: string): Promise<boolean> {
    this.logger.info({ roomId, userId }, 'Removing chat member')

    try {
      await this.prisma.chatMember.delete({
        where: {
          roomId_userId: {
            roomId,
            userId
          }
        }
      })

      // Update room member count
      await this.prisma.chatRoom.update({
        where: { id: roomId },
        data: {
          memberCount: {
            decrement: 1
          }
        }
      })

      this.logger.info({ roomId, userId }, 'Member removed successfully')
      return true
    } catch (error: any) {
      if (error.code === 'P2025') {
        // Record not found
        return false
      }
      this.logger.error({ error, roomId, userId }, 'Failed to remove member')
      return false
    }
  }

  /**
   * Creates a new notification for a user
   * 
   * @param notification - Notification data without id and createdAt
   * @returns Promise resolving to the created ChatNotification
   * 
   * @example
   * ```typescript
   * const notification = await repository.createNotification({
   *   userId: 'user-123',
   *   roomId: 'room-456',
   *   messageId: 'msg-789',
   *   type: 'mention',
   *   isRead: false
   * })
   * ```
   */
  async createNotification(
    notification: Omit<ChatNotification, 'id' | 'createdAt'>
  ): Promise<ChatNotification> {
    this.logger.info({ notification }, 'Creating chat notification')

    try {
      const newNotification = await this.prisma.chatNotification.create({
        data: {
          id: uuidv4(),
          userId: notification.userId,
          roomId: notification.roomId,
          messageId: notification.messageId,
          type: notification.type,
          isRead: notification.isRead || false
        }
      })

      const result: ChatNotification = {
        id: newNotification.id,
        userId: newNotification.userId,
        roomId: newNotification.roomId,
        messageId: newNotification.messageId,
        type: newNotification.type as 'new_message' | 'mention' | 'room_invite',
        isRead: newNotification.isRead,
        createdAt: newNotification.createdAt
      }

      this.logger.info(
        { notificationId: result.id },
        'Notification created successfully'
      )
      return result
    } catch (error) {
      this.logger.error({ error, notification }, 'Failed to create notification')
      throw error
    }
  }

  /**
   * Finds all notifications for a specific user
   * 
   * @param userId - UUID of the user
   * @param limit - Maximum number of notifications to return (default: 50)
   * @returns Promise resolving to array of ChatNotification objects
   * 
   * @example
   * ```typescript
   * const notifications = await repository.findNotificationsByUser('user-123', 20)
   * const unread = notifications.filter(n => !n.isRead)
   * ```
   */
  async findNotificationsByUser(
    userId: string,
    limit = 50,
    cursor?: string
  ): Promise<PaginatedResult<ChatNotification>> {
    this.logger.debug({ userId, limit, cursor }, 'Finding user notifications')

    try {
      const take = limit + 1

      const where: {
        userId: string
        createdAt?: { lt: Date }
      } = { userId }

      if (cursor) {
        const cursorNotification = await this.prisma.chatNotification.findUnique({
          where: { id: cursor },
          select: { createdAt: true }
        })
        if (cursorNotification) {
          where.createdAt = { lt: cursorNotification.createdAt }
        }
      }

      const notifications = await this.prisma.chatNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          id: true,
          userId: true,
          roomId: true,
          messageId: true,
          type: true,
          isRead: true,
          createdAt: true
        }
      })

      const hasMore = notifications.length > limit
      const resultItems = hasMore ? notifications.slice(0, limit) : notifications
      const nextCursor = hasMore && resultItems.length > 0
        ? resultItems[resultItems.length - 1].id
        : undefined

      return {
        items: resultItems.map((notif) => ({
          id: notif.id,
          userId: notif.userId,
          roomId: notif.roomId,
          messageId: notif.messageId,
          type: notif.type as 'new_message' | 'mention' | 'room_invite',
          isRead: notif.isRead,
          createdAt: notif.createdAt
        })),
        hasMore,
        nextCursor
      }
    } catch (error) {
      this.logger.error({ error, userId }, 'Failed to find notifications')
      return { items: [], hasMore: false }
    }
  }

  /**
   * Marks a specific notification as read
   * 
   * @param notificationId - UUID of the notification
   * @returns Promise resolving to true if marked, false otherwise
   * 
   * @example
   * ```typescript
   * await repository.markNotificationAsRead('notif-123')
   * ```
   */
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    this.logger.info({ notificationId }, 'Marking notification as read')

    try {
      await this.prisma.chatNotification.update({
        where: { id: notificationId },
        data: { isRead: true }
      })

      this.logger.info(
        { notificationId },
        'Notification marked as read successfully'
      )
      return true
    } catch (error: any) {
      if (error.code === 'P2025') {
        // Record not found
        return false
      }
      this.logger.error(
        { error, notificationId },
        'Failed to mark notification as read'
      )
      return false
    }
  }

  /**
   * Marks all notifications as read for a user, optionally filtered by room
   * 
   * @param userId - UUID of the user
   * @param roomId - Optional UUID of the room to filter by
   * @returns Promise resolving to true if successful, false otherwise
   * 
   * @example
   * ```typescript
   * // Mark all notifications as read
   * await repository.markAllNotificationsAsRead('user-123')
   * 
   * // Mark all notifications for a specific room as read
   * await repository.markAllNotificationsAsRead('user-123', 'room-456')
   * ```
   */
  async markAllNotificationsAsRead(
    userId: string,
    roomId?: string
  ): Promise<boolean> {
    this.logger.info({ userId, roomId }, 'Marking all notifications as read')

    try {
      const where: any = {
        userId,
        isRead: false
      }

      if (roomId) {
        where.roomId = roomId
      }

      await this.prisma.chatNotification.updateMany({
        where,
        data: { isRead: true }
      })

      this.logger.info(
        { userId, roomId },
        'All notifications marked as read'
      )
      return true
    } catch (error) {
      this.logger.error(
        { error, userId, roomId },
        'Failed to mark all notifications as read'
      )
      return false
    }
  }

  /**
   * Gets the total number of members in a room
   * 
   * @param roomId - UUID of the room
   * @returns Promise resolving to the member count
   * 
   * @example
   * ```typescript
   * const count = await repository.getRoomMemberCount('room-123')
   * console.log(`Room has ${count} members`)
   * ```
   */
  async getRoomMemberCount(roomId: string): Promise<number> {
    this.logger.debug({ roomId }, 'Getting room member count')

    try {
      const count = await this.prisma.chatMember.count({
        where: { roomId }
      })

      return count
    } catch (error) {
      this.logger.error({ error, roomId }, 'Failed to get member count')
      return 0
    }
  }

  /**
   * Checks if a user is a member of a specific room
   * 
   * @param roomId - UUID of the room
   * @param userId - UUID of the user
   * @returns Promise resolving to true if user is a member, false otherwise
   * 
   * @example
   * ```typescript
   * const isMember = await repository.isUserMemberOfRoom('room-123', 'user-456')
   * if (isMember) {
   *   // Allow access to room
   * }
   * ```
   */
  async isUserMemberOfRoom(roomId: string, userId: string): Promise<boolean> {
    this.logger.debug({ roomId, userId }, 'Checking if user is member of room')

    try {
      const member = await this.prisma.chatMember.findUnique({
        where: {
          roomId_userId: {
            roomId,
            userId
          }
        }
      })

      return !!member
    } catch (error) {
      this.logger.error(
        { error, roomId, userId },
        'Failed to check user membership'
      )
      return false
    }
  }

  /**
   * Gets all rooms that a user is a member of
   * 
   * @param userId - UUID of the user
   * @returns Promise resolving to array of ChatRoom objects
   * 
   * @example
   * ```typescript
   * const userRooms = await repository.getUserRooms('user-123')
   * userRooms.forEach(room => {
   *   console.log(`Member of: ${room.name}`)
   * })
   * ```
   */
  async getUserRooms(
    userId: string,
    limit = 50,
    cursor?: string
  ): Promise<PaginatedResult<ChatRoom>> {
    this.logger.debug({ userId, limit, cursor }, 'Getting user rooms')

    try {
      const take = limit + 1

      const memberWhere: {
        userId: string
        joinedAt?: { lt: Date }
      } = { userId }

      if (cursor) {
        const cursorMember = await this.prisma.chatMember.findUnique({
          where: { id: cursor, userId },
          select: { joinedAt: true }
        })
        if (cursorMember) {
          memberWhere.joinedAt = { lt: cursorMember.joinedAt }
        }
      }

      const members = await this.prisma.chatMember.findMany({
        where: memberWhere,
        orderBy: { joinedAt: 'desc' },
        take,
        select: {
          id: true,
          roomId: true,
          joinedAt: true,
          room: {
            select: {
              id: true,
              name: true,
              type: true,
              description: true,
              createdBy: true,
              createdAt: true,
              updatedAt: true,
              memberCount: true,
              isActive: true
            }
          }
        }
      })

      const hasMore = members.length > limit
      const resultMembers = hasMore ? members.slice(0, limit) : members
      const nextCursor = hasMore && resultMembers.length > 0
        ? resultMembers[resultMembers.length - 1].id
        : undefined

      return {
        items: resultMembers.map((member) => ({
          id: member.room.id,
          name: member.room.name,
          type: member.room.type as 'public' | 'private',
          description: member.room.description || undefined,
          createdBy: member.room.createdBy,
          createdAt: member.room.createdAt,
          updatedAt: member.room.updatedAt,
          memberCount: member.room.memberCount,
          isActive: member.room.isActive
        })),
        hasMore,
        nextCursor
      }
    } catch (error) {
      this.logger.error({ error, userId }, 'Failed to get user rooms')
      return { items: [], hasMore: false }
    }
  }
}
