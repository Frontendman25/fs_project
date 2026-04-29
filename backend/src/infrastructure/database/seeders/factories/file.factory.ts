import { createHash } from 'crypto'

import type { Faker } from '@faker-js/faker'

export interface GeneratedFile {
  readonly originalName: string
  readonly filename: string
  readonly mimeType: string
  readonly size: number
  readonly compressedSize: number
  readonly path: string
  readonly isCompressed: boolean
  readonly compressionRatio: number
  readonly checksum: string
  readonly storageType: 'local' | 'cloudinary'
}

/**
 * File metadata is keyed by `externalKey` so the produced filename/checksum
 * are stable across runs and safe to upsert on the `filename` unique index.
 */
export function generateFile(faker: Faker, externalKey: string): GeneratedFile {
  const extensions = ['jpg', 'png', 'pdf', 'txt', 'json']
  const ext = faker.helpers.arrayElement(extensions)
  const filename = `seed-${hash(externalKey).slice(0, 16)}.${ext}`
  const originalName = `${faker.system.commonFileName(ext)}`
  const size = faker.number.int({ min: 1024, max: 5 * 1024 * 1024 })
  const compressedSize = Math.floor(
    size * faker.number.float({ min: 0.4, max: 0.9 })
  )

  return {
    originalName,
    filename,
    mimeType: mimeFor(ext),
    size,
    compressedSize,
    path: `seed/${filename}`,
    isCompressed: true,
    compressionRatio: Number((size / Math.max(compressedSize, 1)).toFixed(2)),
    checksum: hash(`${externalKey}:${filename}`),
    storageType: 'local'
  }
}

function hash(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

function mimeFor(ext: string): string {
  switch (ext) {
    case 'jpg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'pdf':
      return 'application/pdf'
    case 'json':
      return 'application/json'
    default:
      return 'text/plain'
  }
}
