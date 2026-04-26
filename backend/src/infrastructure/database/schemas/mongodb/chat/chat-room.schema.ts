/**
 * MongoDB ChatRoom Schema
 * Following Clean Architecture - Infrastructure layer
 * Defines Mongoose schema for ChatRoom documents
 */

import mongoose from 'mongoose'

export interface ChatRoomDocument extends mongoose.Document {
  id: string
  name: string
  type: 'public' | 'private'
  description?: string
  createdBy: string
  memberCount: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const ChatRoomSchema = new mongoose.Schema<ChatRoomDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => require('uuid').v4()
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['public', 'private'],
      required: true
    },
    description: {
      type: String,
      trim: true
    },
    createdBy: {
      type: String,
      required: true
    },
    memberCount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'chat_rooms'
  }
)

// Indexes for better query performance
ChatRoomSchema.index({ type: 1 })
ChatRoomSchema.index({ createdBy: 1 })
ChatRoomSchema.index({ createdAt: -1 })

export const ChatRoomModel =
  mongoose.models.ChatRoom ||
  mongoose.model<ChatRoomDocument>('ChatRoom', ChatRoomSchema)


