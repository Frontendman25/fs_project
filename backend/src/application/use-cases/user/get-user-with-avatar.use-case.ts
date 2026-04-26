import { IUserRepository } from '@/domain/repositories/user.repository'
import { IFileRepository } from '@/domain/repositories/file.repository'

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

    let avatarUrl: string | null = null
    if (user.avatarFileId) {
      try {
        const avatarFile = await this.fileRepository.findById(user.avatarFileId)
        if (avatarFile) {
          avatarUrl = avatarFile.path
        }
      } catch (error) {
        logger.warn({ err: error, userId }, 'Failed to get avatar for user')
      }
    }

    return {
      ...user,
      avatarUrl
    }
  }
}
