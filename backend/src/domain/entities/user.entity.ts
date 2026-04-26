/**
 * User Entity - Core business object representing a user in our system
 * This is part of the Domain layer in Clean Architecture
 * Contains only business logic and no external dependencies
 */
export interface User {
  id: string
  username: string
  password: string // In real app, this would be hashed
  email?: string
  avatarFileId?: string // Reference to the avatar file
  createdAt: Date
  updatedAt: Date
}

/**
 * Authenticated User - Core business object representing a user who has been authenticated
 * This is part of the Domain layer in Clean Architecture
 * Contains only business logic and no external dependencies
 * @property id - User's unique identifier
 * @property username - User's username
 * @property email - User's email address (optional)
 * @property createdAt - Date user was created (optional, not in JWT)
 * @property updatedAt - Date user was last updated (optional, not in JWT)
 * @property iat - JWT issued at
 * @property exp - JWT expiration time
 */
export interface AuthenticatedUser extends Omit<User, 'password' | 'createdAt' | 'updatedAt'> {
  createdAt?: Date // Optional - not included in JWT token
  updatedAt?: Date // Optional - not included in JWT token
  iat: number // JWT issued at
  exp: number // JWT expiration time
}

/**
 * User creation data - what we need to create a new user
 */
export interface CreateUserData {
  username: string
  password: string
  email?: string
}

/**
 * User update data - what can be updated for a user
 */
export interface UpdateUserData {
  username?: string
  password?: string
  email?: string
  avatarFileId?: string
}
