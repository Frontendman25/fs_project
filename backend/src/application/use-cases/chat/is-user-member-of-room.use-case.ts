import { IChatRepository } from '@/domain/repositories/chat.repository'

export class IsUserMemberOfRoomUseCase {
  constructor(private readonly chatRepository: IChatRepository) {}

  async execute(roomId: string, userId: string): Promise<boolean> {
    return this.chatRepository.isUserMemberOfRoom(roomId, userId)
  }
}
