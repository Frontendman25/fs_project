import type { File } from '../entities/file.entity'

import { getJwtIssuer } from './auth.config'

/**
 * Client-loadable URL for a stored file.
 * Local storage keeps an on-disk path in DB; Cloudinary stores `secure_url` in `path`.
 */
export function getPublicFileUrlForClient(
  file: Pick<File, 'id' | 'path' | 'storageType'>
): string {
  const pathTrimmed = file.path.trim()
  if (file.storageType === 'cloudinary' || /^https?:\/\//i.test(pathTrimmed)) {
    return pathTrimmed
  }
  const base = getJwtIssuer()
  return `${base}/files/${file.id}`
}
