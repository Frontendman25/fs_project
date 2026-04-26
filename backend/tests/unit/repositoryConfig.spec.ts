import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { RepositoryConfigValidator } from '@/infrastructure/repositories/repository-config.validator'

describe('RepositoryConfigValidator', () => {
  const ORIGINAL_ENV = { ...process.env }

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'unit-test-jwt-secret'
    process.env.REFRESH_TOKEN_SECRET = 'unit-test-refresh-secret'
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('defaults to postgresql when no DATABASE_TYPE is set (matches createDatabaseFactory)', () => {
    delete process.env.DATABASE_TYPE
    delete process.env.DATABASE_URL
    delete process.env.POSTGRESQL_URL
    const res = RepositoryConfigValidator.validateEnvironment()
    expect(res.databaseType).toBe('postgresql')
    expect(res.isValid).toBe(false)
  })

  it('is valid with default postgresql when a Prisma URL is set', () => {
    delete process.env.DATABASE_TYPE
    process.env.POSTGRESQL_URL = 'postgresql://user:pass@localhost:5432/db'
    delete process.env.DATABASE_URL
    const res = RepositoryConfigValidator.validateEnvironment()
    expect(res.databaseType).toBe('postgresql')
    expect(res.isValid).toBe(true)
  })

  it('returns errors for postgresql without DATABASE_URL or POSTGRESQL_URL', () => {
    process.env.DATABASE_TYPE = 'postgresql'
    delete process.env.DATABASE_URL
    delete process.env.POSTGRESQL_URL
    const res = RepositoryConfigValidator.validateEnvironment()
    expect(res.errors.some((e) => e.includes('POSTGRESQL_URL'))).toBe(true)
    expect(res.isValid).toBe(false)
  })

  it('is valid for postgresql when DATABASE_URL is present', () => {
    process.env.DATABASE_TYPE = 'postgresql'
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
    delete process.env.POSTGRESQL_URL
    const res = RepositoryConfigValidator.validateEnvironment()
    expect(res.isValid).toBe(true)
  })

  it('is valid for postgresql when only POSTGRESQL_URL is present', () => {
    process.env.DATABASE_TYPE = 'postgresql'
    delete process.env.DATABASE_URL
    process.env.POSTGRESQL_URL = 'postgresql://user:pass@localhost:5432/db'
    const res = RepositoryConfigValidator.validateEnvironment()
    expect(res.isValid).toBe(true)
  })

  it('requires JWT_SECRET and REFRESH_TOKEN_SECRET', () => {
    delete process.env.JWT_SECRET
    process.env.REFRESH_TOKEN_SECRET = 'x'
    expect(RepositoryConfigValidator.validateEnvironment().isValid).toBe(false)

    process.env.JWT_SECRET = 'jwt'
    delete process.env.REFRESH_TOKEN_SECRET
    expect(RepositoryConfigValidator.validateEnvironment().isValid).toBe(false)
  })

  it('requires SESSION_SECRET outside test', () => {
    process.env.NODE_ENV = 'development'
    process.env.DATABASE_TYPE = 'postgresql'
    process.env.POSTGRESQL_URL = 'postgresql://localhost/db'
    delete process.env.SESSION_SECRET
    const res = RepositoryConfigValidator.validateEnvironment()
    expect(res.isValid).toBe(false)
    expect(res.errors.some((e) => e.includes('SESSION_SECRET'))).toBe(true)
  })
})
