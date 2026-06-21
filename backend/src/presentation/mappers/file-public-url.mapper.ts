import type { File } from '@/domain/entities/file.entity'

import { getBackendBaseUrl } from '@/domain/config/backend-url.config'

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

function buildApiFileUrl(fileId: string): string {
  return `${getBackendBaseUrl()}/api/files/${fileId}`
}

/**
 * Client-loadable URL for a stored file.
 *
 * - Local storage: always served via this API (`/api/files/:id`), regardless of
 *   legacy values stored in `path`.
 * - Remote storage (e.g. Cloudinary): use absolute `path` when present;
 *   otherwise fall back to the API route.
 */
export function toPublicFileUrl(
  file: Pick<File, 'id' | 'path' | 'storageType'>
): string {
  if (file.storageType === 'local') {
    return buildApiFileUrl(file.id)
  }

  const remoteUrl = file.path.trim()
  if (isAbsoluteHttpUrl(remoteUrl)) {
    return remoteUrl
  }

  return buildApiFileUrl(file.id)
}
