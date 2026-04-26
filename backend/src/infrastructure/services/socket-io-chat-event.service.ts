/**
 * Socket.IO Chat Event Service Implementation
 * Following Clean Architecture - Infrastructure layer
 * Handles real-time communication using Socket.IO
 */

import { Server as SocketIOServer, type Socket } from 'socket.io'

import { IChatEventService } from '@/domain/services/chat-event.service'
import {
  ChatMessage,
  ChatMember,
  ChatTypingIndicator
} from '@/domain/entities/chat.entity'
import { WebSocketConnectionError } from '@/domain/errors/chat.errors'

export class SocketIOChatEventService implements IChatEventService {
  private io: SocketIOServer
  private userSockets = new Map<string, string>() // userId -> socketId
  private socketUsers = new Map<string, string>() // socketId -> userId

  constructor(io: SocketIOServer) {
    this.io = io
    this.setupSocketHandlers()
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 Socket connected: ${socket.id}`)

      // Handle user authentication
      socket.on('authenticate', (data: { userId: string }) => {
        try {
          this.authenticateUser(socket, data.userId)
        } catch (error) {
          socket.emit('error', {
            message: 'Authentication failed',
            code: 'AUTH_FAILED'
          })
        }
      })

      // Handle joining a room
      socket.on('join_room', async (data: { roomId: string }) => {
        try {
          const userId = this.socketUsers.get(socket.id)
          if (!userId) {
            socket.emit('error', {
              message: 'User not authenticated',
              code: 'NOT_AUTHENTICATED'
            })
            return
          }

          await this.joinUserToRoom(userId, data.roomId)
          socket.join(`room:${data.roomId}`)

          console.log(`👤 User ${userId} joined room ${data.roomId}`)
        } catch (error) {
          socket.emit('error', {
            message: 'Failed to join room',
            code: 'JOIN_FAILED'
          })
        }
      })

      // Handle leaving a room
      socket.on('leave_room', async (data: { roomId: string }) => {
        try {
          const userId = this.socketUsers.get(socket.id)
          if (!userId) {
            return
          }

          await this.removeUserFromRoom(userId, data.roomId)
          socket.leave(`room:${data.roomId}`)

          console.log(`👋 User ${userId} left room ${data.roomId}`)
        } catch (error) {
          socket.emit('error', {
            message: 'Failed to leave room',
            code: 'LEAVE_FAILED'
          })
        }
      })

      // Handle typing indicators
      socket.on('typing_start', (data: { roomId: string }) => {
        const userId = this.socketUsers.get(socket.id)
        if (userId) {
          this.handleTypingStart(userId, data.roomId)
        }
      })

      socket.on('typing_stop', (data: { roomId: string }) => {
        const userId = this.socketUsers.get(socket.id)
        if (userId) {
          this.handleTypingStop(userId, data.roomId)
        }
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        const userId = this.socketUsers.get(socket.id)
        if (userId) {
          this.handleUserDisconnect(userId, socket.id)
        }
        console.log(`🔌 Socket disconnected: ${socket.id}`)
      })
    })
  }

  private authenticateUser(socket: Socket, userId: string): void {
    // Remove previous socket for this user if exists
    const existingSocketId = this.userSockets.get(userId)
    if (existingSocketId) {
      const existingSocket = this.io.sockets.sockets.get(existingSocketId)
      if (existingSocket) {
        existingSocket.disconnect()
      }
    }

    // Update mappings
    this.userSockets.set(userId, socket.id)
    this.socketUsers.set(socket.id, userId)

    console.log(`🔐 User ${userId} authenticated with socket ${socket.id}`)
  }

  private async handleTypingStart(
    userId: string,
    roomId: string
  ): Promise<void> {
    try {
      const indicator: ChatTypingIndicator = {
        roomId,
        userId,
        username: userId, // TODO: Get actual username from user service
        isTyping: true,
        timestamp: new Date()
      }

      await this.emitTypingIndicator(roomId, indicator)
    } catch (error) {
      console.error('Error handling typing start:', error)
    }
  }

  private async handleTypingStop(
    userId: string,
    roomId: string
  ): Promise<void> {
    try {
      const indicator: ChatTypingIndicator = {
        roomId,
        userId,
        username: userId, // TODO: Get actual username from user service
        isTyping: false,
        timestamp: new Date()
      }

      await this.emitTypingIndicator(roomId, indicator)
    } catch (error) {
      console.error('Error handling typing stop:', error)
    }
  }

  private handleUserDisconnect(userId: string, socketId: string): void {
    // Clean up mappings
    this.userSockets.delete(userId)
    this.socketUsers.delete(socketId)

    console.log(`👋 User ${userId} disconnected`)
  }

  // IChatEventService implementation
  async emitMessageReceived(
    roomId: string,
    message: ChatMessage
  ): Promise<void> {
    try {
      this.io.to(`room:${roomId}`).emit('message_received', message)
      console.log(`📨 Message ${message.id} emitted to room ${roomId}`)
    } catch (error) {
      throw new WebSocketConnectionError(message.senderId, 'emit_message')
    }
  }

  async emitUserJoined(roomId: string, member: ChatMember): Promise<void> {
    try {
      this.io.to(`room:${roomId}`).emit('user_joined', {
        roomId,
        user: member
      })
      console.log(`👤 User ${member.userId} joined room ${roomId}`)
    } catch (error) {
      throw new WebSocketConnectionError(member.userId, 'emit_user_joined')
    }
  }

  async emitUserLeft(roomId: string, userId: string): Promise<void> {
    try {
      this.io.to(`room:${roomId}`).emit('user_left', {
        roomId,
        userId
      })
      console.log(`👋 User ${userId} left room ${roomId}`)
    } catch (error) {
      throw new WebSocketConnectionError(userId, 'emit_user_left')
    }
  }

  async emitTypingIndicator(
    roomId: string,
    indicator: ChatTypingIndicator
  ): Promise<void> {
    try {
      this.io.to(`room:${roomId}`).emit('typing_indicator', indicator)
    } catch (error) {
      throw new WebSocketConnectionError(indicator.userId, 'emit_typing')
    }
  }

  async emitRoomUpdated(roomId: string, room: any): Promise<void> {
    try {
      this.io.to(`room:${roomId}`).emit('room_updated', room)
      console.log(`🏠 Room ${roomId} updated`)
    } catch (error) {
      throw new WebSocketConnectionError('system', 'emit_room_updated')
    }
  }

  async emitError(
    userId: string,
    error: { message: string; code?: string }
  ): Promise<void> {
    try {
      const socketId = this.userSockets.get(userId)
      if (socketId) {
        this.io.to(socketId).emit('error', error)
      }
    } catch (err) {
      console.error('Failed to emit error to user:', err)
    }
  }

  async joinUserToRoom(userId: string, roomId: string): Promise<void> {
    try {
      const socketId = this.userSockets.get(userId)
      if (socketId) {
        const socket = this.io.sockets.sockets.get(socketId)
        if (socket) {
          socket.join(`room:${roomId}`)
        }
      }
    } catch (error) {
      throw new WebSocketConnectionError(userId, 'join_room')
    }
  }

  async removeUserFromRoom(userId: string, roomId: string): Promise<void> {
    try {
      const socketId = this.userSockets.get(userId)
      if (socketId) {
        const socket = this.io.sockets.sockets.get(socketId)
        if (socket) {
          socket.leave(`room:${roomId}`)
        }
      }
    } catch (error) {
      throw new WebSocketConnectionError(userId, 'leave_room')
    }
  }

  async getOnlineUsersInRoom(roomId: string): Promise<string[]> {
    try {
      const sockets = await this.io.in(`room:${roomId}`).fetchSockets()
      const userIds: string[] = []

      for (const socket of sockets) {
        const userId = this.socketUsers.get(socket.id)
        if (userId) {
          userIds.push(userId)
        }
      }

      return userIds
    } catch (error) {
      console.error('Error getting online users:', error)
      return []
    }
  }

  async isUserOnline(userId: string): Promise<boolean> {
    return this.userSockets.has(userId)
  }

  // Utility methods
  getSocketIO(): SocketIOServer {
    return this.io
  }

  getUserSocketId(userId: string): string | undefined {
    return this.userSockets.get(userId)
  }

  getSocketUserId(socketId: string): string | undefined {
    return this.socketUsers.get(socketId)
  }
}

