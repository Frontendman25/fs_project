/**
 * Chat Event Service Interface
 * Following Clean Architecture - Domain layer
 * Defines the contract for chat event handling and real-time communication
 */

import {
  ChatMessage,
  ChatMember,
  ChatTypingIndicator
} from '@/domain/entities/chat.entity'

export interface IChatEventService {
  /**
   * Emit a new message event to room members
   */
  emitMessageReceived(roomId: string, message: ChatMessage): Promise<void>

  /**
   * Emit user joined event to room members
   */
  emitUserJoined(roomId: string, member: ChatMember): Promise<void>

  /**
   * Emit user left event to room members
   */
  emitUserLeft(roomId: string, userId: string): Promise<void>

  /**
   * Emit typing indicator to room members
   */
  emitTypingIndicator(
    roomId: string,
    indicator: ChatTypingIndicator
  ): Promise<void>

  /**
   * Emit room update event to room members
   */
  emitRoomUpdated(roomId: string, room: any): Promise<void>

  /**
   * Emit error event to a specific user
   */
  emitError(
    userId: string,
    error: { message: string; code?: string }
  ): Promise<void>

  /**
   * Join a user to a room's socket room
   */
  joinUserToRoom(userId: string, roomId: string): Promise<void>

  /**
   * Remove a user from a room's socket room
   */
  removeUserFromRoom(userId: string, roomId: string): Promise<void>

  /**
   * Get online users in a room
   */
  getOnlineUsersInRoom(roomId: string): Promise<string[]>

  /**
   * Check if a user is online
   */
  isUserOnline(userId: string): Promise<boolean>
}
