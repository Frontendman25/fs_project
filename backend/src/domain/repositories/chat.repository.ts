/**
 * Chat Repository Interface
 * Following Clean Architecture - Domain layer
 * Defines the contract for chat data persistence
 */

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

/**
 * Pagination result type for cursor-based pagination
 */
export interface PaginatedResult<T> {
  items: T[]
  hasMore: boolean
  nextCursor?: string
}

export interface IChatRepository {
  // Chat Room operations
  createRoom(roomData: CreateChatRoomData): Promise<ChatRoom>
  findRoomById(roomId: string): Promise<ChatRoom | null>
  findRoomsByQuery(query: ChatRoomQuery): Promise<PaginatedResult<ChatRoom>>
  updateRoom(
    roomId: string,
    updates: Partial<ChatRoom>
  ): Promise<ChatRoom | null>
  deleteRoom(roomId: string): Promise<boolean>

  // Chat Message operations
  createMessage(messageData: CreateChatMessageData): Promise<ChatMessage>
  findMessageById(messageId: string): Promise<ChatMessage | null>
  findMessagesByQuery(query: ChatMessageQuery): Promise<PaginatedResult<ChatMessage>>
  updateMessage(
    messageId: string,
    updates: Partial<ChatMessage>
  ): Promise<ChatMessage | null>
  deleteMessage(messageId: string): Promise<boolean>

  // Chat Member operations
  addMember(memberData: CreateChatMemberData): Promise<ChatMember>
  findMember(roomId: string, userId: string): Promise<ChatMember | null>
  findMembersByRoom(roomId: string, limit?: number, cursor?: string): Promise<PaginatedResult<ChatMember>>
  updateMember(
    roomId: string,
    userId: string,
    updates: Partial<ChatMember>
  ): Promise<ChatMember | null>
  removeMember(roomId: string, userId: string): Promise<boolean>

  // Chat Notification operations
  createNotification(
    notification: Omit<ChatNotification, 'id' | 'createdAt'>
  ): Promise<ChatNotification>
  findNotificationsByUser(
    userId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginatedResult<ChatNotification>>
  markNotificationAsRead(notificationId: string): Promise<boolean>
  markAllNotificationsAsRead(userId: string, roomId?: string): Promise<boolean>

  // Utility operations
  getRoomMemberCount(roomId: string): Promise<number>
  isUserMemberOfRoom(roomId: string, userId: string): Promise<boolean>
  getUserRooms(userId: string, limit?: number, cursor?: string): Promise<PaginatedResult<ChatRoom>>
}
