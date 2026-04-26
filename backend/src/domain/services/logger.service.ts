/**
 * Logger Interface
 * Following Clean Architecture - Domain layer
 * Defines the contract for logging functionality
 *
 * This abstraction allows the application to depend on an interface
 * rather than a concrete implementation (Dependency Inversion Principle)
 */

export interface ILoggerService {
  /**
   * Log a debug message
   * @param obj - Object with context data
   * @param msg - Message to log
   */
  debug(obj: object, msg?: string): void
  debug(msg: string): void

  /**
   * Log an info message
   * @param obj - Object with context data
   * @param msg - Message to log
   */
  info(obj: object, msg?: string): void
  info(msg: string): void

  /**
   * Log a warning message
   * @param obj - Object with context data
   * @param msg - Message to log
   */
  warn(obj: object, msg?: string): void
  warn(msg: string): void

  /**
   * Log an error message
   * @param obj - Object with context data
   * @param msg - Message to log
   */
  error(obj: object, msg?: string): void
  error(msg: string): void

  /**
   * Log a fatal message (typically before process exit)
   */
  fatal(obj: object, msg?: string): void
  fatal(msg: string): void

  /**
   * Create a child logger with additional context
   * @param bindings - Context bindings to add to all log messages
   * @returns Child logger instance
   */
  child(bindings: object): ILoggerService
}
