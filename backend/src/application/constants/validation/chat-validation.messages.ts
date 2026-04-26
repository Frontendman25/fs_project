/**
 * Chat Validation Error Messages
 * Centralized error messages to avoid duplication
 * Following Clean Architecture - Application layer (constants/validation)
 * 
 * This file contains all validation error messages for chat-related operations.
 * Messages are centralized here to ensure consistency and avoid duplication.
 */

export const ChatValidationMessages = {
  // UUID validation
  uuid: {
    roomId: 'Room ID must be a valid UUID',
    userId: 'User ID must be a valid UUID',
    senderId: 'Sender ID must be a valid UUID',
    messageId: 'Message ID must be a valid UUID',
    createdBy: 'Created by must be a valid UUID',
    replyTo: 'Reply to message ID must be a valid UUID'
  },

  // String validation
  string: {
    roomNameMin: 'Room name must be at least 3 characters',
    roomNameMax: 'Room name must be at most 50 characters',
    roomNamePattern:
      'Room name can only contain letters, numbers, spaces, hyphens, and underscores',
    descriptionMax: 'Description must be at most 200 characters',
    usernameRequired: 'Username is required',
    usernameMax: 'Username must be at most 50 characters',
    senderUsernameRequired: 'Sender username is required',
    senderUsernameMax: 'Sender username must be at most 50 characters',
    contentRequired: 'Message content cannot be empty',
    contentMax: 'Message content must be at most 4000 characters'
  },

  // Enum validation
  enum: {
    roomType: 'Room type must be either "public" or "private"'
  },

  // URL validation
  url: {
    imageUrl: 'Image URL must be a valid URL'
  }
} as const
