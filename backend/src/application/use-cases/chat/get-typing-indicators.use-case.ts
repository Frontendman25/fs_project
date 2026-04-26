import { ChatTypingIndicator } from '@/domain/entities/chat.entity'
import { MessageSendingFailedError } from '@/domain/errors/chat.errors'

export class GetTypingIndicatorsUseCase {
  async execute(_roomId: string): Promise<ChatTypingIndicator[]> {
    try {
      return []
    } catch (error) {
      throw new MessageSendingFailedError(
        error instanceof Error
          ? error.message
          : 'Failed to get typing indicators'
      )
    }
  }
}
