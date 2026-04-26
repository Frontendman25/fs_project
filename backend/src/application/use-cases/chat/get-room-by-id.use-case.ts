import { IChatRepository } from '@/domain/repositories/chat.repository'
import { ChatRoom } from '@/domain/entities/chat.entity'
import { ChatRoomNotFoundError } from '@/domain/errors/chat.errors'

export class GetRoomByIdUseCase {
  constructor(private readonly chatRepository: IChatRepository) {}

  async execute(roomId: string): Promise<ChatRoom> {
    const room = await this.chatRepository.findRoomById(roomId)
    if (!room) {
      throw new ChatRoomNotFoundError(roomId)
    }
    return room
  }
}
