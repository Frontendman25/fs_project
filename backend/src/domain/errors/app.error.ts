/**
 * Base Application Error - Abstract base class for all application errors
 * This is part of the Domain layer in Clean Architecture
 * Provides consistent error structure and HTTP status mapping
 */
export abstract class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(
    message: string,
    statusCode: number,
    isOperational: boolean = true
  ) {
    super(message)
    
    this.statusCode = statusCode
    this.isOperational = isOperational
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor)
    
    // Set prototype to ensure instanceof works correctly
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/**
 * Validation Error - For input validation failures
 * HTTP Status: 400 Bad Request
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400)
  }
}

/**
 * Bad Request Error - For malformed requests
 * HTTP Status: 400 Bad Request
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400)
  }
}

/**
 * Unauthorized Error - For authentication failures
 * HTTP Status: 401 Unauthorized
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401)
  }
}

/**
 * Forbidden Error - For authorization failures
 * HTTP Status: 403 Forbidden
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403)
  }
}

/**
 * Not Found Error - For resource not found scenarios
 * HTTP Status: 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404)
  }
}

/**
 * Conflict Error - For resource conflicts (e.g., duplicate data)
 * HTTP Status: 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409)
  }
}

/**
 * Internal Server Error - For unexpected server errors
 * HTTP Status: 500 Internal Server Error
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, false)
  }
}

/**
 * Security Violation Error - For detected token reuse / stolen token
 * HTTP Status: 401 Unauthorized
 * Thrown when a revoked token is used (indicates possible token theft)
 */
export class SecurityViolationError extends AppError {
  constructor(message: string = 'Security violation detected') {
    super(message, 401)
  }
}
