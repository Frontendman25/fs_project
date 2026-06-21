import { IUserRepository } from '@/domain/repositories/user.repository'
import { IFileRepository } from '@/domain/repositories/file.repository'
import type { File } from '@/domain/entities/file.entity'

import { createLogger } from '@/infrastructure/utils/logger'

import type { UserWithAvatar } from './types/user-with-avatar'

const logger = createLogger('GetUserWithAvatarUseCase')

export class GetUserWithAvatarUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly fileRepository: IFileRepository
  ) {}

  async execute(userId: string): Promise<UserWithAvatar | null> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      return null
    }

    let avatarFile: File | null = null
    if (user.avatarFileId) {
      try {
        avatarFile =
          (await this.fileRepository.findById(user.avatarFileId)) ?? null
      } catch (error) {
        logger.warn({ err: error, userId }, 'Failed to get avatar for user')
      }
    }

    return {
      ...user,
      avatarFile
    }
  }
}
