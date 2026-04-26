import { IChatRepository } from '@/domain/repositories/chat.repository'
import { ChatMessage } from '@/domain/entities/chat.entity'
import {
  ChatRoomNotFoundError,
  MessageSendingFailedError
} from '@/domain/errors/chat.errors'

export class GetMessagesUseCase {
  constructor(private readonly chatRepository: IChatRepository) {}

  async execute(
    roomId: string,
    options?: {
      limit?: number
      cursor?: string
      before?: Date
      after?: Date
    }
  ): Promise<ChatMessage[]> {
    try {
      const room = await this.chatRepository.findRoomById(roomId)
      if (!room) {
        throw new ChatRoomNotFoundError(roomId)
      }

      const query = {
        roomId,
        limit: options?.limit || 50,
        cursor: options?.cursor,
        before: options?.before,
        after: options?.after
      }

      const result = await this.chatRepository.findMessagesByQuery(query)
      return result.items
    } catch (error) {
      throw new MessageSendingFailedError(
        error instanceof Error ? error.message : 'Failed to get messages'
      )
    }
  }
}
