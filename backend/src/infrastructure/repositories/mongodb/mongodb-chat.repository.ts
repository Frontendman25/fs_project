/**
 * MongoDB Chat Repository Implementation
 * Following Clean Architecture - Infrastructure layer
 * Implements chat data persistence using Mongoose ODM
 */

import mongoose, { FilterQuery } from 'mongoose'
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

import {
  ChatRoomModel,
  ChatMessageModel,
  ChatMemberModel,
  ChatNotificationModel,
  ChatRoomDocument,
  ChatMessageDocument,
  ChatMemberDocument,
  ChatNotificationDocument
} from '@/infrastructure/database/schemas/mongodb'

/**
 * MongoDB Chat Repository
 *
 * Implements chat data persistence using Mongoose ODM.
 * Provides full CRUD operations for chat rooms, messages, members, and notifications.
 *
 * Design Patterns:
 * - Repository Pattern: Abstracts data access logic
 * - Dependency Injection: Receives Mongoose instance and ILoggerService via constructor
 *
 * @example
 * ```typescript
 * const repository = new MongoDBChatRepository(mongoose, logger)
 *
 * // Create a room
 * const room = await repository.createRoom({
 *   name: 'General Chat',
 *   type: 'public',
 *   createdBy: 'user123'
 * })
 *
 * // Add a member
 * await repository.addMember({
 *   roomId: room.id,
 *   userId: 'user456',
 *   username: 'john_doe',
 *   role: 'member'
 * })
 * ```
 */
export class MongoDBChatRepository implements IChatRepository {
  private logger: ILoggerService

  constructor(mongooseInstance: typeof mongoose, logger: ILoggerService) {
    this.logger = logger.child({ service: 'MongoDBChatRepository' })
  }

  /**
   * Creates a new chat room in MongoDB
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
      const room = await ChatRoomModel.create({
        id: uuidv4(),
        name: roomData.name,
        type: roomData.type,
        description: roomData.description,
        createdBy: roomData.createdBy,
        memberCount: 0,
        isActive: true
      })

      this.logger.info(
        { roomId: room.id, roomName: room.name },
        'Chat room created successfully'
      )

      return room.toObject() as ChatRoom
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
      const room = await ChatRoomModel.findOne({ id: roomId })
        .lean<ChatRoomDocument>()
        .exec()

      if (!room) {
        return null
      }

      return room as ChatRoom
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
  // async findRoomsByQuery(query: ChatRoomQuery): Promise<ChatRoom[]> {
  //   this.logger.debug({ query }, 'Finding rooms by query')

  //   try {
  //     const filter: any = {}

  //     if (query.type) {
  //       filter.type = query.type
  //     }

  //     if (query.userId) {
  //       // Find rooms where user is a member
  //       const memberRooms = await ChatMemberModel.find({
  //         userId: query.userId
  //       })
  //         .lean<ChatMember[]>()
  //         .exec()
  //       const roomIds = memberRooms.map((m: ChatMember) => m.roomId)
  //       filter.id = { $in: roomIds }
  //     }

  //     let mongoQuery = ChatRoomModel.find(filter)
  //       .sort({ createdAt: -1 })
  //       .limit(query.limit || 20)

  //     // Apply cursor pagination if provided
  //     if (query.cursor) {
  //       const cursorRoom = await ChatRoomModel.findOne({
  //         id: query.cursor
  //       }).lean()
  //       if (cursorRoom && !Array.isArray(cursorRoom)) {
  //         filter.createdAt = { $lt: cursorRoom.createdAt }
  //         mongoQuery = ChatRoomModel.find(filter)
  //           .sort({ createdAt: -1 })
  //           .limit(query.limit || 20)
  //       }
  //     }

  //     const rooms = await mongoQuery.lean()

  //     // return (Array.isArray(rooms) ? rooms : [rooms]).map((room: any) => ({
  //     //   id: room.id,
  //     //   name: room.name,
  //     //   type: room.type,
  //     //   description: room.description || undefined,
  //     //   createdBy: room.createdBy,
  //     //   memberCount: room.memberCount,
  //     //   isActive: room.isActive,
  //     //   createdAt: room.createdAt,
  //     //   updatedAt: room.updatedAt
  //     // }))

  //     // return rooms.map((room: ChatRoom) => ({
  //     //   id: room.id,
  //     //   name: room.name,
  //     //   type: room.type,
  //     //   description: room.description || undefined,
  //     //   createdBy: room.createdBy,
  //     //   memberCount: room.memberCount,
  //     //   isActive: room.isActive,
  //     //   createdAt: room.createdAt,
  //     //   updatedAt: room.updatedAt
  //     // }))

  //     return rooms as ChatRoom[]
  //   } catch (error) {
  //     this.logger.error({ error, query }, 'Failed to find rooms by query')
  //     return []
  //   }
  // }

    /**
   * Finds chat rooms with filtering, user membership check and cursor-based pagination
   *
   * @param query - Query parameters for filtering and pagination
   * @returns Promise resolving to paginated ChatRoom results
   */
  async findRoomsByQuery(query: ChatRoomQuery): Promise<PaginatedResult<ChatRoom>> {
    this.logger.debug({ query }, 'Finding rooms by query')

    try {
      const limit = query.limit || 20
      const dbLimit = limit + 1

      const filter: FilterQuery<ChatRoomDocument> = {}

      if (query.type) {
        filter.type = query.type
      }

      if (query.userId) {
        const memberRooms = await ChatMemberModel
          .find({ userId: query.userId }, { roomId: 1, _id: 0 })
          .lean<Array<{ roomId: string }>>()
          .exec()

        const roomIds = memberRooms.map(m => m.roomId)

        if (roomIds.length === 0) {
          return { items: [], hasMore: false }
        }

        filter.id = { $in: roomIds }
      }

      if (query.cursor) {
        const cursorRoom = await ChatRoomModel
          .findOne({ id: query.cursor }, { createdAt: 1, _id: 0 })
          .lean<{ createdAt: Date } | null>()
          .exec()

        if (cursorRoom) {
          filter.createdAt = { $lt: cursorRoom.createdAt }
        }
      }

      const rooms = await ChatRoomModel
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(dbLimit)
        .lean<ChatRoomDocument[]>()
        .exec()

      const hasMore = rooms.length > limit
      const resultItems = hasMore ? rooms.slice(0, limit) : rooms
      const nextCursor = hasMore && resultItems.length > 0
        ? resultItems[resultItems.length - 1].id
        : undefined

      return {
        items: resultItems as ChatRoom[],
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
      const updatedRoom = await ChatRoomModel.findOneAndUpdate(
        { id: roomId },
        {
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
        },
        { new: true }
      )
        .lean<ChatRoomDocument>()
        .exec()

      if (!updatedRoom) {
        throw new ChatRoomNotFoundError(roomId)
      }

      return updatedRoom as ChatRoom
    } catch (error) {
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
      const result = await ChatRoomModel.deleteOne({ id: roomId })

      if (result.deletedCount > 0) {
        // Clean up associated data
        await Promise.all([
          ChatMemberModel.deleteMany({ roomId }),
          ChatMessageModel.deleteMany({ roomId }),
          ChatNotificationModel.deleteMany({ roomId })
        ])

        this.logger.info({ roomId }, 'Chat room deleted successfully')
        return true
      }

      return false
    } catch (error) {
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
      const message = await ChatMessageModel.create({
        id: uuidv4(),
        roomId: messageData.roomId,
        senderId: messageData.senderId,
        senderUsername: messageData.senderUsername,
        content: messageData.content,
        messageType: messageData.messageType || 'text',
        metadata: messageData.metadata || undefined,
        replyTo: messageData.replyTo || undefined
      })

      this.logger.info({ messageId: message.id }, 'Message created successfully')
      return message.toObject() as ChatMessage
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
      const message = await ChatMessageModel.findOne({ id: messageId })
        .lean<ChatMessageDocument>()
        .exec()

      if (!message) {
        return null
      }

      return message as ChatMessage
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
      const dbLimit = limit + 1

      const filter: FilterQuery<ChatMessageDocument> = {
        roomId: query.roomId,
        deletedAt: { $exists: false }
      }

      if (query.before) {
        filter.createdAt = { ...filter.createdAt, $lt: query.before }
      }
      if (query.after) {
        filter.createdAt = { ...filter.createdAt, $gt: query.after }
      }

      if (query.cursor) {
        const cursorMessage = await ChatMessageModel
          .findOne({ id: query.cursor }, { createdAt: 1, _id: 0 })
          .lean<{ createdAt: Date } | null>()
          .exec()

        if (cursorMessage) {
          filter.createdAt = {
            ...filter.createdAt,
            $lt: cursorMessage.createdAt
          }
        }
      }

      const messages = await ChatMessageModel
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(dbLimit)
        .lean<ChatMessageDocument[]>()
        .exec()

      const hasMore = messages.length > limit
      const resultItems = hasMore ? messages.slice(0, limit) : messages
      const nextCursor = hasMore && resultItems.length > 0
        ? resultItems[resultItems.length - 1].id
        : undefined

      return {
        items: resultItems as ChatMessage[],
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
      const updatedMessage = await ChatMessageModel.findOneAndUpdate(
        { id: messageId },
        {
          ...(updates.content && { content: updates.content }),
          ...(updates.messageType && { messageType: updates.messageType }),
          ...(updates.metadata !== undefined && { metadata: updates.metadata }),
          editedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      )
        .lean<ChatMessageDocument>()
        .exec()

      if (!updatedMessage) {
        return null
      }

      return updatedMessage as ChatMessage
    } catch (error) {
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
      const result = await ChatMessageModel.updateOne(
        { id: messageId },
        {
          deletedAt: new Date(),
          content: '[Deleted]',
          updatedAt: new Date()
        }
      )

      if (result.modifiedCount > 0) {
        this.logger.info({ messageId }, 'Message deleted successfully')
        return true
      }

      return false
    } catch (error) {
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
      const member = await ChatMemberModel.create({
        id: uuidv4(),
        roomId: memberData.roomId,
        userId: memberData.userId,
        username: memberData.username,
        role: memberData.role || 'member',
        isOnline: false,
        isTyping: false
      })

      // Update room member count
      await ChatRoomModel.updateOne(
        { id: memberData.roomId },
        { $inc: { memberCount: 1 } }
      )

      this.logger.info(
        { roomId: memberData.roomId, userId: memberData.userId },
        'Member added successfully'
      )
      return member.toObject() as ChatMember
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
      const member = await ChatMemberModel.findOne({
        roomId,
        userId
      })
        .lean<ChatMemberDocument>()
        .exec()

      if (!member) {
        return null
      }

      return member as ChatMember
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
      const dbLimit = limit + 1

      const filter: FilterQuery<ChatMemberDocument> = { roomId }

      if (cursor) {
        const cursorMember = await ChatMemberModel
          .findOne({ id: cursor }, { joinedAt: 1, _id: 0 })
          .lean<{ joinedAt: Date } | null>()
          .exec()

        if (cursorMember) {
          filter.joinedAt = { $lt: cursorMember.joinedAt }
        }
      }

      const members = await ChatMemberModel
        .find(filter)
        .sort({ joinedAt: -1 })
        .limit(dbLimit)
        .lean<ChatMemberDocument[]>()
        .exec()

      const hasMore = members.length > limit
      const resultItems = hasMore ? members.slice(0, limit) : members
      const nextCursor = hasMore && resultItems.length > 0
        ? resultItems[resultItems.length - 1].id
        : undefined

      return {
        items: resultItems as ChatMember[],
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
      const updatedMember = await ChatMemberModel.findOneAndUpdate(
        { roomId, userId },
        {
          ...(updates.role && { role: updates.role }),
          ...(updates.isOnline !== undefined && { isOnline: updates.isOnline }),
          ...(updates.isTyping !== undefined && { isTyping: updates.isTyping }),
          ...(updates.lastSeenAt !== undefined && {
            lastSeenAt: updates.lastSeenAt
          }),
          ...(updates.typingUntil !== undefined && {
            typingUntil: updates.typingUntil
          })
        },
        { new: true }
      )
        .lean<ChatMemberDocument>()
        .exec()

      if (!updatedMember) {
        return null
      }

      return updatedMember as ChatMember
    } catch (error) {
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
      const result = await ChatMemberModel.deleteOne({ roomId, userId })

      if (result.deletedCount > 0) {
        // Update room member count
        await ChatRoomModel.updateOne(
          { id: roomId },
          { $inc: { memberCount: -1 } }
        )

        this.logger.info({ roomId, userId }, 'Member removed successfully')
        return true
      }

      return false
    } catch (error) {
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
      const newNotification = await ChatNotificationModel.create({
        id: uuidv4(),
        userId: notification.userId,
        roomId: notification.roomId,
        messageId: notification.messageId,
        type: notification.type,
        isRead: notification.isRead || false
      })

      this.logger.info(
        { notificationId: newNotification.id },
        'Notification created successfully'
      )
      return newNotification.toObject() as ChatNotification
    } catch (error) {
      this.logger.error(
        { error, notification },
        'Failed to create notification'
      )
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
      const dbLimit = limit + 1

      const filter: FilterQuery<ChatNotificationDocument> = { userId }

      if (cursor) {
        const cursorNotification = await ChatNotificationModel
          .findOne({ id: cursor }, { createdAt: 1, _id: 0 })
          .lean<{ createdAt: Date } | null>()
          .exec()

        if (cursorNotification) {
          filter.createdAt = { $lt: cursorNotification.createdAt }
        }
      }

      const notifications = await ChatNotificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(dbLimit)
        .lean<ChatNotificationDocument[]>()
        .exec()

      const hasMore = notifications.length > limit
      const resultItems = hasMore ? notifications.slice(0, limit) : notifications
      const nextCursor = hasMore && resultItems.length > 0
        ? resultItems[resultItems.length - 1].id
        : undefined

      return {
        items: resultItems as ChatNotification[],
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
      const result = await ChatNotificationModel.updateOne(
        { id: notificationId },
        { isRead: true }
      )

      if (result.modifiedCount > 0) {
        this.logger.info(
          { notificationId },
          'Notification marked as read successfully'
        )
        return true
      }

      return false
    } catch (error) {
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
      const filter: FilterQuery<ChatNotificationDocument> = { userId, isRead: false }
      if (roomId) filter.roomId = roomId

      const result = await ChatNotificationModel.updateMany(filter, {
        isRead: true
      })

      this.logger.info(
        { userId, roomId, count: result.modifiedCount },
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
      const count = await ChatMemberModel.countDocuments({ roomId })
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
      const member = await ChatMemberModel.findOne({
        roomId,
        userId
      })
        .lean<{ id: string } | null>()
        .exec()

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
      const dbLimit = limit + 1

      const memberFilter: FilterQuery<ChatMemberDocument> = { userId }
      if (cursor) {
        const cursorMember = await ChatMemberModel
          .findOne({ id: cursor, userId }, { joinedAt: 1, _id: 0 })
          .lean<{ joinedAt: Date } | null>()
          .exec()

        if (cursorMember) {
          memberFilter.joinedAt = { $lt: cursorMember.joinedAt }
        }
      }

      const members = await ChatMemberModel
        .find(memberFilter, { roomId: 1, joinedAt: 1, _id: 0 })
        .sort({ joinedAt: -1 })
        .limit(dbLimit)
        .lean<Array<{ roomId: string; joinedAt: Date }>>()
        .exec()

      if (members.length === 0) {
        return { items: [], hasMore: false }
      }

      const roomIds = members.map(m => m.roomId)
      const rooms = await ChatRoomModel
        .find({ id: { $in: roomIds } })
        .lean<ChatRoomDocument[]>()
        .exec()

      const roomMap = new Map(rooms.map(r => [r.id, r]))
      const orderedRooms = members
        .map(m => roomMap.get(m.roomId))
        .filter((r): r is ChatRoomDocument => r !== undefined)

      const hasMore = members.length > limit
      const resultItems = hasMore ? orderedRooms.slice(0, limit) : orderedRooms
      const nextCursor = hasMore && members.length > limit
        ? members[limit].roomId
        : undefined

      return {
        items: resultItems as ChatRoom[],
        hasMore,
        nextCursor
      }
    } catch (error) {
      this.logger.error({ error, userId }, 'Failed to get user rooms')
      return { items: [], hasMore: false }
    }
  }
}
