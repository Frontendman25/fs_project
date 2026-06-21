import type { File } from '@/domain/entities/file.entity'

import { toPublicFileUrl } from './file-public-url.mapper'

/** File fields safe to return to API clients (no raw disk path as `url`). */
export interface FileClientDto {
  id: string
  originalName: string
  mimeType: string
  size: number
  compressedSize: number
  compressionRatio: number
  isCompressed: boolean
  storageType: File['storageType']
  /** Internal storage location (disk path or provider URL in DB). Not for `<img src>`. */
  storagePath: string
  /** Client-loadable URL (`/api/files/:id` or Cloudinary HTTPS). */
  url: string
  uploadedBy?: string
  checksum?: string
  createdAt: Date
  updatedAt?: Date
}

export function toFileClientDto(
  file: File,
  options?: { includeChecksum?: boolean; includeUpdatedAt?: boolean }
): FileClientDto {
  const dto: FileClientDto = {
    id: file.id,
    originalName: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
    compressedSize: file.compressedSize,
    compressionRatio: file.compressionRatio,
    isCompressed: file.isCompressed,
    storageType: file.storageType,
    storagePath: file.path,
    url: toPublicFileUrl(file),
    uploadedBy: file.uploadedBy,
    createdAt: file.createdAt
  }

  if (options?.includeChecksum) {
    dto.checksum = file.checksum
  }
  if (options?.includeUpdatedAt) {
    dto.updatedAt = file.updatedAt
  }

  return dto
}

/** Avatar upload payload: file metadata + `avatarUrl` alias for the public URL. */
export function toAvatarUploadClientDto(
  file: File
): FileClientDto & { avatarUrl: string } {
  const fileDto = toFileClientDto(file)
  return {
    ...fileDto,
    avatarUrl: fileDto.url
  }
}
