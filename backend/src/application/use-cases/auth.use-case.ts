import jwt, { type SignOptions } from 'jsonwebtoken'
import crypto from 'crypto'
import bcrypt from 'bcrypt'

import { IUserRepository } from '@/domain/repositories/user.repository'
import { IRefreshTokenRepository } from '@/domain/repositories/refresh-token.repository'
import { User, CreateUserData } from '@/domain/entities/user.entity'
import { RefreshToken } from '@/domain/entities/refresh-token.entity'
import { SecurityViolationError } from '@/domain/errors/app.error'
import { getAuthJwtSettings } from '@/domain/config/auth.config'

/**
 * Authentication Use Case - Contains all business logic for authentication
 * This is part of the Application layer in Clean Architecture
 * Orchestrates domain entities and repository interfaces to implement auth features
 */
export class AuthUseCase {
  constructor(
    private userRepository: IUserRepository,
    private refreshTokenRepository: IRefreshTokenRepository,
    private jwtSecret: string,
    private refreshTokenSecret: string
  ) {}

  /**
   * Register a new user in the system
   * @param userData - User registration data
   * @returns Promise containing the created user (without password)
   */
  async registerUser(
    userData: CreateUserData
  ): Promise<Omit<User, 'password'>> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByUsername(
      userData.username
    )

    if (existingUser) {
      throw new Error('User already exists with this username')
    }

    // Check if email is already taken (if provided)
    if (userData.email) {
      const existingEmailUser = await this.userRepository.findByEmail(
        userData.email
      )

      if (existingEmailUser) {
        throw new Error('User already exists with this email')
      }
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    // Create the user
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword
    })

    // Return user without password for security
    const { password, ...userWithoutPassword } = user

    return userWithoutPassword
  }

  /**
   * Authenticate user and generate tokens
   * @param username - User's username
   * @param password - User's password
   * @param context - Optional device context (deviceInfo, ipAddress) for session tracking
   * @returns Promise containing access token, refresh token, and user data
   */
  async loginUser(
    username: string,
    password: string,
    context?: { deviceInfo?: string; ipAddress?: string }
  ): Promise<{
    accessToken: string
    refreshToken: string
    user: Omit<User, 'password'>
  }> {
    // Find user by username
    const user = await this.userRepository.findByUsername(username)
    if (!user) {
      throw new Error('Invalid credentials')
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }

    // Generate access token (short-lived)
    const accessToken = this.generateAccessToken(user)

    // Generate refresh token (long-lived)
    const refreshTokenString = this.generateRefreshTokenString()
    const refreshTokenExpiresAt = new Date()
    refreshTokenExpiresAt.setDate(
      refreshTokenExpiresAt.getDate() +
        getAuthJwtSettings().refreshTokenExpiresDays
    )

    // Store refresh token in database with device context
    await this.refreshTokenRepository.create({
      token: refreshTokenString,
      userId: user.id,
      expiresAt: refreshTokenExpiresAt,
      deviceInfo: context?.deviceInfo ?? '',
      ipAddress: context?.ipAddress ?? ''
    })

    // Return tokens and user data (without password)
    const { password: _, ...userWithoutPassword } = user

    return {
      accessToken,
      refreshToken: refreshTokenString,
      user: userWithoutPassword
    }
  }

  /**
   * Generate a new access token using a valid refresh token
   * @param refreshToken - The refresh token string
   * @param context - Optional device context for the new token
   * @returns Promise containing new access token and optionally new refresh token
   * @throws SecurityViolationError when revoked token is reused (possible token theft)
   */
  async refreshAccessToken(
    refreshToken: string,
    context?: { deviceInfo?: string; ipAddress?: string }
  ): Promise<{
    accessToken: string
    refreshToken?: string // New refresh token (token rotation)
  }> {
    // Find refresh token in database
    const storedRefreshToken =
      await this.refreshTokenRepository.findByToken(refreshToken)

    if (!storedRefreshToken) {
      throw new Error('Invalid refresh token')
    }

    // Suspicious activity: revoked token reuse indicates possible token theft
    if (storedRefreshToken.isRevoked) {
      await this.refreshTokenRepository.revokeAllUserTokens(
        storedRefreshToken.userId
      )
      throw new SecurityViolationError('Security violation detected')
    }

    // Check if token is expired
    if (storedRefreshToken.expiresAt < new Date()) {
      // Clean up expired token
      await this.refreshTokenRepository.delete(storedRefreshToken.id)
      throw new Error('Refresh token has expired')
    }

    // Get user associated with the refresh token
    const user = await this.userRepository.findById(storedRefreshToken.userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Generate new access token
    const accessToken = this.generateAccessToken(user)

    // Implement refresh token rotation for security
    // Revoke the old refresh token
    await this.refreshTokenRepository.revokeToken(refreshToken)

    // Generate new refresh token
    const newRefreshTokenString = this.generateRefreshTokenString()
    const newRefreshTokenExpiresAt = new Date()
    newRefreshTokenExpiresAt.setDate(
      newRefreshTokenExpiresAt.getDate() +
        getAuthJwtSettings().refreshTokenExpiresDays
    )

    // Store new refresh token with device context
    await this.refreshTokenRepository.create({
      token: newRefreshTokenString,
      userId: user.id,
      expiresAt: newRefreshTokenExpiresAt,
      deviceInfo: context?.deviceInfo ?? '',
      ipAddress: context?.ipAddress ?? ''
    })

    return {
      accessToken,
      refreshToken: newRefreshTokenString
    }
  }

  /**
   * Logout user by revoking their refresh token
   * @param refreshToken - The refresh token to revoke
   * @returns Promise indicating success
   */
  async logoutUser(refreshToken: string): Promise<boolean> {
    return await this.refreshTokenRepository.revokeToken(refreshToken)
  }

  /**
   * Logout user from all devices by revoking all their refresh tokens
   * @param userId - User's unique identifier
   * @returns Promise containing number of tokens revoked
   */
  async logoutUserFromAllDevices(userId: string): Promise<number> {
    return await this.refreshTokenRepository.revokeAllUserTokens(userId)
  }

  /**
   * Verify and decode an access token
   * @param accessToken - The access token to verify
   * @returns Promise containing decoded token payload
   */
  async verifyAccessToken(accessToken: string): Promise<any> {
    try {
      return jwt.verify(accessToken, this.jwtSecret)
    } catch (error) {
      throw new Error('Invalid or expired access token')
    }
  }

  /**
   * Clean up expired refresh tokens from the database
   * @returns Promise containing number of tokens cleaned up
   */
  async cleanupExpiredTokens(): Promise<number> {
    return await this.refreshTokenRepository.deleteExpiredTokens()
  }

  /**
   * Get active sessions for a user (non-revoked, non-expired tokens)
   * @param userId - User's unique identifier
   * @returns Promise containing active sessions with device info
   */
  async getActiveSessions(userId: string): Promise<
    Array<{
      id: string
      deviceInfo: string
      ipAddress: string
      lastUsedAt: Date
      createdAt: Date
    }>
  > {
    const tokens = await this.refreshTokenRepository.findByUserId(userId)
    const now = new Date()

    return tokens
      .filter((t: RefreshToken) => !t.isRevoked && t.expiresAt > now)
      .map((t: RefreshToken) => ({
        id: t.id,
        deviceInfo: t.deviceInfo,
        ipAddress: t.ipAddress,
        lastUsedAt: t.lastUsedAt,
        createdAt: t.createdAt
      }))
  }

  /**
   * Generate a JWT access token for a user
   * @param user - User entity
   * @returns JWT access token string
   */
  private generateAccessToken(user: User): string {
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email
    }

    const signOptions: SignOptions = {
      expiresIn: getAuthJwtSettings()
        .accessTokenExpiresIn as SignOptions['expiresIn'],
      issuer: 'your-app-name',
      audience: 'your-app-users'
    }

    return jwt.sign(payload, this.jwtSecret, signOptions)
  }

  /**
   * Generate a cryptographically secure refresh token string
   * @returns Random refresh token string
   */
  private generateRefreshTokenString(): string {
    return crypto.randomBytes(64).toString('hex')
  }
}
