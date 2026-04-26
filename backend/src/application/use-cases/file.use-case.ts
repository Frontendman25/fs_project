import { Readable } from 'stream'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

import {
  File,
  CreateFileData,
  FileUploadProgress
} from '../../domain/entities/file.entity'
import { IFileRepository } from '../../domain/repositories/file.repository'
import {
  IFileStorageService,
  FileStorageResult
} from '../../domain/services/file-storage.service'
import { IFileEventService } from '../../domain/services/file-event.service'

/**
 * File Use Case - Application layer business logic for file operations
 * This is part of the Application layer in Clean Architecture
 * Orchestrates file upload, storage, and retrieval operations
 */
export class FileUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private fileStorageService: IFileStorageService,
    private fileEventService: IFileEventService
  ) {}

  /**
   * Upload a file with compression and metadata storage
   * @param fileStream - Readable stream of the file data
   * @param originalName - Original filename
   * @param mimeType - MIME type of the file
   * @param size - Original file size
   * @param uploadedBy - Optional user ID who uploaded the file
   * @returns Promise that resolves to the created File entity
   */
  async uploadFile(
    fileStream: Readable,
    originalName: string,
    mimeType: string,
    size: number,
    uploadedBy?: string
  ): Promise<File> {
    const fileId = uuidv4()
    const fileExtension = path.extname(originalName)
    const storedFilename = `${fileId}${fileExtension}`

    try {
      // Emit upload started event
      this.fileEventService.emitUploadStarted(fileId, originalName, size)

      // Emit progress event for receiving stage
      const progressReceiving: FileUploadProgress = {
        fileId,
        bytesReceived: 0,
        totalBytes: size,
        percentage: 0,
        stage: 'receiving'
      }
      this.fileEventService.emitUploadProgress(progressReceiving)

      // Store file with compression
      const progressCompressing: FileUploadProgress = {
        fileId,
        bytesReceived: size,
        totalBytes: size,
        percentage: 50,
        stage: 'compressing'
      }
      this.fileEventService.emitUploadProgress(progressCompressing)

      const storageResult: FileStorageResult =
        await this.fileStorageService.storeFile(
          fileStream,
          storedFilename,
          true // Enable compression
        )

      // Emit progress event for saving stage
      const progressSaving: FileUploadProgress = {
        fileId,
        bytesReceived: size,
        totalBytes: size,
        percentage: 80,
        stage: 'saving'
      }
      this.fileEventService.emitUploadProgress(progressSaving)

      // Create file metadata record
      const createFileData: CreateFileData = {
        originalName,
        filename: storageResult.filename,
        mimeType,
        size,
        compressedSize: storageResult.compressedSize,
        path: storageResult.path,
        uploadedBy,
        isCompressed: storageResult.isCompressed,
        compressionRatio: storageResult.compressionRatio,
        checksum: storageResult.checksum,
        storageType:
          process.env.STORAGE_TYPE! === 'cloudinary' ? 'cloudinary' : 'local'
      }

      const file = await this.fileRepository.create(createFileData)

      // Emit progress event for completion
      const progressCompleted: FileUploadProgress = {
        fileId,
        bytesReceived: size,
        totalBytes: size,
        percentage: 100,
        stage: 'completed'
      }
      this.fileEventService.emitUploadProgress(progressCompleted)

      // Emit upload completed event
      this.fileEventService.emitUploadCompleted(
        file.id,
        originalName,
        storageResult.path,
        storageResult.compressionRatio
      )

      return file
    } catch (error) {
      // Emit upload error event
      this.fileEventService.emitUploadError(
        fileId,
        originalName,
        error as Error
      )

      // Emit error progress event
      const progressError: FileUploadProgress = {
        fileId,
        bytesReceived: 0,
        totalBytes: size,
        percentage: 0,
        stage: 'error'
      }
      this.fileEventService.emitUploadProgress(progressError)

      throw error
    }
  }

  /**
   * Retrieve a file as a readable stream
   * @param fileId - ID of the file to retrieve
   * @returns Promise that resolves to file metadata and readable stream
   */
  async getFileStream(
    fileId: string
  ): Promise<{ file: File; stream: Readable }> {
    try {
      // Get file metadata
      const file = await this.fileRepository.findById(fileId)
      if (!file) {
        throw new Error(`File with ID ${fileId} not found`)
      }

      // Emit download started event
      this.fileEventService.emitDownloadStarted(file.id, file.originalName)

      // Get file stream with decompression if needed
      const stream = await this.fileStorageService.retrieveFile(
        file.filename,
        file.isCompressed
      )

      // Set up stream completion tracking
      let bytesTransferred = 0
      stream.on('data', (chunk) => {
        bytesTransferred += chunk.length
      })

      stream.on('end', () => {
        this.fileEventService.emitDownloadCompleted(
          file.id,
          file.originalName,
          bytesTransferred
        )
      })

      stream.on('error', (error) => {
        this.fileEventService.emitDownloadError(
          file.id,
          file.originalName,
          error
        )
      })

      return { file, stream }
    } catch (error) {
      throw error
    }
  }

  /**
   * Get file metadata by ID
   * @param fileId - ID of the file
   * @returns Promise that resolves to File or null if not found
   */
  async getFileById(fileId: string): Promise<File | null> {
    return await this.fileRepository.findById(fileId)
  }

  /**
   * Get files uploaded by a specific user
   * @param userId - User ID to filter by
   * @returns Promise that resolves to array of Files
   */
  async getFilesByUser(userId: string): Promise<File[]> {
    return await this.fileRepository.findByUserId(userId)
  }

  /**
   * Search files by name pattern
   * @param namePattern - Pattern to match against original filename
   * @returns Promise that resolves to array of Files
   */
  async searchFilesByName(namePattern: string): Promise<File[]> {
    return await this.fileRepository.findByNamePattern(namePattern)
  }

  /**
   * Get files by MIME type
   * @param mimeType - MIME type to filter by
   * @returns Promise that resolves to array of Files
   */
  async getFilesByMimeType(mimeType: string): Promise<File[]> {
    return await this.fileRepository.findByMimeType(mimeType)
  }

  /**
   * Delete a file (both metadata and physical file)
   * @param fileId - ID of the file to delete
   * @returns Promise that resolves to boolean indicating success
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      // Get file metadata first
      const file = await this.fileRepository.findById(fileId)
      if (!file) {
        return false
      }

      // Delete physical file
      const physicalDeleted = await this.fileStorageService.deleteFile(
        file.filename
      )
      if (!physicalDeleted) {
        throw new Error('Failed to delete physical file')
      }

      // Delete metadata record
      const metadataDeleted = await this.fileRepository.delete(fileId)
      if (!metadataDeleted) {
        throw new Error('Failed to delete file metadata')
      }

      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  }

  /**
   * Get files with pagination
   * @param page - Page number (1-based)
   * @param limit - Number of files per page
   * @returns Promise that resolves to paginated files and metadata
   */
  async getFilesWithPagination(
    page: number,
    limit: number
  ): Promise<{
    files: File[]
    total: number
    totalPages: number
    currentPage: number
  }> {
    const offset = (page - 1) * limit
    const [files, total] = await Promise.all([
      this.fileRepository.findWithPagination(offset, limit),
      this.fileRepository.count()
    ])

    return {
      files,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    }
  }

  /**
   * Get storage statistics
   * @returns Promise that resolves to storage statistics
   */
  async getStorageStats() {
    return await this.fileStorageService.getStorageStats()
  }
}
