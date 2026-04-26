import bcrypt from 'bcrypt'

import { generateUser } from '../../factories/user.factory'
import type { SeedContext, SeedModule, SeedModuleResult } from '../../seed.types'

/**
 * Postgres `users` seed — source of truth for user identity.
 *
 * Users are materialized here first; the derived (pgId, mongoObjectId) pair
 * is registered in the IdentityMap so later MongoDB modules can reference
 * the same user without any cross-db query.
 */
export const postgresUsersSeed: SeedModule = {
  name: 'users',
  engine: 'postgres',

  async run(ctx: SeedContext): Promise<SeedModuleResult> {
    const start = Date.now()
    const { prisma, config, faker, identity, logger } = ctx

    const hashedPassword = await bcrypt.hash(config.defaultPassword, 10)

    const plans = Array.from({ length: config.counts.users }, (_, i) => {
      const key = `user:${i}`
      const profile = generateUser(faker, i)
      const pgId = identity.deriveUuid(key)
      const mongoObjectId = identity.deriveObjectId(key)

      identity.registerUser(key, {
        key,
        pgId,
        mongoObjectId,
        username: profile.username,
        email: profile.email
      })

      return { key, pgId, mongoObjectId, profile }
    })

    let created = 0
    let updated = 0

    await prisma.$transaction(async (tx) => {
      for (const plan of plans) {
        const existing = await tx.user.findUnique({ where: { id: plan.pgId } })

        await tx.user.upsert({
          where: { id: plan.pgId },
          create: {
            id: plan.pgId,
            username: plan.profile.username,
            email: plan.profile.email,
            password: hashedPassword
          },
          update: {
            username: plan.profile.username,
            email: plan.profile.email,
            password: hashedPassword
          }
        })

        if (existing) updated++
        else created++
      }
    })

    logger.debug(
      { created, updated, users: plans.length },
      'postgres users seeded'
    )

    return {
      name: 'users',
      engine: 'postgres',
      created,
      updated,
      skipped: 0,
      durationMs: Date.now() - start
    }
  }
}
