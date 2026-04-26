/**
 * Avatar upload E2E — requires local storage (default) and a writable uploads dir.
 * Uses a tiny valid JPEG buffer (no external services).
 */
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach
} from 'vitest'
import request from 'supertest'
import fs from 'fs'
import path from 'path'
import type { PrismaClient } from '@prisma/client'

import { setupApplication } from '@/bootstrap/setupApplication'
import type { ApplicationBundle } from '@/bootstrap/setupApplication'

import { truncateAllTables } from '../helpers/db'

const dbConfigured = Boolean(
  process.env.POSTGRESQL_URL &&
    process.env.JWT_SECRET &&
    process.env.REFRESH_TOKEN_SECRET
)

/** Minimal valid 1×1 PNG (transparent) */
const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

describe.skipIf(!dbConfigured)('E2E: user avatar HTTP', () => {
  let bundle: ApplicationBundle
  let prisma: PrismaClient

  beforeAll(async () => {
    const uploadDir =
      process.env.LOCAL_STORAGE_PATH ||
      path.join(process.cwd(), 'uploads-test-e2e')
    fs.mkdirSync(uploadDir, { recursive: true })
    process.env.STORAGE_TYPE = 'local'
    process.env.LOCAL_STORAGE_PATH = uploadDir

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

  it('POST /api/users/:id/avatar updates profile avatar path', async () => {
    const agent = request(bundle.app)

    const reg = await agent.post('/auth/register').send({
      username: 'avataruser',
      password: 'secret12',
      email: 'avatar@test.dev'
    })
    expect(reg.status).toBe(201)
    const userId = reg.body.data.user.id as string

    const res = await agent
      .post(`/api/users/${userId}/avatar`)
      .attach('avatar', tinyPng, 'avatar.png')

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)

    const profile = await agent.get(`/api/users/${userId}`)
    expect(profile.status).toBe(200)
    expect(profile.body.data.avatarUrl).toBeTruthy()
  })
})
