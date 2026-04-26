import { Readable, Transform } from 'stream'
import { createHash } from 'crypto'
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse
} from 'cloudinary'

import {
  IFileStorageService,
  FileStorageResult,
  StorageStats
} from '../../domain/services/file-storage.service'

/**
 * Cloudinary Storage Service Implementation
 * This is part of the Infrastructure layer in Clean Architecture
 * Handles file storage operations using Cloudinary cloud storage
 */
export class CloudinaryStorageService implements IFileStorageService {
  constructor(
    cloudName: string,
    apiKey: string,
    apiSecret: string,
    private folder: string = 'uploads'
  ) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    })
  }

  /**
   * Store a file with optional compression to Cloudinary
   * @param fileStream - Readable stream of the file data
   * @param filename - Name to store the file as
   * @param compress - Whether to compress the file (handled by Cloudinary)
   * @returns Promise that resolves to storage result
   */
  async storeFile(
    fileStream: Readable,
    filename: string,
    compress: boolean = true
  ): Promise<FileStorageResult> {
    let originalSize = 0
    const hash = createHash('sha256')

    try {
      // Create size tracking transform stream
      const sizeTracker = new Transform({
        transform(chunk, encoding, callback) {
          originalSize += chunk.length
          hash.update(chunk)
          callback(null, chunk)
        }
      })

      // Create a promise to handle the upload
      const uploadResult = await new Promise<UploadApiResponse>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: this.folder,
              public_id: this.generatePublicId(filename),
              resource_type: 'image',
              // resource_type: 'auto', // Auto-detect file type
              quality: compress ? 'auto:good' : 'auto:best', // Compression setting
              // format: 'auto', // Auto-detect format
              unique_filename: true,
              overwrite: false
            },
            (
              error: UploadApiErrorResponse | undefined,
              result: UploadApiResponse | undefined
            ) => {
              if (error) {
                reject(new Error(`Cloudinary upload failed: ${error.message}`))
              } else if (result) {
                resolve(result)
              } else {
                reject(new Error('Unknown Cloudinary upload error'))
              }
            }
          )

          // Pipe the file stream through size tracker to upload stream
          fileStream.pipe(sizeTracker).pipe(uploadStream)
        }
      )

      // Calculate compression ratio (Cloudinary optimizes automatically)
      const compressedSize = uploadResult.bytes || originalSize
      const compressionRatio =
        originalSize > 0 ? originalSize / compressedSize : 1.0

      // Generate checksum
      const checksum = hash.digest('hex')

      return {
        filename: uploadResult.public_id,
        path: uploadResult.secure_url,
        originalSize,
        compressedSize,
        compressionRatio,
        checksum,
        isCompressed: compress && compressionRatio > 1.0
      }
    } catch (error) {
      console.error('Error storing file to Cloudinary:', error)
      throw new Error(`Failed to store file to Cloudinary: ${error}`)
    }
  }

  /**
   * Retrieve a file as a readable stream from Cloudinary
   * @param filename - Cloudinary public ID of the file
   * @param decompress - Not applicable for Cloudinary (auto-handled)
   * @returns Promise that resolves to readable stream
   */
  async retrieveFile(
    filename: string,
    decompress: boolean = true
  ): Promise<Readable> {
    try {
      // Generate the Cloudinary URL
      const url = cloudinary.url(filename, {
        resource_type: 'auto',
        secure: true
      })

      // Create a readable stream from the URL
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(
          `Failed to fetch file from Cloudinary: ${response.statusText}`
        )
      }

      if (!response.body) {
        throw new Error('No response body received from Cloudinary')
      }

      // Convert ReadableStream to Node.js Readable
      const nodeStream = new Readable({
        read() {}
      })

      const reader = response.body.getReader()

      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              nodeStream.push(null)
              break
            }
            nodeStream.push(Buffer.from(value))
          }
        } catch (error) {
          nodeStream.destroy(error as Error)
        }
      }

      pump()

      return nodeStream
    } catch (error) {
      console.error('Error retrieving file from Cloudinary:', error)
      throw new Error(`Failed to retrieve file from Cloudinary: ${filename}`)
    }
  }

  /**
   * Delete a file from Cloudinary
   * @param filename - Cloudinary public ID of the file to delete
   * @returns Promise that resolves to boolean indicating success
   */
  async deleteFile(filename: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(filename, {
        resource_type: 'auto'
      })

      return result.result === 'ok'
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error)
      return false
    }
  }

  /**
   * Check if a file exists in Cloudinary
   * @param filename - Cloudinary public ID of the file to check
   * @returns Promise that resolves to boolean indicating existence
   */
  async fileExists(filename: string): Promise<boolean> {
    try {
      const result = await cloudinary.api.resource(filename, {
        resource_type: 'auto'
      })

      return !!result
    } catch (error) {
      // Cloudinary returns 404 error for non-existent resources
      if ((error as any).http_code === 404) {
        return false
      }
      console.error('Error checking file existence in Cloudinary:', error)
      return false
    }
  }

  /**
   * Get file size from Cloudinary
   * @param filename - Cloudinary public ID of the file
   * @returns Promise that resolves to file size in bytes
   */
  async getFileSize(filename: string): Promise<number> {
    try {
      const result = await cloudinary.api.resource(filename, {
        resource_type: 'auto'
      })

      return result.bytes || 0
    } catch (error) {
      console.error('Error getting file size from Cloudinary:', error)
      throw new Error(`Failed to get file size from Cloudinary: ${filename}`)
    }
  }

  /**
   * Calculate file checksum (not directly supported by Cloudinary)
   * This method downloads the file to calculate checksum
   * @param filename - Cloudinary public ID of the file
   * @returns Promise that resolves to file checksum
   */
  async calculateChecksum(filename: string): Promise<string> {
    try {
      const stream = await this.retrieveFile(filename)
      const hash = createHash('sha256')

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => {
          hash.update(chunk)
        })

        stream.on('end', () => {
          resolve(hash.digest('hex'))
        })

        stream.on('error', (error) => {
          reject(error)
        })
      })
    } catch (error) {
      console.error('Error calculating checksum from Cloudinary:', error)
      throw new Error(
        `Failed to calculate checksum from Cloudinary: ${filename}`
      )
    }
  }

  /**
   * Get storage statistics from Cloudinary
   * @returns Promise that resolves to storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      // Get usage statistics from Cloudinary
      const usage = await cloudinary.api.usage()

      // Get resources in the folder
      const resources = await cloudinary.api.resources({
        type: 'upload',
        prefix: this.folder,
        max_results: 500 // Cloudinary limit
      })

      const totalFiles = resources.resources.length
      const totalSize = resources.resources.reduce(
        (sum: number, resource: any) => sum + (resource.bytes || 0),
        0
      )

      return {
        totalFiles,
        totalSize,
        totalCompressedSize: totalSize, // Cloudinary handles compression automatically
        averageCompressionRatio: 1.2, // Estimated average for Cloudinary optimization
        availableSpace: this.calculateAvailableSpace(usage)
      }
    } catch (error) {
      console.error('Error getting storage stats from Cloudinary:', error)
      throw new Error('Failed to get Cloudinary storage statistics')
    }
  }

  /**
   * Generate a unique public ID for Cloudinary
   * @param originalFilename - Original filename
   * @returns Unique public ID
   */
  private generatePublicId(originalFilename: string): string {
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '')
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_')

    return `${sanitizedName}_${timestamp}_${randomSuffix}`
  }

  /**
   * Calculate available space based on Cloudinary usage
   * @param usage - Cloudinary usage object
   * @returns Available space in bytes (estimated)
   */
  private calculateAvailableSpace(usage: any): number {
    // This is an estimation since Cloudinary has different limits for different plans
    const totalLimit = usage.limit || 10 * 1024 * 1024 * 1024 // 10GB default for free tier
    const usedSpace = usage.storage?.usage || 0

    return Math.max(0, totalLimit - usedSpace)
  }

  /**
   * Get Cloudinary URL for a file
   * @param filename - Cloudinary public ID
   * @param transformations - Optional Cloudinary transformations
   * @returns Cloudinary URL
   */
  getFileUrl(filename: string, transformations?: any): string {
    return cloudinary.url(filename, {
      resource_type: 'auto',
      secure: true,
      ...transformations
    })
  }

  /**
   * Get optimized URL for images with transformations
   * @param filename - Cloudinary public ID
   * @param width - Image width
   * @param height - Image height
   * @param quality - Image quality
   * @returns Optimized Cloudinary URL
   */
  getOptimizedImageUrl(
    filename: string,
    width?: number,
    height?: number,
    quality: string = 'auto'
  ): string {
    const transformations: any = {
      quality,
      fetch_format: 'auto'
    }

    if (width) transformations.width = width
    if (height) transformations.height = height
    if (width && height) transformations.crop = 'fill'

    return this.getFileUrl(filename, transformations)
  }

  /**
   * Clean up old files in Cloudinary folder
   * @param maxAge - Maximum age in milliseconds
   */
  async cleanupOldFiles(
    maxAge: number = 30 * 24 * 60 * 60 * 1000
  ): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - maxAge)

      const resources = await cloudinary.api.resources({
        type: 'upload',
        prefix: this.folder,
        max_results: 500
      })

      const oldFiles = resources.resources.filter((resource: any) => {
        const createdAt = new Date(resource.created_at)
        return createdAt < cutoffDate
      })

      for (const file of oldFiles) {
        try {
          await this.deleteFile(file.public_id)
          console.log(`Cleaned up old Cloudinary file: ${file.public_id}`)
        } catch (error) {
          console.error(`Failed to cleanup file ${file.public_id}:`, error)
        }
      }

      console.log(
        `Cloudinary cleanup completed. Removed ${oldFiles.length} old files.`
      )
    } catch (error) {
      console.error('Error during Cloudinary cleanup:', error)
    }
  }
}
