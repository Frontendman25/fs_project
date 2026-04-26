/**
 * Repository & auth environment validation — no MongoDB/Prisma side effects at import time.
 * Kept separate from `file-repository.factory.ts` so unit tests can import it safely.
 */

export interface IRepositoryValidationResult {
  isValid: boolean
  databaseType: 'mongodb' | 'postgresql'
  errors: string[]
  warnings: string[]
}

function hasPostgresConnectionString(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRESQL_URL)
}

export class RepositoryConfigValidator {
  static validateEnvironment(): IRepositoryValidationResult {
    const rawType = (process.env.DATABASE_TYPE || 'postgresql').toLowerCase()
    const errors: string[] = []
    const warnings: string[] = []

    const databaseType: 'mongodb' | 'postgresql' =
      rawType === 'mongodb' ? 'mongodb' : 'postgresql'

    if (rawType !== 'mongodb' && rawType !== 'postgresql') {
      warnings.push(
        `Unknown DATABASE_TYPE: ${process.env.DATABASE_TYPE}, treating as PostgreSQL (matches app default)`
      )
    }

    if (databaseType === 'postgresql') {
      if (!hasPostgresConnectionString()) {
        errors.push(
          'DATABASE_URL or POSTGRESQL_URL is required for PostgreSQL (Prisma)'
        )
      }
    } else if (!process.env.MONGODB_URI) {
      warnings.push('MONGODB_URI not set, using default MongoDB connection')
    }

    if (!process.env.JWT_SECRET?.trim()) {
      errors.push('JWT_SECRET must be set in environment variables')
    }
    if (!process.env.REFRESH_TOKEN_SECRET?.trim()) {
      errors.push('REFRESH_TOKEN_SECRET must be set in environment variables')
    }

    const isTest = process.env.NODE_ENV === 'test'
    if (!isTest && !process.env.SESSION_SECRET?.trim()) {
      errors.push('SESSION_SECRET must be set outside of test environment')
    }

    return {
      isValid: errors.length === 0,
      databaseType,
      errors,
      warnings
    }
  }

  static getConfigSummary(): string {
    const validation = this.validateEnvironment()
    const databaseType = validation.databaseType

    let summary = `File repository: type=${databaseType.toUpperCase()}\n`

    if (databaseType === 'mongodb') {
      summary += `MongoDB URI: ${process.env.MONGODB_URI ? 'SET' : 'DEFAULT'}\n`
    } else {
      summary += `PostgreSQL URL: ${hasPostgresConnectionString() ? 'SET' : 'NOT_SET'}\n`
    }

    summary += `JWT_SECRET: ${process.env.JWT_SECRET?.trim() ? 'SET' : 'NOT_SET'}\n`
    summary += `REFRESH_TOKEN_SECRET: ${process.env.REFRESH_TOKEN_SECRET?.trim() ? 'SET' : 'NOT_SET'}\n`
    let sessionSummary: string
    if (process.env.SESSION_SECRET?.trim()) {
      sessionSummary = 'SET'
    } else if (process.env.NODE_ENV === 'test') {
      sessionSummary = 'DEFAULT(test)'
    } else {
      sessionSummary = 'NOT_SET'
    }
    summary += `SESSION_SECRET: ${sessionSummary}\n`

    if (validation.warnings.length > 0) {
      summary += `Warnings: ${validation.warnings.length}\n`
    }
    if (validation.errors.length > 0) {
      summary += `Errors: ${validation.errors.length}\n`
    }

    return summary.trimEnd()
  }
}
