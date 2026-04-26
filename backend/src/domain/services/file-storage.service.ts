import { Readable } from 'stream'

/**
 * File Storage Service Interface - Defines contract for file storage operations
 * This is part of the Domain layer in Clean Architecture
 * Abstracts file system operations from implementation details
 */
export interface IFileStorageService {
  /**
   * Store a file with compression
   * @param fileStream - Readable stream of the file data
   * @param filename - Name to store the file as
   * @param compress - Whether to compress the file using zlib
   * @returns Promise that resolves to storage result
   */
  storeFile(
    fileStream: Readable,
    filename: string,
    compress?: boolean
  ): Promise<FileStorageResult>

  /**
   * Retrieve a file as a readable stream
   * @param filename - Name of the file to retrieve
   * @param decompress - Whether to decompress the file if it was compressed
   * @returns Promise that resolves to readable stream
   */
  retrieveFile(filename: string, decompress?: boolean): Promise<Readable>

  /**
   * Delete a file from storage
   * @param filename - Name of the file to delete
   * @returns Promise that resolves to boolean indicating success
   */
  deleteFile(filename: string): Promise<boolean>

  /**
   * Check if a file exists in storage
   * @param filename - Name of the file to check
   * @returns Promise that resolves to boolean indicating existence
   */
  fileExists(filename: string): Promise<boolean>

  /**
   * Get file size
   * @param filename - Name of the file
   * @returns Promise that resolves to file size in bytes
   */
  getFileSize(filename: string): Promise<number>

  /**
   * Calculate file checksum
   * @param filename - Name of the file
   * @returns Promise that resolves to file checksum
   */
  calculateChecksum(filename: string): Promise<string>

  /**
   * Get storage statistics
   * @returns Promise that resolves to storage statistics
   */
  getStorageStats(): Promise<StorageStats>
}

/**
 * Result of file storage operation
 */
export interface FileStorageResult {
  filename: string
  path: string
  originalSize: number
  compressedSize: number
  compressionRatio: number
  checksum: string
  isCompressed: boolean
}

/**
 * Storage statistics
 */
export interface StorageStats {
  totalFiles: number
  totalSize: number
  totalCompressedSize: number
  averageCompressionRatio: number
  availableSpace: number
}
