import { Prisma, PrismaClient, User as PrismaUser } from '@prisma/client'

import { IUserRepository } from '@/domain/repositories/user.repository'
import { ILoggerService } from '@/domain/services/logger.service'
import {
  User,
  CreateUserData,
  UpdateUserData
} from '@/domain/entities/user.entity'

/**
 * PostgreSQL User Repository Implementation using Prisma ORM
 * This is part of the Infrastructure layer in Clean Architecture
 * Implements the IUserRepository interface for PostgreSQL database operations
 */
export class PostgreSQLUserRepository implements IUserRepository {
  private logger: ILoggerService

  constructor(
    private prisma: PrismaClient,
    logger: ILoggerService
  ) {
    this.logger = logger.child({ service: 'PostgreSQLUserRepository' })
  }

  /**
   * Find a user by their unique ID
   * @param id - User's unique identifier
   * @returns Promise that resolves to User or null if not found
   */
  async findById(id: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id }
      })

      return user ? this.mapPrismaUserToEntity(user) : null
    } catch (error) {
      this.logger.error({ error, id }, 'Failed to find user by ID')
      throw new Error('Failed to find user by ID')
    }
  }

  /**
   * Find a user by their username
   * @param username - User's username
   * @returns Promise that resolves to User or null if not found
   */
  async findByUsername(username: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { username }
      })

      return user ? this.mapPrismaUserToEntity(user) : null
    } catch (error) {
      this.logger.error({ error, username }, 'Failed to find user by username')
      throw new Error('Failed to find user by username')
    }
  }

  /**
   * Find a user by their email address
   * @param email - User's email address
   * @returns Promise that resolves to User or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email }
      })

      return user ? this.mapPrismaUserToEntity(user) : null
    } catch (error) {
      this.logger.error({ error, email }, 'Failed to find user by email')
      throw new Error('Failed to find user by email')
    }
  }

  /**
   * Create a new user in the database
   * @param userData - Data needed to create a user
   * @returns Promise that resolves to the created User
   */
  async create(userData: CreateUserData): Promise<User> {
    try {
      const user = await this.prisma.user.create({
        data: {
          username: userData.username,
          password: userData.password,
          email: userData.email
        }
      })

      return this.mapPrismaUserToEntity(user)
    } catch (error) {
      this.logger.error({ error, userData }, 'Failed to create user')
      throw new Error('Failed to create user')
    }
  }

  /**
   * Update an existing user
   * @param id - User's unique identifier
   * @param userData - Data to update
   * @returns Promise that resolves to updated User or null if user not found
   */
  async update(id: string, userData: UpdateUserData): Promise<User | null> {
    try {
      // First check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id }
      })

      if (!existingUser) {
        return null
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: this.buildPrismaUpdateData(userData)
      })

      return this.mapPrismaUserToEntity(updatedUser)
    } catch (error) {
      // Handle "Record not found" error
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return null
      }

      // Handle PostgreSQL unique key errors
      if (error instanceof Error && 'code' in error && error.code === '23505') {
        throw new Error('Username or email already exists')
      }

      this.logger.error({ error, id, userData }, 'Failed to update user')
      throw new Error('Failed to update user')
    }
  }

  /**
   * Delete a user from the database
   * @param id - User's unique identifier
   * @returns Promise that resolves to boolean indicating success
   */
  async delete(id: string): Promise<boolean> {
    try {
      // First check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id }
      })

      if (!existingUser) {
        return false
      }

      // Delete the user (this will also cascade delete related refresh tokens)
      await this.prisma.user.delete({
        where: { id }
      })

      return true
    } catch (error) {
      this.logger.error({ error, id }, 'Failed to delete user')
      throw new Error('Failed to delete user')
    }
  }

  /**
   * Get all users (useful for admin operations)
   * @returns Promise that resolves to array of all users
   */
  async findAll(): Promise<User[]> {
    try {
      const users = await this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      })

      return users.map((user: PrismaUser) => this.mapPrismaUserToEntity(user))
    } catch (error) {
      this.logger.error({ error }, 'Failed to find all users')
      throw new Error('Failed to find all users')
    }
  }

  /**
   * Maps domain update payload to Prisma (uses FK relation for avatar).
   */
  private buildPrismaUpdateData(
    userData: UpdateUserData
  ): Prisma.UserUpdateInput {
    const data: Prisma.UserUpdateInput = {
      updatedAt: new Date()
    }

    if (userData.username !== undefined) {
      data.username = userData.username
    }
    if (userData.password !== undefined) {
      data.password = userData.password
    }
    if (userData.email !== undefined) {
      data.email = userData.email
    }
    if (userData.avatarFileId !== undefined) {
      if (userData.avatarFileId === null) {
        data.avatar = { disconnect: true }
      } else {
        data.avatar = { connect: { id: userData.avatarFileId } }
      }
    }

    return data
  }

  /**
   * Map Prisma user object to domain User entity
   * @param prismaUser - User object from Prisma
   * @returns Domain User entity
   */
  private mapPrismaUserToEntity(prismaUser: PrismaUser): User {
    return {
      id: prismaUser.id,
      username: prismaUser.username,
      password: prismaUser.password,
      email: prismaUser.email || undefined,
      avatarFileId: prismaUser.avatarFileId ?? undefined,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt
    }
  }
}
