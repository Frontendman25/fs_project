import { IChatEventService } from '@/domain/services/chat-event.service'

export class IsUserOnlineUseCase {
  constructor(private readonly chatEventService: IChatEventService) {}

  async execute(userId: string): Promise<boolean> {
    return this.chatEventService.isUserOnline(userId)
  }
}
