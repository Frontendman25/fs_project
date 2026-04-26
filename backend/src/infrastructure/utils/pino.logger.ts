/**
 * Pino Logger Implementation
 * Following Clean Architecture - Infrastructure layer
 * Concrete implementation of ILogger using Pino
 */

import pino from 'pino'

import { ILoggerService } from '@/domain/services/logger.service'

/**
 * Pino-based logger implementation
 * Wraps Pino logger to implement ILoggerService interface
 */
export class PinoLogger implements ILoggerService {
  private logger: pino.Logger

  constructor(logger: pino.Logger) {
    this.logger = logger
  }

  debug(obj: object, msg?: string): void
  debug(msg: string): void
  debug(objOrMsg: object | string, msg?: string): void {
    if (typeof objOrMsg === 'string') {
      this.logger.debug(objOrMsg)
    } else {
      this.logger.debug(objOrMsg, msg)
    }
  }

  info(obj: object, msg?: string): void
  info(msg: string): void
  info(objOrMsg: object | string, msg?: string): void {
    if (typeof objOrMsg === 'string') {
      this.logger.info(objOrMsg)
    } else {
      this.logger.info(objOrMsg, msg)
    }
  }

  warn(obj: object, msg?: string): void
  warn(msg: string): void
  warn(objOrMsg: object | string, msg?: string): void {
    if (typeof objOrMsg === 'string') {
      this.logger.warn(objOrMsg)
    } else {
      this.logger.warn(objOrMsg, msg)
    }
  }

  error(obj: object, msg?: string): void
  error(msg: string): void
  error(objOrMsg: object | string, msg?: string): void {
    if (typeof objOrMsg === 'string') {
      this.logger.error(objOrMsg)
    } else {
      this.logger.error(objOrMsg, msg)
    }
  }

  fatal(obj: object, msg?: string): void
  fatal(msg: string): void
  fatal(objOrMsg: object | string, msg?: string): void {
    if (typeof objOrMsg === 'string') {
      this.logger.fatal(objOrMsg)
    } else {
      this.logger.fatal(objOrMsg, msg)
    }
  }

  child(bindings: object): ILoggerService {
    return new PinoLogger(this.logger.child(bindings))
  }
}
