import { IChatEventService } from '@/domain/services/chat-event.service'

export class GetOnlineUsersInRoomUseCase {
  constructor(private readonly chatEventService: IChatEventService) {}

  async execute(roomId: string): Promise<string[]> {
    return this.chatEventService.getOnlineUsersInRoom(roomId)
  }
}
