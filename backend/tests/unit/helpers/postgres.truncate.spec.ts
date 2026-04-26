import { describe, it, expect, vi, beforeEach } from 'vitest'
import { truncateAllPublicTables } from '../../helpers/postgres.truncate'

describe('truncateAllPublicTables', () => {
  let connect: ReturnType<typeof vi.fn>
  let queryRaw: ReturnType<typeof vi.fn>
  let executeRawUnsafe: ReturnType<typeof vi.fn>

  beforeEach(() => {
    connect = vi.fn().mockResolvedValue(undefined)
    queryRaw = vi.fn()
    executeRawUnsafe = vi.fn().mockResolvedValue(undefined)
  })

  function prismaStub() {
    return {
      $connect: connect,
      $queryRaw: queryRaw,
      $executeRawUnsafe: executeRawUnsafe
    } as unknown as import('@prisma/client').PrismaClient
  }

  it('connects, discovers tables, truncates all except migrations and custom excludes', async () => {
    queryRaw.mockResolvedValue([
      { table_name: '_prisma_migrations' },
      { table_name: 'users' },
      { table_name: 'posts' },
      { table_name: 'audit_log' }
    ])

    await truncateAllPublicTables(prismaStub(), {
      excludeTables: ['audit_log']
    })

    expect(connect).toHaveBeenCalledTimes(1)
    expect(executeRawUnsafe).toHaveBeenCalledWith(
      'TRUNCATE TABLE "users", "posts" RESTART IDENTITY CASCADE'
    )
  })

  it('does not execute TRUNCATE when every table is excluded', async () => {
    queryRaw.mockResolvedValue([{ table_name: '_prisma_migrations' }])

    await truncateAllPublicTables(prismaStub())

    expect(executeRawUnsafe).not.toHaveBeenCalled()
  })

  it('does not execute TRUNCATE when schema has no base tables', async () => {
    queryRaw.mockResolvedValue([])

    await truncateAllPublicTables(prismaStub())

    expect(executeRawUnsafe).not.toHaveBeenCalled()
  })

  it('escapes double quotes in table names', async () => {
    queryRaw.mockResolvedValue([{ table_name: 'weird"name' }])

    await truncateAllPublicTables(prismaStub())

    expect(executeRawUnsafe).toHaveBeenCalledWith(
      'TRUNCATE TABLE "weird""name" RESTART IDENTITY CASCADE'
    )
  })
})
