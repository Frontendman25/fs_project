import { IUserRepository } from '../../../domain/repositories/user.repository'
import { ILoggerService } from '@/domain/services/logger.service'
import {
  User,
  CreateUserData,
  UpdateUserData
} from '../../../domain/entities/user.entity'
import {
  UserDocument,
  UserModel
} from '@/infrastructure/database/schemas/mongodb/user'

/**
 * MongoDB User Repository Implementation using Mongoose ODM
 * This is part of the Infrastructure layer in Clean Architecture
 * Implements the IUserRepository interface for MongoDB database operations
 */
export class MongoDBUserRepository implements IUserRepository {
  private logger: ILoggerService

  constructor(logger: ILoggerService) {
    this.logger = logger.child({ service: 'MongoDBUserRepository' })
  }

  /**
   * Find a user by their unique ID
   * @param id - User's unique identifier
   * @returns Promise that resolves to User or null if not found
   */
  async findById(id: string): Promise<User | null> {
    try {
      const user = await UserModel.findById(id).exec()
      return user ? this.mapMongoUserToEntity(user) : null
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
      const user = await UserModel.findOne({ username }).exec()
      return user ? this.mapMongoUserToEntity(user) : null
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
      const user = await UserModel.findOne({ email }).exec()
      return user ? this.mapMongoUserToEntity(user) : null
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
      const user = new UserModel({
        username: userData.username,
        password: userData.password,
        email: userData.email
      })

      const savedUser = await user.save()
      return this.mapMongoUserToEntity(savedUser)
    } catch (error) {
      this.logger.error({ error, userData }, 'Failed to create user')

      // Handle MongoDB duplicate key errors
      if (error instanceof Error && 'code' in error && error.code === 11000) {
        throw new Error('User already exists with this username or email')
      }

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
      const updateData: Record<string, unknown> = {
        updatedAt: new Date()
      }
      if (userData.username) updateData.username = userData.username
      if (userData.password) updateData.password = userData.password
      if (userData.email !== undefined) updateData.email = userData.email
      if (userData.avatarFileId === null) {
        updateData.$unset = { avatarFileId: '' }
      } else if (userData.avatarFileId !== undefined) {
        updateData.avatarFileId = userData.avatarFileId
      }

      const updatedUser = await UserModel.findByIdAndUpdate(id, updateData, {
        new: true, // Return the updated document
        runValidators: true // Run schema validators
      }).exec()

      return updatedUser ? this.mapMongoUserToEntity(updatedUser) : null
    } catch (error) {
      this.logger.error({ error, id, userData }, 'Failed to update user')

      // Handle MongoDB duplicate key errors
      if (error instanceof Error && 'code' in error && error.code === 11000) {
        throw new Error('Username or email already exists')
      }

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
      const result = await UserModel.findByIdAndDelete(id).exec()
      return result !== null
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
      const users = await UserModel.find({})
        .sort({ createdAt: -1 }) // Sort by creation date, newest first
        .exec()

      return users.map((user: UserDocument) => this.mapMongoUserToEntity(user))
    } catch (error) {
      this.logger.error({ error }, 'Failed to find all users')
      throw new Error('Failed to find all users')
    }
  }

  /**
   * Map MongoDB user document to domain User entity
   * @param mongoUser - User document from MongoDB
   * @returns Domain User entity
   */
  private mapMongoUserToEntity(mongoUser: UserDocument): User {
    return {
      id: mongoUser._id.toString(), // Convert ObjectId to string
      username: mongoUser.username,
      password: mongoUser.password,
      email: mongoUser.email,
      avatarFileId: mongoUser.avatarFileId,
      createdAt: mongoUser.createdAt,
      updatedAt: mongoUser.updatedAt
    }
  }
}
