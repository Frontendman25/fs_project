import { IChatRepository } from '@/domain/repositories/chat.repository'
import { IChatEventService } from '@/domain/services/chat-event.service'
import { ChatRoom, CreateChatRoomData } from '@/domain/entities/chat.entity'
import { MessageSendingFailedError } from '@/domain/errors/chat.errors'

export class CreateRoomUseCase {
  constructor(
    private readonly chatRepository: IChatRepository,
    private readonly chatEventService: IChatEventService
  ) {}

  async execute(roomData: CreateChatRoomData): Promise<ChatRoom> {
    try {
      const room = await this.chatRepository.createRoom(roomData)

      await this.chatRepository.addMember({
        roomId: room.id,
        userId: roomData.createdBy,
        username: roomData.createdBy,
        role: 'admin'
      })

      await this.chatEventService.joinUserToRoom(roomData.createdBy, room.id)

      return room
    } catch (error) {
      throw new MessageSendingFailedError(
        error instanceof Error ? error.message : 'Failed to create room'
      )
    }
  }
}
