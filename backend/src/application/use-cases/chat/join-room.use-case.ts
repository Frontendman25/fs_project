import { IChatRepository } from '@/domain/repositories/chat.repository'
import { IChatEventService } from '@/domain/services/chat-event.service'
import { ChatMember } from '@/domain/entities/chat.entity'
import {
  ChatRoomNotFoundError,
  MessageSendingFailedError
} from '@/domain/errors/chat.errors'

export class JoinRoomUseCase {
  constructor(
    private readonly chatRepository: IChatRepository,
    private readonly chatEventService: IChatEventService
  ) {}

  async execute(
    roomId: string,
    userId: string,
    username: string
  ): Promise<ChatMember> {
    try {
      const room = await this.chatRepository.findRoomById(roomId)
      if (!room) {
        throw new ChatRoomNotFoundError(roomId)
      }

      const existingMember = await this.chatRepository.findMember(
        roomId,
        userId
      )
      if (existingMember) {
        return existingMember
      }

      const member = await this.chatRepository.addMember({
        roomId,
        userId,
        username,
        role: 'member'
      })

      await this.chatEventService.emitUserJoined(roomId, member)
      await this.chatEventService.joinUserToRoom(userId, roomId)

      return member
    } catch (error) {
      throw new MessageSendingFailedError(
        error instanceof Error ? error.message : 'Failed to join room'
      )
    }
  }
}
