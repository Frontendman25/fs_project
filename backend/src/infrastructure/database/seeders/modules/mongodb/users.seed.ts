import bcrypt from 'bcrypt'

import { UserModel } from '@/infrastructure/database/schemas/mongodb/user'

import { ensureUserIdentities } from '../../identity/identity.bootstrap'
import type {
  SeedContext,
  SeedModule,
  SeedModuleResult
} from '../../seed.types'

export const mongodbUsersSeed: SeedModule = {
  name: 'users',
  engine: 'mongodb',

  async run(ctx: SeedContext): Promise<SeedModuleResult> {
    const start = Date.now()
    const { config, logger } = ctx
    const users = ensureUserIdentities(ctx)
    if (users.length === 0) {
      logger.warn('mongodb users skipped: no users configured')
      return base(start)
    }

    const passwordHash = await bcrypt.hash(config.defaultPassword, 10)
    const operations = users.map((user) => ({
      updateOne: {
        filter: { _id: user.mongoObjectId },
        update: {
          $set: {
            username: user.username,
            email: user.email,
            password: passwordHash
          },
          $setOnInsert: { _id: user.mongoObjectId }
        },
        upsert: true
      }
    }))

    const result = await UserModel.bulkWrite(operations, { ordered: false })

    return {
      name: 'users',
      engine: 'mongodb',
      created: result.upsertedCount ?? 0,
      updated: result.modifiedCount ?? 0,
      skipped: 0,
      durationMs: Date.now() - start
    }
  }
}

function base(start: number): SeedModuleResult {
  return {
    name: 'users',
    engine: 'mongodb',
    created: 0,
    updated: 0,
    skipped: 0,
    durationMs: Date.now() - start
  }
}
