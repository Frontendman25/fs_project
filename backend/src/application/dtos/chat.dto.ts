/**
 * Chat DTOs - Validation schemas for chat-related operations
 * Following Clean Architecture - Application layer
 * Defines input contracts for ChatUseCases
 */

import { z } from 'zod'

import { ChatValidationMessages } from '@/application/constants/validation/chat-validation.messages'

/**
 * Chat Room DTOs
 */
export const CreateChatRoomDTOSchema = z.object({
  name: z
    .string()
    .min(3, ChatValidationMessages.string.roomNameMin)
    .max(50, ChatValidationMessages.string.roomNameMax)
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      ChatValidationMessages.string.roomNamePattern
    ),
  type: z.enum(['public', 'private'], {
    error: ChatValidationMessages.enum.roomType
  }),
  description: z
    .string()
    .max(200, ChatValidationMessages.string.descriptionMax)
    .optional(),
  createdBy: z.uuid({ error: ChatValidationMessages.uuid.createdBy })
})

export const UpdateChatRoomDTOSchema = z.object({
  name: z
    .string()
    .min(3, ChatValidationMessages.string.roomNameMin)
    .max(50, ChatValidationMessages.string.roomNameMax)
    .regex(/^[a-zA-Z0-9\s\-_]+$/, ChatValidationMessages.string.roomNamePattern)
    .optional(),
  description: z
    .string()
    .max(200, ChatValidationMessages.string.descriptionMax)
    .optional(),
  isActive: z.boolean().optional()
})

/**
 * Chat Message DTOs
 */
export const CreateChatMessageDTOSchema = z.object({
  roomId: z.uuid({ error: ChatValidationMessages.uuid.roomId }),
  senderId: z.uuid({ error: ChatValidationMessages.uuid.senderId }),
  senderUsername: z
    .string()
    .min(1, ChatValidationMessages.string.senderUsernameRequired)
    .max(50, ChatValidationMessages.string.senderUsernameMax),
  content: z
    .string()
    .min(1, ChatValidationMessages.string.contentRequired)
    .max(4000, ChatValidationMessages.string.contentMax),
  messageType: z.enum(['text', 'image', 'file', 'system']).default('text'),
  metadata: z
    .object({
      fileName: z.string().optional(),
      fileSize: z.number().positive().optional(),
      mimeType: z.string().optional(),
      imageUrl: z
        .url({ message: ChatValidationMessages.url.imageUrl })
        .optional()
    })
    .optional(),
  replyTo: z.uuid({ error: ChatValidationMessages.uuid.replyTo }).optional()
})

export const UpdateChatMessageDTOSchema = z.object({
  content: z
    .string()
    .min(1, ChatValidationMessages.string.contentRequired)
    .max(4000, ChatValidationMessages.string.contentMax)
    .optional(),
  metadata: z
    .object({
      fileName: z.string().optional(),
      fileSize: z.number().positive().optional(),
      mimeType: z.string().optional(),
      imageUrl: z
        .url({ message: ChatValidationMessages.url.imageUrl })
        .optional()
    })
    .optional()
})

/**
 * Chat Member DTOs
 */
export const CreateChatMemberDTOSchema = z.object({
  roomId: z.uuid({ error: ChatValidationMessages.uuid.roomId }),
  userId: z.uuid({ error: ChatValidationMessages.uuid.userId }),
  username: z
    .string()
    .min(1, ChatValidationMessages.string.usernameRequired)
    .max(50, ChatValidationMessages.string.usernameMax),
  role: z.enum(['admin', 'moderator', 'member']).default('member')
})

export const UpdateChatMemberDTOSchema = z.object({
  role: z.enum(['admin', 'moderator', 'member']).optional(),
  isOnline: z.boolean().optional(),
  isTyping: z.boolean().optional()
})

/**
 * Chat Notification DTOs
 */
export const CreateChatNotificationDTOSchema = z.object({
  userId: z.uuid({ error: ChatValidationMessages.uuid.userId }),
  roomId: z.uuid({ error: ChatValidationMessages.uuid.roomId }),
  messageId: z.uuid({ error: ChatValidationMessages.uuid.messageId }),
  type: z.enum(['new_message', 'mention', 'room_invite']),
  isRead: z.boolean().default(false)
})

/**
 * Query DTOs
 */
export const ChatRoomQueryDTOSchema = z.object({
  userId: z.uuid({ error: ChatValidationMessages.uuid.userId }).optional(),
  type: z.enum(['public', 'private']).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional()
})

export const ChatMessageQueryDTOSchema = z.object({
  roomId: z.uuid({ error: ChatValidationMessages.uuid.roomId }),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
  before: z.coerce.date().optional(),
  after: z.coerce.date().optional()
})

/**
 * Socket Event DTOs
 */
export const SocketAuthenticateDTOSchema = z.object({
  userId: z.uuid({ error: ChatValidationMessages.uuid.userId })
})

export const SocketJoinRoomDTOSchema = z.object({
  roomId: z.uuid({ error: ChatValidationMessages.uuid.roomId })
})

export const SocketTypingDTOSchema = z.object({
  roomId: z.uuid({ error: ChatValidationMessages.uuid.roomId })
})

export const SocketMarkReadDTOSchema = z.object({
  roomId: z.uuid({ error: ChatValidationMessages.uuid.roomId }),
  messageId: z.uuid({ error: ChatValidationMessages.uuid.messageId })
})

/**
 * Type exports for use in other layers
 */
export type CreateChatRoomDTO = z.infer<typeof CreateChatRoomDTOSchema>
export type UpdateChatRoomDTO = z.infer<typeof UpdateChatRoomDTOSchema>
export type CreateChatMessageDTO = z.infer<typeof CreateChatMessageDTOSchema>
export type UpdateChatMessageDTO = z.infer<typeof UpdateChatMessageDTOSchema>
export type CreateChatMemberDTO = z.infer<typeof CreateChatMemberDTOSchema>
export type UpdateChatMemberDTO = z.infer<typeof UpdateChatMemberDTOSchema>
export type CreateChatNotificationDTO = z.infer<
  typeof CreateChatNotificationDTOSchema
>
export type ChatRoomQueryDTO = z.infer<typeof ChatRoomQueryDTOSchema>
export type ChatMessageQueryDTO = z.infer<typeof ChatMessageQueryDTOSchema>
export type SocketAuthenticateDTO = z.infer<typeof SocketAuthenticateDTOSchema>
export type SocketJoinRoomDTO = z.infer<typeof SocketJoinRoomDTOSchema>
export type SocketTypingDTO = z.infer<typeof SocketTypingDTOSchema>
export type SocketMarkReadDTO = z.infer<typeof SocketMarkReadDTOSchema>
