import pino from 'pino'

import { ILoggerService } from '@/domain/services/logger.service'

import { PinoLogger } from './pino.logger'

/**
 * Logger Configuration
 * Production-ready logging using Pino
 * Following Clean Architecture - Infrastructure layer utility
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

/**
 * Create and configure Pino logger instance
 * @returns Configured Pino logger
 */
const pinoLogger = pino({
  level:
    process.env.LOG_LEVEL ||
    (isTest ? 'silent' : isDevelopment ? 'debug' : 'info'),

  // Pretty print in development
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      }
    : undefined,

  // Base configuration
  base: {
    env: process.env.NODE_ENV || 'development'
  },

  // Timestamp configuration
  timestamp: () => `,"time": "${new Date().toISOString()}"`
})

/**
 * Always-on logger for startup validation failures (main logger is `silent` in test).
 */
const exitPino = pino({
  level: 'fatal',
  enabled: true,
  base: { scope: 'startup-validation' },
  timestamp: () => `,"time": "${new Date().toISOString()}"`
})

/**
 * Wrapped logger implementing ILoggerService interface
 * This is the main logger instance used throughout the application
 */
export const logger: ILoggerService = new PinoLogger(pinoLogger)

/** Use for invalid env before `process.exit(1)` so failures are visible even when `NODE_ENV=test`. */
export const startupExitLogger: ILoggerService = new PinoLogger(exitPino)

/**
 * Create child logger with specific context
 * @param context - Context identifier (e.g., 'Database', 'API', 'Auth')
 * @returns Child logger with context (ILoggerService interface)
 */
export const createLogger = (context: string): ILoggerService => {
  return logger.child({ context })
}

/**
 * Database logger instance (ILoggerService interface)
 */
export const databaseLogger: ILoggerService = createLogger('Database')

/**
 * Application logger instance (ILoggerService interface)
 */
export const appLogger: ILoggerService = createLogger('Application')

/**
 * HTTP logger instance (ILoggerService interface)
 */
export const httpLogger: ILoggerService = createLogger('HTTP')

