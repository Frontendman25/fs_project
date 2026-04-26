import { Request, Response, NextFunction } from 'express'

import { IDatabaseFactory } from '@/domain/repositories/database.factory'
import { RATE_LIMIT_CONFIG } from '@/domain/config'

import { AuthUseCase } from '@/application/use-cases/auth.use-case'

/**
 * Authentication Middleware - Validates JWT access tokens
 * This is part of the Presentation layer in Clean Architecture
 * Responsible for protecting routes and extracting user information from tokens
 */
export class AuthMiddleware {
  private authUseCase: AuthUseCase

  constructor(
    databaseFactory: IDatabaseFactory,
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
  }

  /**
   * Middleware function to authenticate JWT tokens
   * This middleware checks for valid access tokens in the Authorization header
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  authenticateToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Get token from Authorization header (Bearer token format)
      const authHeader = req.headers.authorization
      const token = authHeader && authHeader.split(' ')[1] // Format: "Bearer TOKEN"

      // Also check for token in cookies as fallback
      const cookieToken = req.cookies.accessToken
      const accessToken = token || cookieToken

      if (!accessToken) {
        res.status(401).json({
          success: false,
          message: 'Access token not provided',
          error: 'MISSING_TOKEN'
        })

        return
      }

      // Verify the access token using the auth use case
      const decoded = await this.authUseCase.verifyAccessToken(accessToken)

      // Attach user information to the request object
      req.user = {
        id: decoded.userId ?? decoded.id,
        username: decoded.username,
        email: decoded.email,
        iat: decoded.iat, // Issued at
        exp: decoded.exp // Expires at
      }

      // Continue to the next middleware/route handler
      next()
    } catch (error) {
      console.error('Token authentication error:', error)

      // Handle specific JWT errors
      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          res.status(401).json({
            success: false,
            message: 'Access token has expired',
            error: 'TOKEN_EXPIRED'
          })
          return
        }

        if (error.message.includes('Invalid')) {
          res.status(401).json({
            success: false,
            message: 'Invalid access token',
            error: 'INVALID_TOKEN'
          })
          return
        }
      }

      // Generic authentication error
      res.status(401).json({
        success: false,
        message: 'Authentication failed',
        error: 'AUTH_FAILED'
      })
    }
  }

  /**
   * Optional authentication middleware - doesn't fail if no token provided
   * Useful for routes that can work with or without authentication
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Get token from Authorization header or cookies
      const authHeader = req.headers.authorization
      const token = authHeader && authHeader.split(' ')[1]
      const cookieToken = req.cookies.accessToken
      const accessToken = token || cookieToken

      // If no token provided, continue without authentication
      if (!accessToken) {
        next()
        return
      }

      // Try to verify the token
      const decoded = await this.authUseCase.verifyAccessToken(accessToken)

      // Attach user information to the request object
      req.user = {
        id: decoded.userId ?? decoded.id,
        username: decoded.username,
        email: decoded.email,
        iat: decoded.iat,
        exp: decoded.exp
      }

      next()
    } catch (error) {
      // For optional auth, we don't fail on invalid tokens
      // Just continue without user information
      console.warn('Optional authentication failed:', error)
      next()
    }
  }

  /**
   * Role-based authorization middleware
   * This is a placeholder for future role-based access control
   * @param allowedRoles - Array of roles that are allowed to access the route
   */
  authorizeRoles = (allowedRoles: string[]) => {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const user = (req as any).user

        if (!user) {
          res.status(401).json({
            success: false,
            message: 'Authentication required',
            error: 'NOT_AUTHENTICATED'
          })
          return
        }

        // TODO: Implement role checking when user roles are added to the system
        // For now, we'll just check if user exists (basic authentication)

        // Example implementation when roles are added:
        // const userRoles = user.roles || [];
        // const hasPermission = allowedRoles.some(role => userRoles.includes(role));
        //
        // if (!hasPermission) {
        //   res.status(403).json({
        //     success: false,
        //     message: 'Insufficient permissions',
        //     error: 'INSUFFICIENT_PERMISSIONS'
        //   });
        //   return;
        // }

        next()
      } catch (error) {
        console.error('Authorization error:', error)
        res.status(500).json({
          success: false,
          message: 'Authorization check failed',
          error: 'AUTHORIZATION_ERROR'
        })
      }
    }
  }

  /**
   * Rate limiting middleware for authentication endpoints
   * This is a simple in-memory rate limiter (in production, use Redis)
   */
  private rateLimitStore = new Map<
    string,
    { count: number; resetTime: number }
  >()

  /**
   * Rate limiting middleware for authentication endpoints
   * This is a simple in-memory rate limiter (in production, use Redis)
   * @param maxAttempts - Maximum number of attempts within a given window
   * @param windowMs - Time window in milliseconds for rate limiting
   * @returns Express middleware function
   */
  rateLimitAuth = (
    maxAttempts: number = RATE_LIMIT_CONFIG.MAX_LOGIN_ATTEMPTS,
    windowMs: number = RATE_LIMIT_CONFIG.RATE_LIMIT_WINDOW_MS
  ) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const clientId = req.ip || 'unknown'
      const now = Date.now()

      // Clean up expired entries
      for (const [key, value] of this.rateLimitStore.entries()) {
        if (now > value.resetTime) {
          this.rateLimitStore.delete(key)
        }
      }

      // Get or create rate limit entry
      let rateLimitEntry = this.rateLimitStore.get(clientId)

      if (!rateLimitEntry || now > rateLimitEntry.resetTime) {
        rateLimitEntry = {
          count: 0,
          resetTime: now + windowMs
        }
      }

      rateLimitEntry.count++
      this.rateLimitStore.set(clientId, rateLimitEntry)

      // Check if limit exceeded
      if (rateLimitEntry.count > maxAttempts) {
        const resetTimeSeconds = Math.ceil(
          (rateLimitEntry.resetTime - now) / 1000 // Convert milliseconds to seconds
        )

        res.status(429).json({
          success: false,
          message: 'Too many authentication attempts',
          error: 'RATE_LIMIT_EXCEEDED',
          retryAfter: resetTimeSeconds
        })
        return
      }

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxAttempts.toString(),
        'X-RateLimit-Remaining': Math.max(
          0,
          maxAttempts - rateLimitEntry.count
        ).toString(),
        'X-RateLimit-Reset': Math.ceil(
          rateLimitEntry.resetTime / 1000
        ).toString()
      })

      next()
    }
  }
}
