import { AppError } from './app.error'

/**
 * Database Connection Error
 * Thrown when database connection operations fail
 */
export class DatabaseConnectionError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, 503)
    this.name = 'DatabaseConnectionError'

    if (originalError instanceof Error) {
      this.stack = originalError.stack
    }
  }
}

/**
 * Database Query Error
 * Thrown when database query execution fails
 */
export class DatabaseQueryError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, 500)
    this.name = 'DatabaseQueryError'

    if (originalError instanceof Error) {
      this.stack = originalError.stack
    }
  }
}

/**
 * Database Not Connected Error
 * Thrown when attempting to use database before connection is established
 */
export class DatabaseNotConnectedError extends AppError {
  constructor(operation: string) {
    super(
      `Cannot perform operation '${operation}': Database is not connected. Call connect() first.`,
      503
    )
    this.name = 'DatabaseNotConnectedError'
  }
}

/**
 * Database Transaction Error
 * Thrown when database transaction operations fail
 */
export class DatabaseTransactionError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, 500)
    this.name = 'DatabaseTransactionError'

    if (originalError instanceof Error) {
      this.stack = originalError.stack
    }
  }
}

/**
 * Database Health Check Error
 * Thrown when database health check fails
 */
export class DatabaseHealthCheckError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, 503)
    this.name = 'DatabaseHealthCheckError'

    if (originalError instanceof Error) {
      this.stack = originalError.stack
    }
  }
}
