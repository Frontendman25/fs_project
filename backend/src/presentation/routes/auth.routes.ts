import { Router } from 'express'

import { AuthController } from '../controllers/auth.controller'
import { AuthMiddleware } from '../middleware/auth.middleware'
import { GetUserWithAvatarUseCase } from '../../application/use-cases/user/get-user-with-avatar.use-case'
import { IDatabaseFactory } from '../../domain/repositories/database.factory'

/**
 * Authentication Routes - Defines HTTP endpoints for authentication
 * This is part of the Presentation layer in Clean Architecture
 * Configures Express routes and connects them to the appropriate controllers and middleware
 */
export class AuthRoutes {
  private router: Router
  private authController: AuthController
  private authMiddleware: AuthMiddleware

  constructor(
    databaseFactory: IDatabaseFactory,
    getUserWithAvatar: GetUserWithAvatarUseCase,
    jwtSecret: string,
    refreshTokenSecret: string
  ) {
    this.router = Router()

    // Initialize controller and middleware with dependencies
    this.authController = new AuthController(
      databaseFactory,
      getUserWithAvatar,
      jwtSecret,
      refreshTokenSecret
    )
    this.authMiddleware = new AuthMiddleware(
      databaseFactory,
      jwtSecret,
      refreshTokenSecret
    )

    // Configure routes
    this.configureRoutes()
  }

  /**
   * Configure all authentication routes
   * @private
   */
  private configureRoutes(): void {
    // Public routes (no authentication required)

    /**
     * POST /auth/register
     * Register a new user account
     * Body: { username: string, password: string, email?: string }
     */
    this.router.post(
      '/register',
      this.authMiddleware.rateLimitAuth(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
      this.authController.register
    )

    /**
     * POST /auth/login
     * Authenticate user and receive tokens
     * Body: { username: string, password: string }
     */
    this.router.post(
      '/login',
      this.authMiddleware.rateLimitAuth(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
      this.authController.login
    )

    /**
     * POST /auth/refresh
     * Refresh access token using refresh token
     * Refresh token should be in httpOnly cookie
     */
    this.router.post(
      '/refresh',
      this.authMiddleware.rateLimitAuth(10, 15 * 60 * 1000), // 10 attempts per 15 minutes
      this.authController.refreshToken
    )

    /**
     * POST /auth/logout
     * Logout user and revoke refresh token
     * Refresh token should be in httpOnly cookie
     */
    this.router.post('/logout', this.authController.logout)

    // Protected routes (authentication required)

    /**
     * GET /auth/profile
     * Get current user's profile information
     * Requires: Authorization header with Bearer token
     */
    this.router.get(
      '/profile',
      this.authMiddleware.authenticateToken,
      this.authController.getProfile
    )

    /**
     * POST /auth/logout-all
     * Logout user from all devices (revoke all refresh tokens)
     * Requires: Authorization header with Bearer token
     */
    this.router.post(
      '/logout-all',
      this.authMiddleware.authenticateToken,
      this.authController.logoutFromAllDevices
    )

    /**
     * GET /auth/sessions
     * Get active sessions for the current user (device list)
     * Requires: Authorization header with Bearer token
     */
    this.router.get(
      '/sessions',
      this.authMiddleware.authenticateToken,
      this.authController.getActiveSessions
    )

    // Health check route for the auth service
    /**
     * GET /auth/health
     * Check if authentication service is working
     */
    this.router.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Authentication service is healthy',
        timestamp: new Date().toISOString(),
        service: 'auth-service'
      })
    })
  }

  /**
   * Get the configured router instance
   * @returns Express Router with all authentication routes configured
   */
  getRouter(): Router {
    return this.router
  }
}

/**
 * Factory function to create authentication routes
 * This function provides a convenient way to create auth routes with dependencies
 * @param databaseFactory - Database factory for repository access
 * @param jwtSecret - Secret key for JWT access tokens
 * @param refreshTokenSecret - Secret key for refresh tokens
 * @returns Express Router with authentication routes
 */
export function createAuthRoutes(
  databaseFactory: IDatabaseFactory,
  getUserWithAvatar: GetUserWithAvatarUseCase,
  jwtSecret: string,
  refreshTokenSecret: string
): Router {
  const authRoutes = new AuthRoutes(
    databaseFactory,
    getUserWithAvatar,
    jwtSecret,
    refreshTokenSecret
  )
  return authRoutes.getRouter()
}
