/**
 * Chat Routes - Defines HTTP endpoints for chat functionality
 * This is part of the Presentation layer in Clean Architecture
 * Configures Express routes and connects them to the appropriate controllers and middleware
 */

import { Router } from 'express'
import { ChatController } from '../controllers/chat.controller'
import { AuthMiddleware } from '../middleware/auth.middleware'

/**
 * Create chat routes with authentication middleware
 * @param chatController - Chat controller instance
 * @param authMiddleware - Authentication middleware instance
 * @returns Express router with chat routes
 */
export function createChatRoutes(
  chatController: ChatController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router()

  // Apply authentication middleware to all chat routes
  router.use(authMiddleware.authenticateToken)

  // Chat Room routes
  router.post('/rooms', chatController.createRoom)
  router.get('/rooms', chatController.getUserRooms)
  router.get('/rooms/:roomId', chatController.getRoom)
  router.post('/rooms/:roomId/join', chatController.joinRoom)
  router.post('/rooms/:roomId/leave', chatController.leaveRoom)
  router.get('/rooms/:roomId/members', chatController.getRoomMembers)
  router.get('/rooms/:roomId/messages', chatController.getRoomMessages)
  router.get('/rooms/:roomId/online', chatController.getOnlineUsers)

  // User status routes
  router.get('/users/:userId/online', chatController.checkUserOnline)

  return router
}

/**
 * Chat Routes Class - Alternative implementation using class-based approach
 * This is part of the Presentation layer in Clean Architecture
 * Configures Express routes and connects them to the appropriate controllers and middleware
 */
export class ChatRoutes {
  private router: Router
  private chatController: ChatController
  private authMiddleware: AuthMiddleware

  constructor(chatController: ChatController, authMiddleware: AuthMiddleware) {
    this.router = Router()
    this.chatController = chatController
    this.authMiddleware = authMiddleware

    // Configure routes
    this.configureRoutes()
  }

  /**
   * Configure all chat routes
   * @private
   */
  private configureRoutes(): void {
    // Apply authentication middleware to all chat routes
    this.router.use(this.authMiddleware.authenticateToken)

    // Chat Room routes
    this.router.post('/rooms', this.chatController.createRoom)
    this.router.get('/rooms', this.chatController.getUserRooms)
    this.router.get('/rooms/:roomId', this.chatController.getRoom)
    this.router.post('/rooms/:roomId/join', this.chatController.joinRoom)
    this.router.post('/rooms/:roomId/leave', this.chatController.leaveRoom)
    this.router.get(
      '/rooms/:roomId/members',
      this.chatController.getRoomMembers
    )
    this.router.get(
      '/rooms/:roomId/messages',
      this.chatController.getRoomMessages
    )
    this.router.get('/rooms/:roomId/online', this.chatController.getOnlineUsers)

    // User status routes
    this.router.get(
      '/users/:userId/online',
      this.chatController.checkUserOnline
    )
  }

  /**
   * Get the configured router
   * @returns Express router with chat routes
   */
  getRouter(): Router {
    return this.router
  }
}
