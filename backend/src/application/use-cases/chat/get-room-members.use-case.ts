import { IChatRepository } from '@/domain/repositories/chat.repository'
import { ChatMember } from '@/domain/entities/chat.entity'
import {
  ChatRoomNotFoundError,
  MessageSendingFailedError
} from '@/domain/errors/chat.errors'

export class GetRoomMembersUseCase {
  constructor(private readonly chatRepository: IChatRepository) {}

  async execute(roomId: string): Promise<ChatMember[]> {
    try {
      const room = await this.chatRepository.findRoomById(roomId)
      if (!room) {
        throw new ChatRoomNotFoundError(roomId)
      }

      const result = await this.chatRepository.findMembersByRoom(roomId)
      return result.items
    } catch (error) {
      throw new MessageSendingFailedError(
        error instanceof Error ? error.message : 'Failed to get room members'
      )
    }
  }
}
