import { IUserRepository } from '@/domain/repositories/user.repository'
import { User } from '@/domain/entities/user.entity'

export class RemoveUserAvatarUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string): Promise<User | null> {
    return this.userRepository.update(userId, { avatarFileId: undefined })
  }
}
