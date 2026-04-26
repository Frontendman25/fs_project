import { generateFile } from '../../factories/file.factory'
import type { SeedContext, SeedModule, SeedModuleResult } from '../../seed.types'

/**
 * Seeds `files` + assigns `avatarFileId` to every user.
 *
 * Runs after `users`; picks the first generated file per user as avatar.
 */
export const postgresFilesSeed: SeedModule = {
  name: 'files',
  engine: 'postgres',

  async run(ctx: SeedContext): Promise<SeedModuleResult> {
    const start = Date.now()
    const { prisma, faker, identity, config, logger } = ctx

    const users = identity.allUsers()
    if (users.length === 0) {
      logger.warn('files seed skipped: no users in identity map')
      return emptyResult(start)
    }

    let created = 0
    let updated = 0

    await prisma.$transaction(async (tx) => {
      for (const user of users) {
        for (let i = 0; i < config.counts.filesPerUser; i++) {
          const fileKey = `file:${user.key}:${i}`
          const fileId = identity.deriveUuid(fileKey)
          const data = generateFile(faker, fileKey)

          identity.registerFile(fileKey, {
            key: fileKey,
            pgId: fileId,
            mongoObjectId: identity.deriveObjectId(fileKey),
            ownerKey: user.key
          })

          const existing = await tx.file.findUnique({ where: { id: fileId } })

          await tx.file.upsert({
            where: { id: fileId },
            create: {
              id: fileId,
              originalName: data.originalName,
              filename: data.filename,
              mimeType: data.mimeType,
              size: data.size,
              compressedSize: data.compressedSize,
              path: data.path,
              uploadedBy: user.pgId,
              isCompressed: data.isCompressed,
              compressionRatio: data.compressionRatio,
              checksum: data.checksum,
              storageType: data.storageType
            },
            update: {
              originalName: data.originalName,
              path: data.path,
              uploadedBy: user.pgId,
              checksum: data.checksum
            }
          })

          if (existing) updated++
          else created++

          if (i === 0) {
            await tx.user.update({
              where: { id: user.pgId },
              data: { avatarFileId: fileId }
            })
          }
        }
      }
    })

    return {
      name: 'files',
      engine: 'postgres',
      created,
      updated,
      skipped: 0,
      durationMs: Date.now() - start
    }
  }
}

function emptyResult(start: number): SeedModuleResult {
  return {
    name: 'files',
    engine: 'postgres',
    created: 0,
    updated: 0,
    skipped: 0,
    durationMs: Date.now() - start
  }
}
