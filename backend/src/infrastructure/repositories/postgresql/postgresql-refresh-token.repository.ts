import { PrismaClient } from '@prisma/client'

import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository'
import { ILoggerService } from '@/domain/services/logger.service'
import {
  RefreshToken,
  CreateRefreshTokenData,
  UpdateRefreshTokenData
} from '../../../domain/entities/refresh-token.entity'

/**
 * PostgreSQL RefreshToken Repository Implementation using Prisma ORM
 * This is part of the Infrastructure layer in Clean Architecture
 * Implements the IRefreshTokenRepository interface for PostgreSQL database operations
 */
export class PostgreSQLRefreshTokenRepository implements IRefreshTokenRepository {
  private logger: ILoggerService

  constructor(
    private prisma: PrismaClient,
    logger: ILoggerService
  ) {
    this.logger = logger.child({ service: 'PostgreSQLRefreshTokenRepository' })
  }

  /**
   * Find a refresh token by its token string
   * @param token - The refresh token string
   * @returns Promise that resolves to RefreshToken or null if not found
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    try {
      const refreshToken = await this.prisma.refreshToken.findUnique({
        where: { token }
      })

      return refreshToken ? this.mapPrismaTokenToEntity(refreshToken) : null
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
      const refreshToken = await this.prisma.refreshToken.findUnique({
        where: { id }
      })

      return refreshToken ? this.mapPrismaTokenToEntity(refreshToken) : null
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
      const refreshTokens = await this.prisma.refreshToken.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      return refreshTokens.map((token) => this.mapPrismaTokenToEntity(token))
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
      const refreshToken = await this.prisma.refreshToken.create({
        data: {
          token: tokenData.token,
          userId: tokenData.userId,
          expiresAt: tokenData.expiresAt,
          isRevoked: false,
          deviceInfo: tokenData.deviceInfo ?? '',
          ipAddress: tokenData.ipAddress ?? ''
        }
      })

      return this.mapPrismaTokenToEntity(refreshToken)
    } catch (error) {
      this.logger.error({ error, tokenData }, 'Failed to create refresh token')
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
      // First check if refresh token exists
      const existingToken = await this.prisma.refreshToken.findUnique({
        where: { id }
      })

      if (!existingToken) {
        return null
      }

      // Update the refresh token
      const updatedToken = await this.prisma.refreshToken.update({
        where: { id },
        data: {
          ...(tokenData.isRevoked !== undefined && {
            isRevoked: tokenData.isRevoked
          }),
          ...(tokenData.expiresAt && { expiresAt: tokenData.expiresAt }),
          ...(tokenData.lastUsedAt && { lastUsedAt: tokenData.lastUsedAt }),
          updatedAt: new Date()
        }
      })

      return this.mapPrismaTokenToEntity(updatedToken)
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
      // First check if refresh token exists
      const existingToken = await this.prisma.refreshToken.findUnique({
        where: { id }
      })

      if (!existingToken) {
        return false
      }

      // Delete the refresh token
      await this.prisma.refreshToken.delete({
        where: { id }
      })

      return true
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
      // Find and update the token to mark it as revoked
      const result = await this.prisma.refreshToken.updateMany({
        where: {
          token,
          isRevoked: false // Only revoke if not already revoked
        },
        data: {
          isRevoked: true,
          updatedAt: new Date()
        }
      })

      return result.count > 0
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
      const result = await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          isRevoked: false // Only revoke tokens that aren't already revoked
        },
        data: {
          isRevoked: true,
          updatedAt: new Date()
        }
      })

      return result.count
    } catch (error) {
      this.logger.error({ error, userId }, 'Failed to revoke all user tokens')
      throw new Error('Failed to revoke all user tokens')
    }
  }

  /**
   * Clean up expired refresh tokens from the database
   * @returns Promise that resolves to number of tokens deleted
   */
  async deleteExpiredTokens(): Promise<number> {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date() // Less than current date (expired)
          }
        }
      })

      return result.count
    } catch (error) {
      this.logger.error({ error }, 'Failed to delete expired tokens')
      throw new Error('Failed to delete expired tokens')
    }
  }

  /**
   * Map Prisma refresh token object to domain RefreshToken entity
   * @param prismaToken - RefreshToken object from Prisma
   * @returns Domain RefreshToken entity
   */
  private mapPrismaTokenToEntity(prismaToken: any): RefreshToken {
    return {
      id: prismaToken.id,
      token: prismaToken.token,
      userId: prismaToken.userId,
      expiresAt: prismaToken.expiresAt,
      isRevoked: prismaToken.isRevoked,
      deviceInfo: prismaToken.deviceInfo ?? '',
      ipAddress: prismaToken.ipAddress ?? '',
      lastUsedAt: prismaToken.lastUsedAt ?? prismaToken.createdAt,
      createdAt: prismaToken.createdAt,
      updatedAt: prismaToken.updatedAt
    }
  }
}
