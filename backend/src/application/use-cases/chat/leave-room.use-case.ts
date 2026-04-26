import { IChatRepository } from '@/domain/repositories/chat.repository'
import { IChatEventService } from '@/domain/services/chat-event.service'
import { MessageSendingFailedError } from '@/domain/errors/chat.errors'

export class LeaveRoomUseCase {
  constructor(
    private readonly chatRepository: IChatRepository,
    private readonly chatEventService: IChatEventService
  ) {}

  async execute(roomId: string, userId: string): Promise<boolean> {
    try {
      const isMember = await this.chatRepository.isUserMemberOfRoom(
        roomId,
        userId
      )
      if (!isMember) {
        return false
      }

      const success = await this.chatRepository.removeMember(roomId, userId)

      if (success) {
        await this.chatEventService.emitUserLeft(roomId, userId)
        await this.chatEventService.removeUserFromRoom(userId, roomId)
      }

      return success
    } catch (error) {
      throw new MessageSendingFailedError(
        error instanceof Error ? error.message : 'Failed to leave room'
      )
    }
  }
}
