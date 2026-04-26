import { generatePost } from '../../factories/post.factory'
import type { SeedContext, SeedModule, SeedModuleResult } from '../../seed.types'

/**
 * Seeds `posts` in Postgres. The same (postKey, pgId, mongoObjectId) triple
 * is registered in the identity map so the Mongo posts module can mirror
 * these rows using the identical ObjectId.
 */
export const postgresPostsSeed: SeedModule = {
  name: 'posts',
  engine: 'postgres',

  async run(ctx: SeedContext): Promise<SeedModuleResult> {
    const start = Date.now()
    const { prisma, faker, identity, config, logger } = ctx

    const users = identity.allUsers()
    if (users.length === 0) {
      logger.warn('posts seed skipped: no users in identity map')
      return { name: 'posts', engine: 'postgres', created: 0, updated: 0, skipped: 0, durationMs: Date.now() - start }
    }

    let created = 0
    let updated = 0

    await prisma.$transaction(async (tx) => {
      for (const user of users) {
        for (let i = 0; i < config.counts.postsPerUser; i++) {
          const postKey = `post:${user.key}:${i}`
          const pgId = identity.deriveUuid(postKey)
          const mongoObjectId = identity.deriveObjectId(postKey)
          const data = generatePost(faker)

          identity.registerPost(postKey, {
            key: postKey,
            pgId,
            mongoObjectId,
            userKey: user.key
          })

          const existing = await tx.post.findUnique({ where: { id: pgId } })

          await tx.post.upsert({
            where: { id: pgId },
            create: {
              id: pgId,
              userId: user.pgId,
              content: data.content
            },
            update: {
              content: data.content
            }
          })

          if (existing) updated++
          else created++
        }
      }
    })

    return {
      name: 'posts',
      engine: 'postgres',
      created,
      updated,
      skipped: 0,
      durationMs: Date.now() - start
    }
  }
}
