import { FileModel } from '@/infrastructure/database/schemas/mongodb/file'
import { UserModel } from '@/infrastructure/database/schemas/mongodb/user'

import { generateFile } from '../../factories/file.factory'
import {
  ensureFileIdentities,
  ensureUserIdentities
} from '../../identity/identity.bootstrap'
import type {
  SeedContext,
  SeedModule,
  SeedModuleResult
} from '../../seed.types'

export const mongodbFilesSeed: SeedModule = {
  name: 'files',
  engine: 'mongodb',

  async run(ctx: SeedContext): Promise<SeedModuleResult> {
    const start = Date.now()
    const { faker, identity, logger } = ctx

    const users = ensureUserIdentities(ctx)
    const files = ensureFileIdentities(ctx, users)
    if (files.length === 0) {
      logger.warn('mongodb files skipped: no files configured')
      return base(start)
    }

    const operations = files.map((fileIdentity) => {
      const owner = identity.getUser(fileIdentity.ownerKey)
      if (!owner) {
        throw new Error(
          `mongodb files: owner "${fileIdentity.ownerKey}" not found in identity map`
        )
      }

      const data = generateFile(faker, fileIdentity.key)
      return {
        updateOne: {
          filter: { _id: fileIdentity.mongoObjectId },
          update: {
            $set: {
              ...data,
              uploadedBy: owner.mongoObjectId.toHexString()
            },
            $setOnInsert: { _id: fileIdentity.mongoObjectId }
          },
          upsert: true
        }
      }
    })

    const result = await FileModel.bulkWrite(operations, { ordered: false })

    for (const user of users) {
      const firstFile = files.find(
        (fileIdentity) => fileIdentity.ownerKey === user.key
      )
      if (!firstFile) {
        continue
      }
      await UserModel.updateOne(
        { _id: user.mongoObjectId },
        { $set: { avatarFileId: firstFile.mongoObjectId.toHexString() } }
      ).exec()
    }

    return {
      name: 'files',
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
    name: 'files',
    engine: 'mongodb',
    created: 0,
    updated: 0,
    skipped: 0,
    durationMs: Date.now() - start
  }
}
