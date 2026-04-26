import { Request, Response } from 'express'

import { AuthUseCase } from '@/application/use-cases/auth.use-case'
import { GetUserWithAvatarUseCase } from '@/application/use-cases/user/get-user-with-avatar.use-case'
import { IDatabaseFactory } from '@/domain/repositories/database.factory'
import { SecurityViolationError } from '@/domain/errors/app.error'

import { extractDeviceContext } from '@/presentation/utils/requestContext'

/**
 * Authentication Controller - Handles HTTP requests for authentication
 * This is part of the Presentation layer in Clean Architecture
 * Responsible for handling HTTP requests/responses and delegating business logic to use cases
 */
export class AuthController {
  private authUseCase: AuthUseCase
  private getUserWithAvatar: GetUserWithAvatarUseCase

  constructor(
    databaseFactory: IDatabaseFactory,
    getUserWithAvatar: GetUserWithAvatarUseCase,
    jwtSecret: string,
    refreshTokenSecret: string
  ) {
    // Initialize the auth use case with repository dependencies
    this.authUseCase = new AuthUseCase(
      databaseFactory.getUserRepository(),
      databaseFactory.getRefreshTokenRepository(),
      jwtSecret,
      refreshTokenSecret
    )
    this.getUserWithAvatar = getUserWithAvatar
  }

  /**
   * Handle user registration
   * POST /auth/register
   * @param req - Express request object
   * @param res - Express response object
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password, email } = req.body

      // Validate required fields
      if (!username || !password) {
        res.status(400).json({
          success: false,
          message: 'Username and password are required'
        })

        return
      }

      // Validate username length
      if (username.length < 3) {
        res.status(400).json({
          success: false,
          message: 'Username must be at least 3 characters long'
        })

        return
      }

      // Validate password strength
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        })

        return
      }

      // Call use case to register user
      const user = await this.authUseCase.registerUser({
        username,
        password,
        email
      })

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt
          }
        }
      })
    } catch (error) {
      console.error('Registration error:', error)

      // Handle specific error messages
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          res.status(409).json({
            success: false,
            message: error.message
          })

          return
        }
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      })
    }
  }

  /**
   * Handle user login
   * POST /auth/login
   * @param req - Express request object
   * @param res - Express response object
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body

      // Validate required fields
      if (!username || !password) {
        res.status(400).json({
          success: false,
          message: 'Username and password are required'
        })
        return
      }

      // Call use case to authenticate user with device context
      const context = extractDeviceContext(req)
      const result = await this.authUseCase.loginUser(
        username,
        password,
        context
      )

      // Set refresh token as httpOnly cookie for security
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true, // Prevents XSS attacks
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict', // CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        path: '/auth' // Limit cookie scope to auth routes
      })

      const userWithAvatar = await this.getUserWithAvatar.execute(
        result.user.id
      )

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          accessToken: result.accessToken,
          user: userWithAvatar
            ? {
                id: userWithAvatar.id,
                username: userWithAvatar.username,
                email: userWithAvatar.email,
                avatarUrl: userWithAvatar.avatarUrl
              }
            : {
                id: result.user.id,
                username: result.user.username,
                email: result.user.email,
                avatarUrl: null
              }
        }
      })
    } catch (error) {
      console.error('Login error:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      })

      // Handle specific error messages
      if (
        error instanceof Error &&
        error.message.includes('Invalid credentials')
      ) {
        res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        })
        return
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error during login',
        error:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : undefined
      })
    }
  }

  /**
   * Handle token refresh
   * POST /auth/refresh
   * @param req - Express request object
   * @param res - Express response object
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      // Get refresh token from httpOnly cookie
      const refreshToken = req.cookies.refreshToken

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: 'Refresh token not provided'
        })
        return
      }

      // Call use case to refresh access token with device context
      const context = extractDeviceContext(req)
      const result = await this.authUseCase.refreshAccessToken(
        refreshToken,
        context
      )

      // If a new refresh token was generated (token rotation), update the cookie
      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/auth'
        })
      }

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken
        }
      })
    } catch (error) {
      console.error('Token refresh error:', error)

      // Clear the refresh token cookie if it's invalid
      res.clearCookie('refreshToken', { path: '/auth' })

      // Security violation: revoked token reuse (possible theft)
      if (error instanceof SecurityViolationError) {
        res.status(401).json({
          success: false,
          message:
            'Security violation detected. All sessions have been revoked.',
          error: 'SECURITY_VIOLATION'
        })
        return
      }

      // Handle specific error messages
      if (error instanceof Error) {
        if (
          error.message.includes('Invalid') ||
          error.message.includes('expired') ||
          error.message.includes('revoked')
        ) {
          res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token'
          })
          return
        }
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error during token refresh'
      })
    }
  }

  /**
   * Handle user logout
   * POST /auth/logout
   * @param req - Express request object
   * @param res - Express response object
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken

      // If refresh token exists, revoke it
      if (refreshToken) {
        await this.authUseCase.logoutUser(refreshToken)
      }

      // Clear the refresh token cookie
      res.clearCookie('refreshToken', { path: '/auth' })

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      })
    } catch (error) {
      console.error('Logout error:', error)

      // Even if there's an error revoking the token, clear the cookie
      res.clearCookie('refreshToken', { path: '/auth' })

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      })
    }
  }

  /**
   * Handle logout from all devices
   * POST /auth/logout-all
   * @param req - Express request object
   * @param res - Express response object
   */
  logoutFromAllDevices = async (req: Request, res: Response): Promise<void> => {
    try {
      // Get user ID from the authenticated request
      const userId = req?.user?.id

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
        return
      }

      // Revoke all refresh tokens for the user
      const revokedCount =
        await this.authUseCase.logoutUserFromAllDevices(userId)

      // Clear the refresh token cookie
      res.clearCookie('refreshToken', { path: '/auth' })

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully',
        data: {
          revokedTokensCount: revokedCount
        }
      })
    } catch (error) {
      console.error('Logout from all devices error:', error)

      res.status(500).json({
        success: false,
        message: 'Internal server error during logout from all devices'
      })
    }
  }

  /**
   * Get active sessions for the current user (protected route)
   * GET /auth/sessions
   */
  getActiveSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req?.user?.id

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
        return
      }

      const sessions = await this.authUseCase.getActiveSessions(userId)

      res.status(200).json({
        success: true,
        data: { sessions }
      })
    } catch (error) {
      console.error('Get active sessions error:', error)

      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving sessions'
      })
    }
  }

  /**
   * Get user profile (protected route)
   * GET /auth/profile
   * @param req - Express request object
   * @param res - Express response object
   */
  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      // User information is already attached to request by auth middleware
      const user = (req as any).user

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      })
    } catch (error) {
      console.error('Get profile error:', error)

      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving profile'
      })
    }
  }
}
