import { Request, Response, NextFunction } from 'express'

import { AppError } from '../../domain/errors/app.error'

/**
 * Error Handler Middleware - Centralized error handling for Express
 * This is part of the Presentation layer in Clean Architecture
 * Maps domain errors to appropriate HTTP responses
 */
export class ErrorHandler {
  /**
   * Handle application errors and convert them to HTTP responses
   * @param error - The error to handle
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static handle(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    // Log error for debugging
    console.error('Error occurred:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    })

    const isDevelopment = process.env.NODE_ENV === 'development'

    // Handle known application errors
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        ...(isDevelopment && {
          stack: error.stack
        })
      })
      return
    }

    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.message,
        ...(isDevelopment && {
          stack: error.stack
        })
      })
      return
    }

    // Handle unexpected errors
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      ...(isDevelopment && {
        message: error.message,
        stack: error.stack
      })
    })
  }

  /**
   * Handle 404 errors for unmatched routes
   * @param req - Express request object
   * @param res - Express response object
   */
  static handleNotFound(req: Request, res: Response): void {
    res.status(404).json({
      success: false,
      error: `Route ${req.method} ${req.url} not found`
    })
  }

  /**
   * Async error wrapper for route handlers
   * @param fn - Async function to wrap
   * @returns Wrapped function that catches async errors
   */
  static asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next)
    }
  }
}
