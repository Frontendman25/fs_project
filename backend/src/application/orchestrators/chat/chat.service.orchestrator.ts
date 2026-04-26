import { IChatService } from '@/domain/services/chat.service'
import { IChatRepository } from '@/domain/repositories/chat.repository'
import { IChatEventService } from '@/domain/services/chat-event.service'
import {
  ChatMessage,
  ChatRoom,
  ChatMember,
  ChatTypingIndicator,
  CreateChatRoomData
} from '@/domain/entities/chat.entity'

import { SendMessageUseCase } from '@/application/use-cases/chat/send-message.use-case'
import { GetMessagesUseCase } from '@/application/use-cases/chat/get-messages.use-case'
import { JoinRoomUseCase } from '@/application/use-cases/chat/join-room.use-case'
import { LeaveRoomUseCase } from '@/application/use-cases/chat/leave-room.use-case'
import { GetUserRoomsUseCase } from '@/application/use-cases/chat/get-user-rooms.use-case'
import { CreateRoomUseCase } from '@/application/use-cases/chat/create-room.use-case'
import { GetRoomMembersUseCase } from '@/application/use-cases/chat/get-room-members.use-case'
import { UpdateTypingStatusUseCase } from '@/application/use-cases/chat/update-typing-status.use-case'
import { GetTypingIndicatorsUseCase } from '@/application/use-cases/chat/get-typing-indicators.use-case'
import { GetRoomByIdUseCase } from '@/application/use-cases/chat/get-room-by-id.use-case'
import { IsUserMemberOfRoomUseCase } from '@/application/use-cases/chat/is-user-member-of-room.use-case'
import { GetOnlineUsersInRoomUseCase } from '@/application/use-cases/chat/get-online-users-in-room.use-case'
import { IsUserOnlineUseCase } from '@/application/use-cases/chat/is-user-online.use-case'

/**
 * Composes chat use-cases and exposes the domain `IChatService` contract
 * (controllers and containers depend on a single port).
 */
export class ChatServiceOrchestrator implements IChatService {
  private readonly sendMessageUseCase: SendMessageUseCase
  private readonly getMessagesUseCase: GetMessagesUseCase
  private readonly joinRoomUseCase: JoinRoomUseCase
  private readonly leaveRoomUseCase: LeaveRoomUseCase
  private readonly getUserRoomsUseCase: GetUserRoomsUseCase
  private readonly createRoomUseCase: CreateRoomUseCase
  private readonly getRoomMembersUseCase: GetRoomMembersUseCase
  private readonly updateTypingStatusUseCase: UpdateTypingStatusUseCase
  private readonly getTypingIndicatorsUseCase: GetTypingIndicatorsUseCase
  private readonly getRoomByIdUseCase: GetRoomByIdUseCase
  private readonly isUserMemberOfRoomUseCase: IsUserMemberOfRoomUseCase
  private readonly getOnlineUsersInRoomUseCase: GetOnlineUsersInRoomUseCase
  private readonly isUserOnlineUseCase: IsUserOnlineUseCase

  constructor(
    chatRepository: IChatRepository,
    chatEventService: IChatEventService
  ) {
    this.sendMessageUseCase = new SendMessageUseCase(
      chatRepository,
      chatEventService
    )
    this.getMessagesUseCase = new GetMessagesUseCase(chatRepository)
    this.joinRoomUseCase = new JoinRoomUseCase(chatRepository, chatEventService)
    this.leaveRoomUseCase = new LeaveRoomUseCase(
      chatRepository,
      chatEventService
    )
    this.getUserRoomsUseCase = new GetUserRoomsUseCase(chatRepository)
    this.createRoomUseCase = new CreateRoomUseCase(
      chatRepository,
      chatEventService
    )
    this.getRoomMembersUseCase = new GetRoomMembersUseCase(chatRepository)
    this.updateTypingStatusUseCase = new UpdateTypingStatusUseCase(
      chatEventService
    )
    this.getTypingIndicatorsUseCase = new GetTypingIndicatorsUseCase()
    this.getRoomByIdUseCase = new GetRoomByIdUseCase(chatRepository)
    this.isUserMemberOfRoomUseCase = new IsUserMemberOfRoomUseCase(
      chatRepository
    )
    this.getOnlineUsersInRoomUseCase = new GetOnlineUsersInRoomUseCase(
      chatEventService
    )
    this.isUserOnlineUseCase = new IsUserOnlineUseCase(chatEventService)
  }

  sendMessage(messageData: {
    roomId: string
    senderId: string
    senderUsername: string
    content: string
    messageType?: 'text' | 'image' | 'file' | 'system'
    metadata?: any
    replyTo?: string
  }): Promise<ChatMessage> {
    return this.sendMessageUseCase.execute(messageData)
  }

  getMessages(
    roomId: string,
    options?: {
      limit?: number
      cursor?: string
      before?: Date
      after?: Date
    }
  ): Promise<ChatMessage[]> {
    return this.getMessagesUseCase.execute(roomId, options)
  }

  joinRoom(
    roomId: string,
    userId: string,
    username: string
  ): Promise<ChatMember> {
    return this.joinRoomUseCase.execute(roomId, userId, username)
  }

  leaveRoom(roomId: string, userId: string): Promise<boolean> {
    return this.leaveRoomUseCase.execute(roomId, userId)
  }

  getUserRooms(userId: string): Promise<ChatRoom[]> {
    return this.getUserRoomsUseCase.execute(userId)
  }

  createRoom(roomData: CreateChatRoomData): Promise<ChatRoom> {
    return this.createRoomUseCase.execute(roomData)
  }

  getRoomMembers(roomId: string): Promise<ChatMember[]> {
    return this.getRoomMembersUseCase.execute(roomId)
  }

  updateTypingStatus(
    roomId: string,
    userId: string,
    username: string,
    isTyping: boolean
  ): Promise<void> {
    return this.updateTypingStatusUseCase.execute(
      roomId,
      userId,
      username,
      isTyping
    )
  }

  getTypingIndicators(roomId: string): Promise<ChatTypingIndicator[]> {
    return this.getTypingIndicatorsUseCase.execute(roomId)
  }

  getRoomById(roomId: string): Promise<ChatRoom> {
    return this.getRoomByIdUseCase.execute(roomId)
  }

  isUserMemberOfRoom(roomId: string, userId: string): Promise<boolean> {
    return this.isUserMemberOfRoomUseCase.execute(roomId, userId)
  }

  getOnlineUsersInRoom(roomId: string): Promise<string[]> {
    return this.getOnlineUsersInRoomUseCase.execute(roomId)
  }

  isUserOnline(userId: string): Promise<boolean> {
    return this.isUserOnlineUseCase.execute(userId)
  }
}
