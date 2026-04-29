import { PostModel } from '@/infrastructure/database/schemas/mongodb/post/post.schema'

import { generatePost } from '../../factories/post.factory'
import {
  ensurePostIdentities,
  ensureUserIdentities
} from '../../identity/identity.bootstrap'
import type {
  SeedContext,
  SeedModule,
  SeedModuleResult
} from '../../seed.types'

/**
 * Seeds MongoDB posts using deterministic identities and bulk upserts keyed by _id.
 *
 * MongoDB transactions are intentionally NOT used here — they require a
 * replica set and would fail on local standalone instances. `bulkWrite` with
 * `ordered: false` gives us atomic per-op semantics and tolerates partial
 * failures, which are then aggregated and surfaced to the operator.
 */
export const mongodbPostsSeed: SeedModule = {
  name: 'posts',
  engine: 'mongodb',

  async run(ctx: SeedContext): Promise<SeedModuleResult> {
    const start = Date.now()
    const { faker, identity, logger } = ctx

    const users = ensureUserIdentities(ctx)
    const posts = ensurePostIdentities(ctx, users)
    if (posts.length === 0) {
      logger.warn('mongodb posts skipped: no posts in identity map')
      return base(start)
    }

    const operations = posts.map((post) => {
      const user = identity.getUser(post.userKey)
      if (!user) {
        throw new Error(
          `mongodb posts: user "${post.userKey}" not found in identity map`
        )
      }
      const data = generatePost(faker)
      return {
        updateOne: {
          filter: { _id: post.mongoObjectId },
          update: {
            $set: {
              userId: user.mongoObjectId,
              content: data.content
            },
            $setOnInsert: { _id: post.mongoObjectId }
          },
          upsert: true
        }
      }
    })

    const result = await PostModel.bulkWrite(operations, { ordered: false })

    return {
      name: 'posts',
      engine: 'mongodb',
      created: result.upsertedCount ?? 0,
      updated: result.modifiedCount ?? 0,
      skipped: Math.max(
        0,
        operations.length -
          (result.upsertedCount ?? 0) -
          (result.modifiedCount ?? 0)
      ),
      durationMs: Date.now() - start
    }
  }
}

function base(start: number): SeedModuleResult {
  return {
    name: 'posts',
    engine: 'mongodb',
    created: 0,
    updated: 0,
    skipped: 0,
    durationMs: Date.now() - start
  }
}
