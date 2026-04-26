/**
 * Chat Domain Errors
 * Following Clean Architecture - Domain layer
 * Custom error classes for chat-related operations
 */

import { AppError } from './app.error'

/**
 * Base chat error class
 */
export abstract class ChatError extends AppError {
  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    originalError?: Error
  ) {
    super(message, statusCode, isOperational)
    this.name = this.constructor.name
    if (originalError) {
      this.stack = originalError.stack
    }
  }
}

/**
 * Chat room not found error
 */
export class ChatRoomNotFoundError extends ChatError {
  constructor(roomId: string) {
    super(`Chat room with ID '${roomId}' not found`, 404)
  }
}

/**
 * Chat message not found error
 */
export class ChatMessageNotFoundError extends ChatError {
  constructor(messageId: string) {
    super(`Chat message with ID '${messageId}' not found`, 404)
  }
}

/**
 * User not member of room error
 */
export class UserNotMemberError extends ChatError {
  constructor(userId: string, roomId: string) {
    super(`User '${userId}' is not a member of room '${roomId}'`, 403)
  }
}

/**
 * Room access denied error
 */
export class RoomAccessDeniedError extends ChatError {
  constructor(userId: string, roomId: string, reason?: string) {
    const message = reason
      ? `Access denied to room '${roomId}' for user '${userId}': ${reason}`
      : `Access denied to room '${roomId}' for user '${userId}'`
    super(message, 403)
  }
}

/**
 * Invalid message content error
 */
export class InvalidMessageContentError extends ChatError {
  constructor(reason: string) {
    super(`Invalid message content: ${reason}`, 400)
  }
}

/**
 * Room creation failed error
 */
export class RoomCreationFailedError extends ChatError {
  constructor(reason: string) {
    super(`Failed to create room: ${reason}`, 500)
  }
}

/**
 * Message sending failed error
 */
export class MessageSendingFailedError extends ChatError {
  constructor(reason: string) {
    super(`Failed to send message: ${reason}`, 500)
  }
}

/**
 * Chat service unavailable error
 */
export class ChatServiceUnavailableError extends ChatError {
  constructor(service: string) {
    super(`Chat service '${service}' is currently unavailable`, 503)
  }
}

/**
 * WebSocket connection error
 */
export class WebSocketConnectionError extends ChatError {
  constructor(userId: string, reason: string) {
    super(`WebSocket connection failed for user '${userId}': ${reason}`, 500)
  }
}

/**
 * Redis connection error
 */
export class RedisConnectionError extends ChatError {
  constructor(operation: string) {
    super(`Redis connection failed during '${operation}'`, 503)
  }
}
