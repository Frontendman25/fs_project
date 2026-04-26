/**
 * Chat Domain Entities
 * Following Clean Architecture - Domain layer
 * Defines the core business entities for the chat system
 */

export interface ChatRoom {
  id: string
  name: string
  type: 'public' | 'private'
  description?: string
  createdBy: string // User ID
  createdAt: Date
  updatedAt: Date
  memberCount?: number
  isActive: boolean
}

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  senderUsername: string
  content: string
  messageType: 'text' | 'image' | 'file' | 'system'
  metadata?: {
    fileName?: string
    fileSize?: number
    mimeType?: string
    imageUrl?: string
  }
  replyTo?: string // Message ID being replied to
  editedAt?: Date
  deletedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ChatMember {
  id: string
  roomId: string
  userId: string
  username: string
  role: 'admin' | 'moderator' | 'member'
  joinedAt: Date
  lastSeenAt?: Date
  isOnline: boolean
  isTyping: boolean
  typingUntil?: Date
}

export interface ChatTypingIndicator {
  roomId: string
  userId: string
  username: string
  isTyping: boolean
  timestamp: Date
}

export interface ChatNotification {
  id: string
  userId: string
  roomId: string
  messageId: string
  type: 'new_message' | 'mention' | 'room_invite'
  isRead: boolean
  createdAt: Date
}

// DTOs for creating/updating entities
export interface CreateChatRoomData {
  name: string
  type: 'public' | 'private'
  description?: string
  createdBy: string
}

export interface CreateChatMessageData {
  roomId: string
  senderId: string
  senderUsername: string
  content: string
  messageType?: 'text' | 'image' | 'file' | 'system'
  metadata?: ChatMessage['metadata']
  replyTo?: string
}

export interface CreateChatMemberData {
  roomId: string
  userId: string
  username: string
  role?: 'admin' | 'moderator' | 'member'
}

// Query interfaces
export interface ChatMessageQuery {
  roomId: string
  limit?: number
  cursor?: string // For pagination
  before?: Date
  after?: Date
}

export interface ChatRoomQuery {
  userId?: string
  type?: 'public' | 'private'
  limit?: number
  cursor?: string
}

// WebSocket event types
export interface ChatSocketEvents {
  // Client to Server
  join_room: { roomId: string }
  leave_room: { roomId: string }
  send_message: CreateChatMessageData
  typing_start: { roomId: string }
  typing_stop: { roomId: string }
  mark_read: { roomId: string; messageId: string }

  // Server to Client
  message_received: ChatMessage
  user_joined: { roomId: string; user: ChatMember }
  user_left: { roomId: string; userId: string }
  typing_indicator: ChatTypingIndicator
  room_updated: ChatRoom
  error: { message: string; code?: string }
}
