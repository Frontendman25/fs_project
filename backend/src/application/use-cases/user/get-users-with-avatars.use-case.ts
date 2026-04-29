import type { UserWithAvatar } from './types/user-with-avatar'
import { GetUserWithAvatarUseCase } from './get-user-with-avatar.use-case'

export class GetUsersWithAvatarsUseCase {
  constructor(private readonly getUserWithAvatar: GetUserWithAvatarUseCase) {}

  async execute(userIds: string[]): Promise<UserWithAvatar[]> {
    const users = await Promise.all(
      userIds.map((id) => this.getUserWithAvatar.execute(id))
    )
    return users.filter((u): u is UserWithAvatar => u !== null)
  }
}
