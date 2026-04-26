import { IChatRepository } from '@/domain/repositories/chat.repository'
import { ChatRoom } from '@/domain/entities/chat.entity'
import { MessageSendingFailedError } from '@/domain/errors/chat.errors'

export class GetUserRoomsUseCase {
  constructor(private readonly chatRepository: IChatRepository) {}

  async execute(userId: string): Promise<ChatRoom[]> {
    try {
      const result = await this.chatRepository.getUserRooms(userId)
      return result.items
    } catch (error) {
      throw new MessageSendingFailedError(
        error instanceof Error ? error.message : 'Failed to get user rooms'
      )
    }
  }
}
