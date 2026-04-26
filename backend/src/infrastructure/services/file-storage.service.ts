import fs from 'fs'
import path from 'path'
import { Readable, Transform } from 'stream'
import { createReadStream, createWriteStream, promises as fsPromises } from 'fs'
import { createGzip, createGunzip } from 'zlib'
import { createHash } from 'crypto'
import { pipeline } from 'node:stream/promises'

import {
  IFileStorageService,
  FileStorageResult,
  StorageStats
} from '../../domain/services/file-storage.service'

/**
 * File Storage Service Implementation
 * This is part of the Infrastructure layer in Clean Architecture
 * Handles file storage operations with zlib compression support
 */
export class FileStorageService implements IFileStorageService {
  private readonly storagePath: string

  constructor(storagePath: string = './uploads') {
    this.storagePath = path.resolve(storagePath)
    this.ensureStorageDirectory()
  }

  /**
   * Store a file with optional compression
   * @param fileStream - Readable stream of the file data
   * @param filename - Name to store the file as
   * @param compress - Whether to compress the file using zlib
   * @returns Promise that resolves to storage result
   */
  async storeFile(
    fileStream: Readable,
    filename: string,
    compress: boolean = true
  ): Promise<FileStorageResult> {
    const filePath = path.join(this.storagePath, filename)
    const tempPath = `${filePath}.tmp`

    let originalSize = 0
    let compressedSize = 0
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

      // Create compression pipeline if needed
      const streams: Array<NodeJS.ReadWriteStream | NodeJS.WritableStream> = [
        sizeTracker
      ]

      if (compress) {
        streams.push(createGzip({ level: 6 })) // Balanced compression level
      }

      // Create file write stream
      const writeStream = createWriteStream(tempPath)
      streams.push(writeStream)

      // Pipeline all streams together using array overload to avoid DOM ReadableStream ambiguity
      await pipeline([
        fileStream as NodeJS.ReadableStream,
        ...streams
      ])

      // Get compressed file size
      const stats = await fsPromises.stat(tempPath)
      compressedSize = stats.size

      // Move temp file to final location
      await fsPromises.rename(tempPath, filePath)

      // Calculate compression ratio
      const compressionRatio =
        originalSize > 0 ? originalSize / compressedSize : 1.0

      // Generate checksum
      const checksum = hash.digest('hex')

      return {
        filename,
        path: filePath,
        originalSize,
        compressedSize,
        compressionRatio,
        checksum,
        isCompressed: compress
      }
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fsPromises.unlink(tempPath)
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      console.error('Error storing file:', error)
      throw new Error(`Failed to store file: ${error}`)
    }
  }

  /**
   * Retrieve a file as a readable stream
   * @param filename - Name of the file to retrieve
   * @param decompress - Whether to decompress the file if it was compressed
   * @returns Promise that resolves to readable stream
   */
  async retrieveFile(
    filename: string,
    decompress: boolean = true
  ): Promise<Readable> {
    const filePath = path.join(this.storagePath, filename)

    try {
      // Check if file exists
      await fsPromises.access(filePath, fs.constants.F_OK)

      // Create read stream
      const readStream = createReadStream(filePath)

      // Add decompression if needed
      if (decompress) {
        const gunzipStream = createGunzip()
        return readStream.pipe(gunzipStream)
      }

      return readStream
    } catch (error) {
      console.error('Error retrieving file:', error)
      throw new Error(`Failed to retrieve file: ${filename}`)
    }
  }

  /**
   * Delete a file from storage
   * @param filename - Name of the file to delete
   * @returns Promise that resolves to boolean indicating success
   */
  async deleteFile(filename: string): Promise<boolean> {
    const filePath = path.join(this.storagePath, filename)

    try {
      await fsPromises.unlink(filePath)
      return true
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, consider it successfully deleted
        return true
      }
      console.error('Error deleting file:', error)
      return false
    }
  }

  /**
   * Check if a file exists in storage
   * @param filename - Name of the file to check
   * @returns Promise that resolves to boolean indicating existence
   */
  async fileExists(filename: string): Promise<boolean> {
    const filePath = path.join(this.storagePath, filename)

    try {
      await fsPromises.access(filePath, fs.constants.F_OK)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get file size
   * @param filename - Name of the file
   * @returns Promise that resolves to file size in bytes
   */
  async getFileSize(filename: string): Promise<number> {
    const filePath = path.join(this.storagePath, filename)

    try {
      const stats = await fsPromises.stat(filePath)
      return stats.size
    } catch (error) {
      console.error('Error getting file size:', error)
      throw new Error(`Failed to get file size: ${filename}`)
    }
  }

  /**
   * Calculate file checksum
   * @param filename - Name of the file
   * @returns Promise that resolves to file checksum
   */
  async calculateChecksum(filename: string): Promise<string> {
    const filePath = path.join(this.storagePath, filename)

    try {
      const hash = createHash('sha256')
      const stream = createReadStream(filePath)

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
      console.error('Error calculating checksum:', error)
      throw new Error(`Failed to calculate checksum: ${filename}`)
    }
  }

  /**
   * Get storage statistics
   * @returns Promise that resolves to storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      const files = await fsPromises.readdir(this.storagePath)
      let totalFiles = 0
      let totalSize = 0

      for (const file of files) {
        const filePath = path.join(this.storagePath, file)
        try {
          const stats = await fsPromises.stat(filePath)
          if (stats.isFile()) {
            totalFiles++
            totalSize += stats.size
          }
        } catch (error) {
          // Skip files that can't be accessed
          continue
        }
      }

      // Get available space (simplified - in production, use statvfs or similar)
      const availableSpace = await this.getAvailableSpace()

      return {
        totalFiles,
        totalSize,
        totalCompressedSize: totalSize, // Assuming all stored files are compressed
        averageCompressionRatio: 2.0, // Estimated average
        availableSpace
      }
    } catch (error) {
      console.error('Error getting storage stats:', error)
      throw new Error('Failed to get storage statistics')
    }
  }

  /**
   * Ensure storage directory exists
   */
  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fsPromises.mkdir(this.storagePath, { recursive: true })
    } catch (error) {
      console.error('Error creating storage directory:', error)
      throw new Error('Failed to create storage directory')
    }
  }

  /**
   * Get available disk space (simplified implementation)
   * @returns Promise that resolves to available space in bytes
   */
  private async getAvailableSpace(): Promise<number> {
    try {
      // This is a simplified implementation
      // In production, you'd want to use a proper disk space checking library
      const stats = await fsPromises.stat(this.storagePath)
      return 1024 * 1024 * 1024 * 10 // Return 10GB as placeholder
    } catch (error) {
      return 0
    }
  }

  /**
   * Clean up old temporary files
   * @param maxAge - Maximum age in milliseconds for temp files
   */
  async cleanupTempFiles(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const files = await fsPromises.readdir(this.storagePath)
      const now = Date.now()

      for (const file of files) {
        if (file.endsWith('.tmp')) {
          const filePath = path.join(this.storagePath, file)
          try {
            const stats = await fsPromises.stat(filePath)
            const age = now - stats.mtime.getTime()

            if (age > maxAge) {
              await fsPromises.unlink(filePath)
              console.log(`Cleaned up old temp file: ${file}`)
            }
          } catch (error) {
            // Skip files that can't be processed
            continue
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error)
    }
  }
}
