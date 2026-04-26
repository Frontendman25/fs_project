/**
 * MongoDB ChatNotification Schema
 * Following Clean Architecture - Infrastructure layer
 * Defines Mongoose schema for ChatNotification documents
 */

import mongoose from 'mongoose'

export interface ChatNotificationDocument extends mongoose.Document {
  id: string
  userId: string
  roomId: string
  messageId: string
  type: 'new_message' | 'mention' | 'room_invite'
  isRead: boolean
  createdAt: Date
}

const ChatNotificationSchema = new mongoose.Schema<ChatNotificationDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => require('uuid').v4()
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    roomId: {
      type: String,
      required: true,
      index: true
    },
    messageId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['new_message', 'mention', 'room_invite'],
      required: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'chat_notifications'
  }
)

// Indexes for better query performance
ChatNotificationSchema.index({ userId: 1, createdAt: -1 })
ChatNotificationSchema.index({ roomId: 1 })
ChatNotificationSchema.index({ isRead: 1 })

export const ChatNotificationModel =
  mongoose.models.ChatNotification ||
  mongoose.model<ChatNotificationDocument>(
    'ChatNotification',
    ChatNotificationSchema
  )


