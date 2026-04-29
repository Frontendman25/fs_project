/**
 * MongoDB ChatMember Schema
 * Following Clean Architecture - Infrastructure layer
 * Defines Mongoose schema for ChatMember documents
 */

import mongoose from 'mongoose'

export interface ChatMemberDocument extends mongoose.Document {
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

const ChatMemberSchema = new mongoose.Schema<ChatMemberDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => require('uuid').v4()
    },
    roomId: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeenAt: {
      type: Date
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    isTyping: {
      type: Boolean,
      default: false
    },
    typingUntil: {
      type: Date
    }
  },
  {
    timestamps: false,
    collection: 'chat_members'
  }
)

// Unique constraint: one user can only be a member once per room
ChatMemberSchema.index({ userId: 1 })
ChatMemberSchema.index({ isOnline: 1 })
ChatMemberSchema.index({ roomId: 1, userId: 1 }, { unique: true })

export const ChatMemberModel =
  mongoose.models.ChatMember ||
  mongoose.model<ChatMemberDocument>('ChatMember', ChatMemberSchema)
