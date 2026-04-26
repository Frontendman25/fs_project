import mongoose, { Document, Schema, Types } from 'mongoose'

import { IRefreshTokenRepository } from '@/domain/repositories/refresh-token.repository'
import { ILoggerService } from '@/domain/services/logger.service'
import {
  RefreshToken,
  CreateRefreshTokenData,
  UpdateRefreshTokenData
} from '@/domain/entities/refresh-token.entity'

/**
 * MongoDB RefreshToken Document Interface - Extends Mongoose Document
 * This represents how refresh token data is stored in MongoDB
 */
interface IRefreshTokenDocument extends Document {
  _id: Types.ObjectId
  token: string
  userId: string
  expiresAt: Date
  isRevoked: boolean
  updatedAt: Date
  createdAt: Date
  deviceInfo: string
  ipAddress: string
  lastUsedAt: Date
}

/**
 * MongoDB RefreshToken Schema Definition
 * Defines the structure and validation rules for refresh token documents in MongoDB
 */
const RefreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    token: {
      type: String,
      required: true,
      unique: true
    },
    userId: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    isRevoked: {
      type: Boolean,
      default: false
    },
    deviceInfo: {
      type: String,
      default: ''
    },
    ipAddress: {
      type: String,
      default: ''
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt
  }
)

// Create compound indexes for better query performance
RefreshTokenSchema.index({ userId: 1, isRevoked: 1 })
RefreshTokenSchema.index({ expiresAt: 1, isRevoked: 1 })

// TTL (Time To Live) index to automatically delete expired tokens
// This will automatically remove documents where expiresAt is in the past
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

/**
 * MongoDB RefreshToken Model
 */
const RefreshTokenModel = mongoose.model<IRefreshTokenDocument>(
  'RefreshToken',
  RefreshTokenSchema,
  'refresh_tokens'
)

/**
 * MongoDB RefreshToken Repository Implementation using Mongoose ODM
 * This is part of the Infrastructure layer in Clean Architecture
 * Implements the IRefreshTokenRepository interface for MongoDB database operations
 */
export class MongoDBRefreshTokenRepository implements IRefreshTokenRepository {
  private logger: ILoggerService

  constructor(logger: ILoggerService) {
    this.logger = logger.child({ service: 'MongoDBRefreshTokenRepository' })
  }

  /**
   * Find a refresh token by its token string
   * @param token - The refresh token string
   * @returns Promise that resolves to RefreshToken or null if not found
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    try {
      const refreshToken = await RefreshTokenModel.findOne({ token }).exec()
      return refreshToken ? this.mapMongoTokenToEntity(refreshToken) : null
    } catch (error) {
      this.logger.error(
        { error, token },
        'Failed to find refresh token by token'
      )
      throw new Error('Failed to find refresh token by token')
    }
  }

  /**
   * Find a refresh token by its unique ID
   * @param id - RefreshToken's unique identifier
   * @returns Promise that resolves to RefreshToken or null if not found
   */
  async findById(id: string): Promise<RefreshToken | null> {
    try {
      const refreshToken = await RefreshTokenModel.findById(id).exec()
      return refreshToken ? this.mapMongoTokenToEntity(refreshToken) : null
    } catch (error) {
      this.logger.error({ error, id }, 'Failed to find refresh token by ID')
      throw new Error('Failed to find refresh token by ID')
    }
  }

  /**
   * Find all refresh tokens for a specific user
   * @param userId - User's unique identifier
   * @returns Promise that resolves to array of RefreshTokens
   */
  async findByUserId(userId: string): Promise<RefreshToken[]> {
    try {
      const refreshTokens = await RefreshTokenModel.find({ userId })
        .sort({ createdAt: -1 }) // Sort by creation date, newest first
        .exec()

      return refreshTokens.map((token: IRefreshTokenDocument) =>
        this.mapMongoTokenToEntity(token)
      )
    } catch (error) {
      this.logger.error(
        { error, userId },
        'Failed to find refresh tokens by user ID'
      )
      throw new Error('Failed to find refresh tokens by user ID')
    }
  }

  /**
   * Create a new refresh token in the database
   * @param tokenData - Data needed to create a refresh token
   * @returns Promise that resolves to the created RefreshToken
   */
  async create(tokenData: CreateRefreshTokenData): Promise<RefreshToken> {
    try {
      const refreshToken = new RefreshTokenModel({
        token: tokenData.token,
        userId: tokenData.userId,
        expiresAt: tokenData.expiresAt,
        isRevoked: false,
        deviceInfo: tokenData.deviceInfo ?? '',
        ipAddress: tokenData.ipAddress ?? ''
      })

      const savedToken = await refreshToken.save()

      return this.mapMongoTokenToEntity(savedToken)
    } catch (error) {
      this.logger.error({ error, tokenData }, 'Failed to create refresh token')

      // Handle MongoDB duplicate key errors
      if (error instanceof Error && 'code' in error && error.code === 11000) {
        throw new Error('Refresh token already exists')
      }

      throw new Error('Failed to create refresh token')
    }
  }

  /**
   * Update an existing refresh token
   * @param id - RefreshToken's unique identifier
   * @param tokenData - Data to update
   * @returns Promise that resolves to updated RefreshToken or null if not found
   */
  async update(
    id: string,
    tokenData: UpdateRefreshTokenData
  ): Promise<RefreshToken | null> {
    try {
      // Prepare update data, only include fields that are provided
      const updateData: Record<string, unknown> = {}
      if (tokenData.isRevoked !== undefined)
        updateData.isRevoked = tokenData.isRevoked
      if (tokenData.expiresAt) updateData.expiresAt = tokenData.expiresAt
      if (tokenData.lastUsedAt) updateData.lastUsedAt = tokenData.lastUsedAt

      // Add updatedAt timestamp
      updateData.updatedAt = new Date()

      const updatedToken = await RefreshTokenModel.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true, // Return the updated document
          runValidators: true // Run schema validators
        }
      ).exec()

      return updatedToken ? this.mapMongoTokenToEntity(updatedToken) : null
    } catch (error) {
      this.logger.error(
        { error, id, tokenData },
        'Failed to update refresh token'
      )
      throw new Error('Failed to update refresh token')
    }
  }

  /**
   * Delete a refresh token from the database
   * @param id - RefreshToken's unique identifier
   * @returns Promise that resolves to boolean indicating success
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await RefreshTokenModel.findByIdAndDelete(id).exec()
      return result !== null
    } catch (error) {
      this.logger.error({ error, id }, 'Failed to delete refresh token')
      throw new Error('Failed to delete refresh token')
    }
  }

  /**
   * Revoke (mark as invalid) a refresh token
   * @param token - The refresh token string to revoke
   * @returns Promise that resolves to boolean indicating success
   */
  async revokeToken(token: string): Promise<boolean> {
    try {
      const result = await RefreshTokenModel.updateOne(
        {
          token,
          isRevoked: false // Only revoke if not already revoked
        },
        {
          isRevoked: true,
          updatedAt: new Date()
        }
      ).exec()

      return result.modifiedCount > 0
    } catch (error) {
      this.logger.error({ error, token }, 'Failed to revoke refresh token')
      throw new Error('Failed to revoke refresh token')
    }
  }

  /**
   * Revoke all refresh tokens for a specific user
   * @param userId - User's unique identifier
   * @returns Promise that resolves to number of tokens revoked
   */
  async revokeAllUserTokens(userId: string): Promise<number> {
    try {
      const result = await RefreshTokenModel.updateMany(
        {
          userId,
          isRevoked: false // Only revoke tokens that aren't already revoked
        },
        {
          isRevoked: true,
          updatedAt: new Date()
        }
      ).exec()

      return result.modifiedCount
    } catch (error) {
      this.logger.error({ error, userId }, 'Failed to revoke all user tokens')
      throw new Error('Failed to revoke all user tokens')
    }
  }

  /**
   * Clean up expired refresh tokens from the database
   * Note: MongoDB TTL index should handle this automatically, but this method
   * provides manual cleanup capability if needed
   * @returns Promise that resolves to number of tokens deleted
   */
  async deleteExpiredTokens(): Promise<number> {
    try {
      const result = await RefreshTokenModel.deleteMany({
        expiresAt: {
          $lt: new Date() // Less than current date (expired)
        }
      }).exec()

      return result.deletedCount || 0
    } catch (error) {
      this.logger.error({ error }, 'Failed to delete expired tokens')
      throw new Error('Failed to delete expired tokens')
    }
  }

  /**
   * Map MongoDB refresh token document to domain RefreshToken entity
   * @param mongoToken - RefreshToken document from MongoDB
   * @returns Domain RefreshToken entity
   */
  private mapMongoTokenToEntity(
    mongoToken: IRefreshTokenDocument
  ): RefreshToken {
    return {
      id: mongoToken._id.toString(), // Convert ObjectId to string
      token: mongoToken.token,
      userId: mongoToken.userId,
      expiresAt: mongoToken.expiresAt,
      isRevoked: mongoToken.isRevoked,
      deviceInfo: mongoToken.deviceInfo ?? '',
      ipAddress: mongoToken.ipAddress ?? '',
      lastUsedAt: mongoToken.lastUsedAt ?? mongoToken.createdAt,
      createdAt: mongoToken.createdAt,
      updatedAt: mongoToken.updatedAt
    }
  }
}

// Export the model for potential use in other parts of the application
export { RefreshTokenModel }
