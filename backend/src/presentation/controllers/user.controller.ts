import { Request, Response } from 'express'
import multer from 'multer'
import { Readable } from 'stream'

import { FileUseCase } from '../../application/use-cases/file.use-case'
import { GetUserWithAvatarUseCase } from '../../application/use-cases/user/get-user-with-avatar.use-case'
import { UpdateUserAvatarUseCase } from '../../application/use-cases/user/update-user-avatar.use-case'
import { RemoveUserAvatarUseCase } from '../../application/use-cases/user/remove-user-avatar.use-case'

/**
 * User Controller - Handles HTTP requests for user operations
 * This is part of the Presentation layer in Clean Architecture
 * Manages user-related endpoints including avatar uploads
 */
export class UserController {
  constructor(
    private getUserWithAvatar: GetUserWithAvatarUseCase,
    private updateUserAvatar: UpdateUserAvatarUseCase,
    private removeUserAvatar: RemoveUserAvatarUseCase,
    private fileUseCase: FileUseCase
  ) {}

  /**
   * Handle avatar upload via POST /users/:id/avatar
   * @param req - Express request object
   * @param res - Express response object
   */
  async uploadAvatar(req: Request, res: Response): Promise<void> {
    try {
      const { id: userId } = req.params

      // Validate user ID parameter
      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        })
        return
      }

      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No avatar file uploaded'
        })
        return
      }

      // Validate file type (only allow images)
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        res.status(400).json({
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed'
        })
        return
      }

      // Check if user exists
      const user = await this.getUserWithAvatar.execute(userId)
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        })

        return
      }

      const { originalname, mimetype, size, buffer } = req.file

      // Create readable stream from buffer
      const fileStream = new Readable({
        read() {
          this.push(buffer)
          this.push(null) // End the stream
        }
      })

      // Upload file using FileUseCase (reuse existing file service logic)
      const uploadedFile = await this.fileUseCase.uploadFile(
        fileStream,
        originalname,
        mimetype,
        size,
        userId
      )

      // Update user record to link the file as avatar
      const updatedUser = await this.updateUserAvatar.execute(
        userId,
        uploadedFile.id
      )

      if (!updatedUser) {
        // If user update fails, we might want to clean up the uploaded file
        // For now, we'll still return success since the file was uploaded
        console.warn(`Failed to update user ${userId} with avatar file ${uploadedFile.id}`)
      }

      // Return metadata about the uploaded avatar
      res.status(201).json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          id: uploadedFile.id,
          originalName: uploadedFile.originalName,
          mimeType: uploadedFile.mimeType,
          size: uploadedFile.size,
          compressedSize: uploadedFile.compressedSize,
          compressionRatio: uploadedFile.compressionRatio,
          isCompressed: uploadedFile.isCompressed,
          uploadedBy: uploadedFile.uploadedBy,
          createdAt: uploadedFile.createdAt,
          // URL for accessing the avatar file
          url: uploadedFile.path, // This is the Cloudinary URL
          path: uploadedFile.path
        }
      })
    } catch (error) {
      console.error('Error uploading avatar:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to upload avatar',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Get user profile with avatar URL via GET /users/:id
   * @param req - Express request object
   * @param res - Express response object
   */
  async getUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id: userId } = req.params

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        })

        return
      }

      // Get user with avatar URL
      const userWithAvatar = await this.getUserWithAvatar.execute(userId)
      if (!userWithAvatar) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        })

        return
      }

      res.json({
        success: true,
        data: {
          id: userWithAvatar.id,
          username: userWithAvatar.username,
          email: userWithAvatar.email,
          avatarUrl: userWithAvatar.avatarUrl,
          createdAt: userWithAvatar.createdAt,
          updatedAt: userWithAvatar.updatedAt
        }
      })
    } catch (error) {
      console.error('Error getting user profile:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get user profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Delete user avatar via DELETE /users/:id/avatar
   * @param req - Express request object
   * @param res - Express response object
   */
  async deleteAvatar(req: Request, res: Response): Promise<void> {
    try {
      const { id: userId } = req.params

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        })
        return
      }

      // Check if user exists and get avatar info
      const user = await this.getUserWithAvatar.execute(userId)
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        })
        return
      }

      if (!user.avatarFileId) {
        res.status(404).json({
          success: false,
          error: 'No avatar found for this user'
        })
        return
      }

      // Delete the file from storage
      const deleted = await this.fileUseCase.deleteFile(user.avatarFileId)
      if (!deleted) {
        res.status(500).json({
          success: false,
          error: 'Failed to delete avatar file'
        })
        return
      }

      // Update user record to remove avatar reference
      const updatedUser = await this.removeUserAvatar.execute(userId)

      if (!updatedUser) {
        console.warn(`Failed to update user ${userId} after avatar deletion`)
      }

      res.json({
        success: true,
        message: 'Avatar deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting avatar:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to delete avatar',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

/**
 * Multer configuration for avatar uploads
 * More restrictive than general file uploads (images only, smaller size limit)
 */
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(), // Store files in memory for processing
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size for avatars
    files: 1 // Only allow single file upload
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files for avatars
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(null, false)
    }
  }
})