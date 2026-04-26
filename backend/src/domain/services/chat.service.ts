/**
 * Chat Service Interface
 * Following Clean Architecture - Domain layer
 * Defines the contract for chat-related services
 */

import {
  ChatMessage,
  ChatRoom,
  ChatMember,
  ChatTypingIndicator
} from '@/domain/entities/chat.entity'

export interface IChatService {
  /**
   * Send a message to a chat room
   */
  sendMessage(messageData: {
    roomId: string
    senderId: string
    senderUsername: string
    content: string
    messageType?: 'text' | 'image' | 'file' | 'system'
    metadata?: any
    replyTo?: string
  }): Promise<ChatMessage>

  /**
   * Get messages from a chat room with pagination
   */
  getMessages(
    roomId: string,
    options?: {
      limit?: number
      cursor?: string
      before?: Date
      after?: Date
    }
  ): Promise<ChatMessage[]>

  /**
   * Join a user to a chat room
   */
  joinRoom(
    roomId: string,
    userId: string,
    username: string
  ): Promise<ChatMember>

  /**
   * Remove a user from a chat room
   */
  leaveRoom(roomId: string, userId: string): Promise<boolean>

  /**
   * Get all rooms for a user
   */
  getUserRooms(userId: string): Promise<ChatRoom[]>

  /**
   * Create a new chat room
   */
  createRoom(roomData: {
    name: string
    type: 'public' | 'private'
    description?: string
    createdBy: string
  }): Promise<ChatRoom>

  /**
   * Get room members
   */
  getRoomMembers(roomId: string): Promise<ChatMember[]>

  /**
   * Update user typing status
   */
  updateTypingStatus(
    roomId: string,
    userId: string,
    username: string,
    isTyping: boolean
  ): Promise<void>

  /**
   * Get typing indicators for a room
   */
  getTypingIndicators(roomId: string): Promise<ChatTypingIndicator[]>

  /**
   * Get room by ID with validation
   */
  getRoomById(roomId: string): Promise<ChatRoom>

  /**
   * Check if user is member of room
   */
  isUserMemberOfRoom(roomId: string, userId: string): Promise<boolean>

  /**
   * Get online users in a room
   */
  getOnlineUsersInRoom(roomId: string): Promise<string[]>

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): Promise<boolean>
}
