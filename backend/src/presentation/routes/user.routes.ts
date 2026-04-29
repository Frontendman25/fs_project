import { Router } from 'express'

import {
  UserController,
  uploadMiddleware
} from '../controllers/user.controller'

/**
 * User Routes - Defines HTTP endpoints for user operations
 * This is part of the Presentation layer in Clean Architecture
 * Maps HTTP routes to controller methods
 */
export function createUserRoutes(userController: UserController): Router {
  const router = Router()

  /**
   * GET /users/:id - Get user profile with avatar URL
   * Returns user data including the Cloudinary avatar URL
   */
  router.get('/users/:id', (req, res) => {
    userController.getUserProfile(req, res)
  })

  /**
   * POST /users/:id/avatar - Upload or update a user's avatar
   * Uses multer middleware to handle multipart/form-data
   * Accepts image files for user profile pictures
   */
  router.post(
    '/users/:id/avatar',
    uploadMiddleware.single('avatar'),
    (req, res) => {
      userController.uploadAvatar(req, res)
    }
  )

  /**
   * DELETE /users/:id/avatar - Delete user's avatar
   * Removes the avatar file and updates user record
   */
  router.delete('/users/:id/avatar', (req, res) => {
    userController.deleteAvatar(req, res)
  })

  return router
}
