import type { User } from '@/domain/entities/user.entity'
import type { File } from '@/domain/entities/file.entity'

import { toPublicFileUrl } from './file-public-url.mapper'

export interface UserProfileClientDto {
  id: string
  username: string
  email?: string
  avatarUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UserAuthClientDto {
  id: string
  username: string
  email?: string
  avatarUrl: string | null
}

function resolveAvatarUrl(avatarFile: File | null): string | null {
  return avatarFile ? toPublicFileUrl(avatarFile) : null
}

/** Maps a domain user + optional avatar file to a profile API payload. */
export function toUserProfileClientDto(
  user: Pick<User, 'id' | 'username' | 'email' | 'createdAt' | 'updatedAt'>,
  avatarFile: File | null
): UserProfileClientDto {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: resolveAvatarUrl(avatarFile),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }
}

/** Compact user shape for auth responses (login, register). */
export function toUserAuthClientDto(
  user: Pick<User, 'id' | 'username' | 'email'>,
  avatarFile: File | null
): UserAuthClientDto {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: resolveAvatarUrl(avatarFile)
  }
}
