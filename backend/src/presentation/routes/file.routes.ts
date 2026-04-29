import { Router } from 'express'

import {
  FileController,
  uploadMiddleware
} from '../controllers/file.controller'

/**
 * File Routes - Defines HTTP endpoints for file operations
 * This is part of the Presentation layer in Clean Architecture
 * Maps HTTP routes to controller methods
 */
export function createFileRoutes(fileController: FileController): Router {
  const router = Router()

  /**
   * POST /upload - Upload a file
   * Uses multer middleware to handle multipart/form-data
   */
  router.post('/upload', uploadMiddleware.single('file'), (req, res) => {
    fileController.uploadFile(req, res)
  })

  /**
   * GET /files/:id - Download a file by ID
   * Returns the file as a stream with appropriate headers
   */
  router.get('/files/:id', (req, res) => {
    fileController.downloadFile(req, res)
  })

  /**
   * GET /files/:id/metadata - Get file metadata by ID
   * Returns file information without downloading the actual file
   */
  router.get('/files/:id/metadata', (req, res) => {
    fileController.getFileMetadata(req, res)
  })

  /**
   * GET /files/user/:userId - Get files uploaded by a specific user
   * Returns array of files for the specified user
   */
  router.get('/files/user/:userId', (req, res) => {
    fileController.getFilesByUser(req, res)
  })

  /**
   * GET /files/search - Search files by name or MIME type
   * Query parameters: q (search query), type (MIME type)
   */
  router.get('/files/search', (req, res) => {
    fileController.searchFiles(req, res)
  })

  /**
   * GET /files - Get files with pagination
   * Query parameters: page (page number), limit (items per page)
   */
  router.get('/files', (req, res) => {
    fileController.getFilesWithPagination(req, res)
  })

  /**
   * DELETE /files/:id - Delete a file by ID
   * Removes both the file metadata and physical file
   */
  router.delete('/files/:id', (req, res) => {
    fileController.deleteFile(req, res)
  })

  /**
   * GET /files/stats - Get storage statistics
   * Returns information about storage usage and file counts
   */
  router.get('/files/stats', (req, res) => {
    fileController.getStorageStats(req, res)
  })

  return router
}
