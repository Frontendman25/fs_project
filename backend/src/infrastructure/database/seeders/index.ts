import 'dotenv/config'

import { PrismaClient } from '@prisma/client'
import mongoose from 'mongoose'

import { createLogger } from '@/infrastructure/utils/logger'

import { loadSeedConfig } from './seed.config'
import { SeedOrchestrator } from './seed.orchestrator'
import type { SeedTarget } from './seed.types'
import { assertSeedAllowed } from './utils/env.guard'
import { describeError } from './utils/seed.logger'

/**
 * CLI entry point — wired through `npm run db:seed`.
 *
 * Keeps lifecycle concerns (dotenv, connection open/close, exit codes) out
 * of the orchestrator so the orchestrator stays testable with in-memory
 * clients.
 */
async function main(): Promise<void> {
  const logger = createLogger('Seed')
  assertSeedAllowed(logger)

  const cliTarget = parseCliTarget(process.argv.slice(2))
  if (cliTarget) {
    process.env.SEED_TARGET = cliTarget
  }
  const config = loadSeedConfig()
  const needsPostgres = config.target === 'all' || config.target === 'postgres'
  const needsMongo = config.target === 'all' || config.target === 'mongo'

  const prisma = new PrismaClient()
  let mongoOpened = false

  try {
    if (needsPostgres) {
      requiredEnv('POSTGRESQL_URL')
      await prisma.$connect()
      logger.info('postgres connection established')
    }

    if (needsMongo) {
      const mongoUri = requiredEnv('MONGODB_URI')
      await mongoose.connect(mongoUri)
      mongoOpened = true
      logger.info('mongodb connection established')
    }

    const orchestrator = new SeedOrchestrator(config, prisma, mongoose, logger)
    await orchestrator.run()
  } catch (error) {
    const { message, hint } = describeError(error)
    logger.error(
      { error: message, hint },
      `seed pipeline failed: ${message}${hint ? ` — ${hint}` : ''}`
    )
    process.exitCode = 1
  } finally {
    if (needsPostgres) {
      await prisma.$disconnect().catch((e: unknown) => {
        logger.warn({ error: describeError(e).message }, 'prisma disconnect failed')
      })
    }
    if (mongoOpened) {
      await mongoose.disconnect().catch((e: unknown) => {
        logger.warn({ error: describeError(e).message }, 'mongo disconnect failed')
      })
    }
  }
}

function requiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required env variable: ${key}`)
  }
  return value
}

function parseCliTarget(argv: readonly string[]): SeedTarget | undefined {
  const targetFlag = argv.find((arg) => arg.startsWith('--target='))
  if (!targetFlag) return undefined
  const rawTarget = targetFlag.split('=')[1]
  if (!rawTarget) {
    throw new Error('Missing value for --target. Use postgres, mongo, or all.')
  }
  const normalized = rawTarget.trim().toLowerCase()
  if (normalized === 'postgres' || normalized === 'all') {
    return normalized
  }
  if (normalized === 'mongo' || normalized === 'mongodb') {
    return 'mongo'
  }
  throw new Error(
    `Invalid --target value "${rawTarget}". Use postgres, mongo, or all.`
  )
}

if (require.main === module) {
  void main()
}
