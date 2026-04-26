import { IChatRepository } from '@/domain/repositories/chat.repository'
import { IChatEventService } from '@/domain/services/chat-event.service'
import { ChatMessage } from '@/domain/entities/chat.entity'
import {
  ChatRoomNotFoundError,
  UserNotMemberError,
  MessageSendingFailedError
} from '@/domain/errors/chat.errors'

import { validateMessageContent } from './validate-message-content'

export class SendMessageUseCase {
  constructor(
    private readonly chatRepository: IChatRepository,
    private readonly chatEventService: IChatEventService
  ) {}

  async execute(messageData: {
    roomId: string
    senderId: string
    senderUsername: string
    content: string
    messageType?: 'text' | 'image' | 'file' | 'system'
    metadata?: unknown
    replyTo?: string
  }): Promise<ChatMessage> {
    try {
      validateMessageContent(messageData.content, messageData.messageType)

      const room = await this.chatRepository.findRoomById(messageData.roomId)
      if (!room) {
        throw new ChatRoomNotFoundError(messageData.roomId)
      }

      const isMember = await this.chatRepository.isUserMemberOfRoom(
        messageData.roomId,
        messageData.senderId
      )
      if (!isMember) {
        throw new UserNotMemberError(messageData.senderId, messageData.roomId)
      }

      const message = await this.chatRepository.createMessage({
        roomId: messageData.roomId,
        senderId: messageData.senderId,
        senderUsername: messageData.senderUsername,
        content: messageData.content,
        messageType: messageData.messageType || 'text',
        metadata: messageData.metadata as unknown as ChatMessage['metadata'],
        replyTo: messageData.replyTo
      })

      await this.chatEventService.emitMessageReceived(
        messageData.roomId,
        message
      )

      return message
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Invalid message content')
      ) {
        throw error
      }
      throw new MessageSendingFailedError(
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }
}
