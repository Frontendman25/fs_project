import { IFileRepository } from '../../../domain/repositories/file.repository'
import { ILoggerService } from '@/domain/services/logger.service'
import {
  File,
  CreateFileData,
  UpdateFileData
} from '../../../domain/entities/file.entity'
import {
  FileDocument,
  FileModel
} from '@/infrastructure/database/schemas/mongodb/file'

/**
 * MongoDB File Repository Implementation
 * This is part of the Infrastructure layer in Clean Architecture
 * Implements file metadata persistence using MongoDB and Mongoose
 */
export class MongoDBFileRepository implements IFileRepository {
  private logger: ILoggerService

  constructor(logger: ILoggerService) {
    this.logger = logger.child({ service: 'MongoDBFileRepository' })
  }

  /**
   * Create a new file record
   * @param fileData - Data to create the file record
   * @returns Promise that resolves to the created File
   */
  async create(fileData: CreateFileData): Promise<File> {
    try {
      const fileDocument = new FileModel(fileData)
      const savedFile = await fileDocument.save()

      return this.mapMongoFileToEntity(savedFile)
    } catch (error) {
      this.logger.error({ error, fileData }, 'Failed to create file record')
      throw new Error('Failed to create file record')
    }
  }

  /**
   * Find a file by its ID
   * @param id - File ID to search for
   * @returns Promise that resolves to File or null if not found
   */
  async findById(id: string): Promise<File | null> {
    try {
      const file = await FileModel.findById(id).exec()
      return file ? this.mapMongoFileToEntity(file) : null
    } catch (error) {
      this.logger.error({ error, id }, 'Failed to find file by ID')
      throw new Error('Failed to find file by ID')
    }
  }

  /**
   * Find files by user ID
   * @param userId - User ID to search for
   * @returns Promise that resolves to array of Files
   */
  async findByUserId(userId: string): Promise<File[]> {
    try {
      const files = await FileModel.find({ uploadedBy: userId })
        .sort({ createdAt: -1 })
        .exec()

      return files.map((file: FileDocument) => this.mapMongoFileToEntity(file))
    } catch (error) {
      this.logger.error({ error, userId }, 'Failed to find files by user ID')
      throw new Error('Failed to find files by user ID')
    }
  }

  /**
   * Find files by original name pattern
   * @param namePattern - Pattern to match against original filename
   * @returns Promise that resolves to array of Files
   */
  async findByNamePattern(namePattern: string): Promise<File[]> {
    try {
      const files = await FileModel.find({
        originalName: { $regex: namePattern, $options: 'i' }
      })
        .sort({ createdAt: -1 })
        .exec()

      return files.map((file: FileDocument) => this.mapMongoFileToEntity(file))
    } catch (error) {
      this.logger.error(
        { error, namePattern },
        'Failed to find files by name pattern'
      )
      throw new Error('Failed to find files by name pattern')
    }
  }

  /**
   * Update an existing file record
   * @param id - File ID to update
   * @param fileData - Data to update
   * @returns Promise that resolves to updated File or null if not found
   */
  async update(id: string, fileData: UpdateFileData): Promise<File | null> {
    try {
      const updatedFile = await FileModel.findByIdAndUpdate(
        id,
        { ...fileData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).exec()

      return updatedFile ? this.mapMongoFileToEntity(updatedFile) : null
    } catch (error) {
      this.logger.error({ error, id, fileData }, 'Failed to update file')
      throw new Error('Failed to update file')
    }
  }

  /**
   * Delete a file record by ID
   * @param id - File ID to delete
   * @returns Promise that resolves to boolean indicating success
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await FileModel.findByIdAndDelete(id).exec()
      return result !== null
    } catch (error) {
      this.logger.error({ error, id }, 'Failed to delete file')
      throw new Error('Failed to delete file')
    }
  }

  /**
   * Get all files (useful for admin operations)
   * @returns Promise that resolves to array of all files
   */
  async findAll(): Promise<File[]> {
    try {
      const files = await FileModel.find({}).sort({ createdAt: -1 }).exec()

      return files.map((file: FileDocument) => this.mapMongoFileToEntity(file))
    } catch (error) {
      this.logger.error({ error }, 'Failed to find all files')
      throw new Error('Failed to find all files')
    }
  }

  /**
   * Get files with pagination
   * @param offset - Number of records to skip
   * @param limit - Maximum number of records to return
   * @returns Promise that resolves to array of Files
   */
  async findWithPagination(offset: number, limit: number): Promise<File[]> {
    try {
      const files = await FileModel.find({})
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec()

      return files.map((file: FileDocument) => this.mapMongoFileToEntity(file))
    } catch (error) {
      this.logger.error(
        { error, offset, limit },
        'Failed to find files with pagination'
      )
      throw new Error('Failed to find files with pagination')
    }
  }

  /**
   * Get total count of files
   * @returns Promise that resolves to total number of files
   */
  async count(): Promise<number> {
    try {
      return await FileModel.countDocuments().exec()
    } catch (error) {
      this.logger.error({ error }, 'Failed to count files')
      throw new Error('Failed to count files')
    }
  }

  /**
   * Find files by MIME type
   * @param mimeType - MIME type to filter by
   * @returns Promise that resolves to array of Files
   */
  async findByMimeType(mimeType: string): Promise<File[]> {
    try {
      const files = await FileModel.find({ mimeType })
        .sort({ createdAt: -1 })
        .exec()

      return files.map((file: FileDocument) => this.mapMongoFileToEntity(file))
    } catch (error) {
      this.logger.error(
        { error, mimeType },
        'Failed to find files by MIME type'
      )
      throw new Error('Failed to find files by MIME type')
    }
  }

  /**
   * Map MongoDB file document to domain File entity
   * @param mongoFile - File document from MongoDB
   * @returns Domain File entity
   */
  private mapMongoFileToEntity(mongoFile: FileDocument): File {
    return {
      id: mongoFile._id.toString(),
      originalName: mongoFile.originalName,
      filename: mongoFile.filename,
      mimeType: mongoFile.mimeType,
      size: mongoFile.size,
      compressedSize: mongoFile.compressedSize,
      path: mongoFile.path,
      uploadedBy: mongoFile.uploadedBy,
      isCompressed: mongoFile.isCompressed,
      compressionRatio: mongoFile.compressionRatio,
      checksum: mongoFile.checksum,
      createdAt: mongoFile.createdAt,
      updatedAt: mongoFile.updatedAt,
      storageType: mongoFile.storageType,
      cloudinaryId: mongoFile.cloudinaryId
    }
  }
}
