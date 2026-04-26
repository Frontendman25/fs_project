import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { PrismaClient } from '@prisma/client'

import { GetUserWithAvatarUseCase } from '@/application/use-cases/user/get-user-with-avatar.use-case'
import { PostgreSQLDatabaseFactory } from '@/infrastructure/database/factories/postgresql-database.factory'
import { PrismaDatabaseService } from '@/infrastructure/database/services/prisma/prisma-database.service'

import { createUserRecord } from '../helpers/factories'
import { truncateAllTables } from '../helpers/db'

const dbConfigured = Boolean(process.env.POSTGRESQL_URL)

describe.skipIf(!dbConfigured)(
  'GetUserWithAvatarUseCase (integration, real PostgreSQL)',
  () => {
    let factory: PostgreSQLDatabaseFactory
    let getUserWithAvatar: GetUserWithAvatarUseCase
    let prisma: PrismaClient

    beforeAll(async () => {
      await PrismaDatabaseService.resetInstance()
      factory = new PostgreSQLDatabaseFactory()
      await factory.connect()
      prisma = factory.getDatabaseService().getClient() as PrismaClient
      getUserWithAvatar = new GetUserWithAvatarUseCase(
        factory.getUserRepository(),
        factory.getFileRepository()
      )
    })

    beforeEach(async () => {
      await truncateAllTables(prisma)
    })

    afterAll(async () => {
      await factory.disconnect()
      await PrismaDatabaseService.resetInstance()
    })

    it('returns user with null avatarUrl when no avatar file is linked', async () => {
      const row = await createUserRecord(prisma, {
        username: 'integration-user',
        passwordPlain: 'secret12',
        email: 'int@test.dev'
      })

      const result = await getUserWithAvatar.execute(row.id)

      expect(result).not.toBeNull()
      expect(result!.username).toBe('integration-user')
      expect(result!.email).toBe('int@test.dev')
      expect(result!.avatarUrl).toBeNull()
    })
  }
)
