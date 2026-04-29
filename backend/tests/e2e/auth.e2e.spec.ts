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

describe.skipIf(!dbConfigured)('E2E: auth HTTP', () => {
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

  it('POST /auth/register then POST /auth/login returns access token', async () => {
    const agent = request(bundle.app)

    const reg = await agent.post('/auth/register').send({
      username: 'e2euser',
      password: 'secret12',
      email: 'e2e@test.dev'
    })
    expect(reg.status).toBe(201)
    expect(reg.body.success).toBe(true)

    const login = await agent.post('/auth/login').send({
      username: 'e2euser',
      password: 'secret12'
    })

    expect(login.status).toBe(200)
    expect(login.body.success).toBe(true)
    expect(login.body.data?.accessToken).toBeTruthy()
    expect(login.body.data?.user?.username).toBe('e2euser')
  })
})
