/**
 * MongoDB ChatMessage Schema
 * Following Clean Architecture - Infrastructure layer
 * Defines Mongoose schema for ChatMessage documents
 */

import mongoose from 'mongoose'

export interface ChatMessageDocument extends mongoose.Document {
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
  replyTo?: string
  editedAt?: Date
  deletedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const ChatMessageSchema = new mongoose.Schema<ChatMessageDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => require('uuid').v4()
    },
    roomId: {
      type: String,
      required: true,
      index: true
    },
    senderId: {
      type: String,
      required: true
    },
    senderUsername: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    replyTo: {
      type: String
    },
    editedAt: {
      type: Date
    },
    deletedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: 'chat_messages'
  }
)

// Indexes for better query performance
ChatMessageSchema.index({ roomId: 1, createdAt: -1 })
ChatMessageSchema.index({ senderId: 1 })
ChatMessageSchema.index({ replyTo: 1 })

export const ChatMessageModel =
  mongoose.models.ChatMessage ||
  mongoose.model<ChatMessageDocument>('ChatMessage', ChatMessageSchema)
