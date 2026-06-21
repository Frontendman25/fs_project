import { Request, Response } from 'express'
import multer from 'multer'
import { Readable } from 'stream'

import { FileUseCase } from '../../application/use-cases/file.use-case'

import { normalizeParam } from '../utils/requestContext'
import { toFileClientDto } from '../mappers/file-response.mapper'

/**
 * File Controller - Handles HTTP requests for file operations
 * This is part of the Presentation layer in Clean Architecture
 * Manages file upload and download endpoints
 */
export class FileController {
  constructor(private fileUseCase: FileUseCase) {}

  /**
   * Handle file upload via POST /upload
   * @param req - Express request object
   * @param res - Express response object
   */
  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded'
        })
        return
      }

      const { originalname, mimetype, size, buffer } = req.file

      // if (!req?.user) res.status(401).send('Unauthorized')

      const uploadedBy = req.body.uploadedBy || req?.user?.id // Get from auth middleware if available

      // Create readable stream from buffer
      const fileStream = new Readable({
        read() {
          this.push(buffer)
          this.push(null) // End the stream
        }
      })

      // Upload file using use case
      const file = await this.fileUseCase.uploadFile(
        fileStream,
        originalname,
        mimetype,
        size,
        uploadedBy
      )

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: toFileClientDto(file)
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Handle file download via GET /files/:id
   * @param req - Express request object
   * @param res - Express response object
   */
  async downloadFile(req: Request, res: Response): Promise<void> {
    try {
      const id = normalizeParam(req.params.id)

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'File ID is required'
        })
        return
      }

      // Get file stream from use case
      const { file, stream } = await this.fileUseCase.getFileStream(id)

      // Set response headers
      res.setHeader('Content-Type', file.mimeType)
      const disposition =
        file.mimeType.startsWith('image/') ||
        file.mimeType.startsWith('video/') ||
        file.mimeType === 'application/pdf'
          ? 'inline'
          : 'attachment'
      res.setHeader(
        'Content-Disposition',
        `${disposition}; filename="${file.originalName}"`
      )
      res.setHeader('Content-Length', file.size.toString())
      res.setHeader('X-File-ID', file.id)
      res.setHeader('X-Compression-Ratio', file.compressionRatio.toString())

      // Handle stream errors
      stream.on('error', (error) => {
        console.error('Error streaming file:', error)
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Failed to stream file'
          })
        }
      })

      // Pipe the stream to response
      stream.pipe(res)
    } catch (error) {
      console.error('Error downloading file:', error)

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'File not found'
        })
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to download file',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }

  /**
   * Get file metadata via GET /files/:id/metadata
   * @param req - Express request object
   * @param res - Express response object
   */
  async getFileMetadata(req: Request, res: Response): Promise<void> {
    try {
      const id = normalizeParam(req.params.id)

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'File ID is required'
        })
        return
      }

      const file = await this.fileUseCase.getFileById(id)

      if (!file) {
        res.status(404).json({
          success: false,
          error: 'File not found'
        })
        return
      }

      res.json({
        success: true,
        data: toFileClientDto(file, {
          includeChecksum: true,
          includeUpdatedAt: true
        })
      })
    } catch (error) {
      console.error('Error getting file metadata:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get file metadata',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Get files by user via GET /files/user/:userId
   * @param req - Express request object
   * @param res - Express response object
   */
  async getFilesByUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = normalizeParam(req.params.userId)

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        })
        return
      }

      const files = await this.fileUseCase.getFilesByUser(userId)

      res.json({
        success: true,
        data: files.map((file) => toFileClientDto(file))
      })
    } catch (error) {
      console.error('Error getting files by user:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get files by user',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Search files via GET /files/search?q=query
   * @param req - Express request object
   * @param res - Express response object
   */
  async searchFiles(req: Request, res: Response): Promise<void> {
    try {
      const { q: query, type: mimeType } = req.query

      if (!query && !mimeType) {
        res.status(400).json({
          success: false,
          error: 'Search query or MIME type is required'
        })
        return
      }

      let files
      if (mimeType) {
        files = await this.fileUseCase.getFilesByMimeType(mimeType as string)
      } else {
        files = await this.fileUseCase.searchFilesByName(query as string)
      }

      res.json({
        success: true,
        data: files.map((file) => toFileClientDto(file))
      })
    } catch (error) {
      console.error('Error searching files:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to search files',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Get files with pagination via GET /files?page=1&limit=10
   * @param req - Express request object
   * @param res - Express response object
   */
  async getFilesWithPagination(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10

      if (page < 1 || limit < 1 || limit > 100) {
        res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters'
        })
        return
      }

      const result = await this.fileUseCase.getFilesWithPagination(page, limit)

      res.json({
        success: true,
        data: result.files.map((file) => toFileClientDto(file)),
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          total: result.total,
          limit
        }
      })
    } catch (error) {
      console.error('Error getting files with pagination:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get files',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Delete file via DELETE /files/:id
   * @param req - Express request object
   * @param res - Express response object
   */
  async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const id = normalizeParam(req.params.id)

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'File ID is required'
        })
        return
      }

      const deleted = await this.fileUseCase.deleteFile(id)

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'File not found'
        })
        return
      }

      res.json({
        success: true,
        message: 'File deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting file:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Get storage statistics via GET /files/stats
   * @param req - Express request object
   * @param res - Express response object
   */
  async getStorageStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.fileUseCase.getStorageStats()

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('Error getting storage stats:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get storage statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

/**
 * Multer configuration for file uploads
 */
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(), // Store files in memory for processing
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 1 // Only allow single file upload
  },
  fileFilter: (req, file, cb) => {
    // Add file type validation if needed
    // For now, allow all file types
    cb(null, true)
  }
})
