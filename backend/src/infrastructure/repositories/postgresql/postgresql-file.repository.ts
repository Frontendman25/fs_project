import { PrismaClient, File as PrismaFile } from '@prisma/client'

import { IFileRepository } from '../../../domain/repositories/file.repository'
import { ILoggerService } from '@/domain/services/logger.service'
import {
  File,
  CreateFileData,
  UpdateFileData
} from '../../../domain/entities/file.entity'

/**
 * PostgreSQL File Repository Implementation using Prisma ORM
 * This is part of the Infrastructure layer in Clean Architecture
 * Implements file metadata persistence using PostgreSQL and Prisma
 */
export class PostgreSQLFileRepository implements IFileRepository {
  private logger: ILoggerService

  constructor(
    private prisma: PrismaClient,
    logger: ILoggerService
  ) {
    this.logger = logger.child({ service: 'PostgreSQLFileRepository' })
  }

  /**
   * Create a new file record
   * @param fileData - Data to create the file record
   * @returns Promise that resolves to the created File
   */
  async create(fileData: CreateFileData): Promise<File> {
    try {
      const file = await this.prisma.file.create({
        data: {
          originalName: fileData.originalName,
          filename: fileData.filename,
          mimeType: fileData.mimeType,
          size: fileData.size,
          compressedSize: fileData.compressedSize,
          path: fileData.path,
          uploadedBy: fileData.uploadedBy,
          isCompressed: fileData.isCompressed,
          compressionRatio: fileData.compressionRatio,
          checksum: fileData.checksum,
          storageType: fileData.storageType,
          cloudinaryId: fileData.cloudinaryId
        }
      })

      return this.mapPrismaFileToEntity(file)
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
      const file = await this.prisma.file.findUnique({
        where: { id }
      })

      return file ? this.mapPrismaFileToEntity(file) : null
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
      const files = await this.prisma.file.findMany({
        where: { uploadedBy: userId },
        orderBy: { createdAt: 'desc' }
      })

      return files.map((file: PrismaFile) => this.mapPrismaFileToEntity(file))
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
      const files = await this.prisma.file.findMany({
        where: {
          originalName: {
            contains: namePattern,
            mode: 'insensitive'
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return files.map((file: PrismaFile) => this.mapPrismaFileToEntity(file))
    } catch (error) {
      this.logger.error({ error, namePattern }, 'Failed to find files by name pattern')
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
      // First check if file exists
      const existingFile = await this.prisma.file.findUnique({
        where: { id }
      })

      if (!existingFile) {
        return null
      }

      const updatedFile = await this.prisma.file.update({
        where: { id },
        data: {
          ...(fileData.originalName !== undefined && {
            originalName: fileData.originalName
          }),
          ...(fileData.mimeType !== undefined && {
            mimeType: fileData.mimeType
          }),
          ...(fileData.uploadedBy !== undefined && {
            uploadedBy: fileData.uploadedBy
          }),
          updatedAt: new Date()
        }
      })

      return this.mapPrismaFileToEntity(updatedFile)
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
      await this.prisma.file.delete({
        where: { id }
      })

      return true
    } catch (error) {
      if ((error as any).code === 'P2025') {
        // Record not found
        return false
      }
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
      const files = await this.prisma.file.findMany({
        orderBy: { createdAt: 'desc' }
      })

      return files.map((file: PrismaFile) => this.mapPrismaFileToEntity(file))
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
      const files = await this.prisma.file.findMany({
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })

      return files.map((file: PrismaFile) => this.mapPrismaFileToEntity(file))
    } catch (error) {
      this.logger.error({ error, offset, limit }, 'Failed to find files with pagination')
      throw new Error('Failed to find files with pagination')
    }
  }

  /**
   * Get total count of files
   * @returns Promise that resolves to total number of files
   */
  async count(): Promise<number> {
    try {
      return await this.prisma.file.count()
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
      const files = await this.prisma.file.findMany({
        where: { mimeType },
        orderBy: { createdAt: 'desc' }
      })

      return files.map((file: PrismaFile) => this.mapPrismaFileToEntity(file))
    } catch (error) {
      this.logger.error({ error, mimeType }, 'Failed to find files by MIME type')
      throw new Error('Failed to find files by MIME type')
    }
  }

  /**
   * Find files by storage type
   * @param storageType - Storage type to filter by ('local' or 'cloudinary')
   * @returns Promise that resolves to array of Files
   */
  async findByStorageType(
    storageType: 'local' | 'cloudinary'
  ): Promise<File[]> {
    try {
      const files = await this.prisma.file.findMany({
        where: { storageType },
        orderBy: { createdAt: 'desc' }
      })

      return files.map((file: PrismaFile) => this.mapPrismaFileToEntity(file))
    } catch (error) {
      this.logger.error({ error, storageType }, 'Failed to find files by storage type')
      throw new Error('Failed to find files by storage type')
    }
  }

  /**
   * Find file by Cloudinary ID
   * @param cloudinaryId - Cloudinary public ID
   * @returns Promise that resolves to File or null if not found
   */
  async findByCloudinaryId(cloudinaryId: string): Promise<File | null> {
    try {
      const file = await this.prisma.file.findFirst({
        where: { cloudinaryId }
      })

      return file ? this.mapPrismaFileToEntity(file) : null
    } catch (error) {
      this.logger.error({ error, cloudinaryId }, 'Failed to find file by Cloudinary ID')
      throw new Error('Failed to find file by Cloudinary ID')
    }
  }

  /**
   * Map Prisma file object to domain File entity
   * @param prismaFile - File object from Prisma
   * @returns Domain File entity
   */
  private mapPrismaFileToEntity(prismaFile: PrismaFile): File {
    return {
      id: prismaFile.id,
      originalName: prismaFile.originalName,
      filename: prismaFile.filename,
      mimeType: prismaFile.mimeType,
      size: prismaFile.size,
      compressedSize: prismaFile.compressedSize,
      path: prismaFile.path,
      uploadedBy: prismaFile.uploadedBy || undefined,
      isCompressed: prismaFile.isCompressed,
      compressionRatio: prismaFile.compressionRatio,
      checksum: prismaFile.checksum,
      storageType: prismaFile.storageType as 'local' | 'cloudinary',
      cloudinaryId: prismaFile.cloudinaryId || undefined,
      createdAt: prismaFile.createdAt,
      updatedAt: prismaFile.updatedAt
    }
  }
}
