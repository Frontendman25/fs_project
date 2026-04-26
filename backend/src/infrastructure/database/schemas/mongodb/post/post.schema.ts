import mongoose, { Schema, Document } from 'mongoose'

/**
 * Post Document Interface - Mongoose document type
 * Following Clean Architecture - Infrastructure layer (schemas subfolder)
 */
export interface IPostDocument extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  content: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Post Schema - Mongoose schema for MongoDB
 * Denormalized style with userId as ObjectId
 * Optimized for cursor pagination and search
 */
const PostSchema = new Schema<IPostDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000 // Reasonable limit for post content
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'posts'
  }
)

// Compound index for efficient cursor pagination
PostSchema.index({ userId: 1, createdAt: -1 })

// Text index for content search (optional)
PostSchema.index({ content: 'text' })

/**
 * Post Model - Mongoose model for posts
 */
export const PostModel = mongoose.model<IPostDocument>('Post', PostSchema)


