import { IChatEventService } from '@/domain/services/chat-event.service'
import { ChatTypingIndicator } from '@/domain/entities/chat.entity'
import { MessageSendingFailedError } from '@/domain/errors/chat.errors'

export class UpdateTypingStatusUseCase {
  constructor(private readonly chatEventService: IChatEventService) {}

  async execute(
    roomId: string,
    userId: string,
    username: string,
    isTyping: boolean
  ): Promise<void> {
    try {
      const indicator: ChatTypingIndicator = {
        roomId,
        userId,
        username,
        isTyping,
        timestamp: new Date()
      }

      await this.chatEventService.emitTypingIndicator(roomId, indicator)
    } catch (error) {
      throw new MessageSendingFailedError(
        error instanceof Error
          ? error.message
          : 'Failed to update typing status'
      )
    }
  }
}
