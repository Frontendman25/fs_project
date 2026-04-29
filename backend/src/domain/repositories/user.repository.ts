import {
  User,
  CreateUserData,
  UpdateUserData
} from '@/domain/entities/user.entity'

/**
 * User Repository Interface - Defines contract for user data access
 * This is part of the Domain layer in Clean Architecture
 * This interface allows us to switch between different database implementations
 * (PostgreSQL with Prisma, MongoDB with Mongoose, etc.) without changing business logic
 */
export interface IUserRepository {
  /**
   * Find a user by their unique ID
   * @param id - User's unique identifier
   * @returns Promise that resolves to User or null if not found
   */
  findById(id: string): Promise<User | null>

  /**
   * Find a user by their username
   * @param username - User's username
   * @returns Promise that resolves to User or null if not found
   */
  findByUsername(username: string): Promise<User | null>

  /**
   * Find a user by their email address
   * @param email - User's email address
   * @returns Promise that resolves to User or null if not found
   */
  findByEmail(email: string): Promise<User | null>

  /**
   * Create a new user in the database
   * @param userData - Data needed to create a user
   * @returns Promise that resolves to the created User
   */
  create(userData: CreateUserData): Promise<User>

  /**
   * Update an existing user
   * @param id - User's unique identifier
   * @param userData - Data to update
   * @returns Promise that resolves to updated User or null if user not found
   */
  update(id: string, userData: UpdateUserData): Promise<User | null>

  /**
   * Delete a user from the database
   * @param id - User's unique identifier
   * @returns Promise that resolves to boolean indicating success
   */
  delete(id: string): Promise<boolean>

  /**
   * Get all users (useful for admin operations)
   * @returns Promise that resolves to array of all users
   */
  findAll(): Promise<User[]>
}
