import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import type { PrismaClient } from '@prisma/client'

import { setupApplication } from '@/bootstrap/setupApplication'
import type { ApplicationBundle } from '@/bootstrap/setupApplication'

import { truncateAllTables } from '../helpers/db'

const dbConfigured = Boolean(
  process.env.POSTGRESQL_URL &&
  process.env.JWT_SECRET &&
  process.env.REFRESH_TOKEN_SECRET
)

describe.skipIf(!dbConfigured)('E2E: users HTTP', () => {
  let bundle: ApplicationBundle
  let prisma: PrismaClient

  beforeAll(async () => {
    bundle = await setupApplication({ listen: false })
    prisma = bundle.databaseFactory
      .getDatabaseService()
      .getClient() as PrismaClient
  })

  beforeEach(async () => {
    await truncateAllTables(prisma)
  })

  afterAll(async () => {
    await bundle.shutdown()
  })

  it('GET /api/users/:id returns profile after registration', async () => {
    const agent = request(bundle.app)

    const reg = await agent.post('/auth/register').send({
      username: 'profileuser',
      password: 'secret12',
      email: 'profile@test.dev'
    })
    expect(reg.status).toBe(201)
    const userId = reg.body.data.user.id as string

    const res = await agent.get(`/api/users/${userId}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.username).toBe('profileuser')
    expect(res.body.data.email).toBe('profile@test.dev')
  })
})
