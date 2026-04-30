/**
 * Chat Controller - Handles HTTP requests for chat functionality
 * This is part of the Presentation layer in Clean Architecture
 * Responsible for handling HTTP requests/responses and delegating business logic to use cases
 */

import { Request, Response } from 'express'
import { IChatService } from '@/domain/services/chat.service'
import {
  ChatRoomNotFoundError,
  UserNotMemberError,
  InvalidMessageContentError,
  MessageSendingFailedError
} from '@/domain/errors/chat.errors'
import { normalizeParam } from '@/presentation/utils/requestContext'

export class ChatController {
  constructor(private chatService: IChatService) {}

  /**
   * Create a new chat room
   * POST /api/chat/rooms
   */
  createRoom = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, type, description } = req.body
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
        return
      }

      if (!name || !type) {
        res.status(400).json({
          success: false,
          message: 'Room name and type are required'
        })
        return
      }

      if (!['public', 'private'].includes(type)) {
        res.status(400).json({
          success: false,
          message: 'Room type must be either "public" or "private"'
        })
        return
      }

      const room = await this.chatService.createRoom({
        name,
        type,
        description,
        createdBy: userId
      })

      res.status(201).json({
        success: true,
        message: 'Room created successfully',
        data: { room }
      })
    } catch (error) {
      console.error('Create room error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to create room',
        error:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : undefined
      })
    }
  }

  /**
   * Get user's chat rooms
   * GET /api/chat/rooms
   */
  getUserRooms = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
        return
      }

      const rooms = await this.chatService.getUserRooms(userId)

      res.status(200).json({
        success: true,
        data: { rooms }
      })
    } catch (error) {
      console.error('Get user rooms error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get user rooms',
        error:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : undefined
      })
    }
  }

  /**
   * Get room details
   * GET /api/chat/rooms/:roomId
   */
  getRoom = async (req: Request, res: Response): Promise<void> => {
    try {
      const roomId = normalizeParam(req.params.roomId)
      const userId = req.user?.id

      if (!userId || !roomId) {
        res.status(401).json({
          success: false,
          message: !userId ? 'User not authenticated' : 'Room ID is required'
        })
        return
      }

      const room = await this.chatService.getRoomById(roomId)
      const isMember = await this.chatService.isUserMemberOfRoom(roomId, userId)

      res.status(200).json({
        success: true,
        data: {
          room,
          isMember
        }
      })
    } catch (error) {
      console.error('Get room error:', error)

      if (error instanceof ChatRoomNotFoundError) {
        res.status(404).json({
          success: false,
          message: 'Room not found'
        })
        return
      }

      res.status(500).json({
        success: false,
        message: 'Failed to get room',
        error:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : undefined
      })
    }
  }

  /**
   * Join a chat room
   * POST /api/chat/rooms/:roomId/join
   */
  joinRoom = async (req: Request, res: Response): Promise<void> => {
    try {
      const roomId = normalizeParam(req.params.roomId)
      const userId = req.user?.id
      const username = req.user?.username

      if (!userId || !username || !roomId) {
        res.status(401).json({
          success: false,
          message:
            !userId || !username
              ? 'User not authenticated'
              : 'Room ID is required'
        })
        return
      }

      const member = await this.chatService.joinRoom(roomId, userId, username)

      res.status(200).json({
        success: true,
        message: 'Successfully joined room',
        data: { member }
      })
    } catch (error) {
      console.error('Join room error:', error)

      if (error instanceof ChatRoomNotFoundError) {
        res.status(404).json({
          success: false,
          message: 'Room not found'
        })
        return
      }

      res.status(500).json({
        success: false,
        message: 'Failed to join room',
        error:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : undefined
      })
    }
  }

  /**
   * Leave a chat room
   * POST /api/chat/rooms/:roomId/leave
   */
  leaveRoom = async (req: Request, res: Response): Promise<void> => {
    try {
      const roomId = normalizeParam(req.params.roomId)
      const userId = req.user?.id

      if (!userId || !roomId) {
        res.status(401).json({
          success: false,
          message: !userId ? 'User not authenticated' : 'Room ID is required'
        })
        return
      }

      const success = await this.chatService.leaveRoom(roomId, userId)

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Successfully left room'
        })
      } else {
        res.status(400).json({
          success: false,
          message: 'User is not a member of this room'
        })
      }
    } catch (error) {
      console.error('Leave room error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to leave room',
        error:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : undefined
      })
    }
  }

  /**
   * Get room members
   * GET /api/chat/rooms/:roomId/members
   */
  getRoomMembers = async (req: Request, res: Response): Promise<void> => {
    try {
      const roomId = normalizeParam(req.params.roomId)
      const userId = req.user?.id

      if (!userId || !roomId) {
        res.status(401).json({
          success: false,
          message: !userId ? 'User not authenticated' : 'Room ID is required'
        })
        return
      }

      const members = await this.chatService.getRoomMembers(roomId)

      res.status(200).json({
        success: true,
        data: { members }
      })
    } catch (error) {
      console.error('Get room members error:', error)

      if (error instanceof ChatRoomNotFoundError) {
        res.status(404).json({
          success: false,
          message: 'Room not found'
        })
        return
      }

      res.status(500).json({
        success: false,
        message: 'Failed to get room members',
        error:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : undefined
      })
    }
  }

  /**
   * Get room messages
   * GET /api/chat/rooms/:roomId/messages
   */
  getRoomMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const roomId = normalizeParam(req.params.roomId)
      const userId = req.user?.id
      const { limit, cursor, before, after } = req.query

      if (!userId || !roomId) {
        res.status(401).json({
          success: false,
          message: !userId ? 'User not authenticated' : 'Room ID is required'
        })
        return
      }

      // Check if user is member of the room
      const isMember = await this.chatService.isUserMemberOfRoom(roomId, userId)
      if (!isMember) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You are not a member of this room.'
        })
        return
      }

      const options = {
        limit: limit ? parseInt(limit as string) : undefined,
        cursor: cursor as string,
        before: before ? new Date(before as string) : undefined,
        after: after ? new Date(after as string) : undefined
      }

      const messages = await this.chatService.getMessages(roomId, options)

      res.status(200).json({
        success: true,
        data: { messages }
      })
    } catch (error) {
      console.error('Get room messages error:', error)

      if (error instanceof ChatRoomNotFoundError) {
        res.status(404).json({
          success: false,
          message: 'Room not found'
        })
        return
      }

      if (error instanceof UserNotMemberError) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You are not a member of this room.'
        })
        return
      }

      res.status(500).json({
        success: false,
        message: 'Failed to get room messages',
        error:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : undefined
      })
    }
  }

  /**
   * Get online users in a room
   * GET /api/chat/rooms/:roomId/online
   */
  getOnlineUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const roomId = normalizeParam(req.params.roomId)
      const userId = req.user?.id

      if (!userId || !roomId) {
        res.status(401).json({
          success: false,
          message: !userId ? 'User not authenticated' : 'Room ID is required'
        })
        return
      }

      // Check if user is member of the room
      const isMember = await this.chatService.isUserMemberOfRoom(roomId, userId)
      if (!isMember) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You are not a member of this room.'
        })
        return
      }

      const onlineUsers = await this.chatService.getOnlineUsersInRoom(roomId)

      res.status(200).json({
        success: true,
        data: { onlineUsers }
      })
    } catch (error) {
      console.error('Get online users error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get online users',
        error:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : undefined
      })
    }
  }

  /**
   * Check if user is online
   * GET /api/chat/users/:userId/online
   */
  checkUserOnline = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = normalizeParam(req.params.userId)
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        })
        return
      }

      const isOnline = await this.chatService.isUserOnline(userId)

      res.status(200).json({
        success: true,
        data: { isOnline }
      })
    } catch (error) {
      console.error('Check user online error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to check user online status',
        error:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : undefined
      })
    }
  }
}
