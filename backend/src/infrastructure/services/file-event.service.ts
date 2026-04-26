import { EventEmitter } from 'events'

import {
  IFileEventService,
  FileEventType,
  UploadStartedEvent,
  UploadProgressEvent,
  UploadCompletedEvent,
  UploadErrorEvent
} from '../../domain/services/file-event.service'
import { FileUploadProgress } from '../../domain/entities/file.entity'

/**
 * File Event Service Implementation using Node.js EventEmitter
 * This is part of the Infrastructure layer in Clean Architecture
 * Handles file-related event emission and management
 */
export class FileEventService
  extends EventEmitter
  implements IFileEventService
{
  constructor() {
    super()
    this.setMaxListeners(50) // Allow more listeners for file operations
    this.setupDefaultListeners()
  }

  /**
   * Emit upload started event
   * @param fileId - ID of the file being uploaded
   * @param originalName - Original filename
   * @param size - File size in bytes
   */
  emitUploadStarted(fileId: string, originalName: string, size: number): void {
    const event: UploadStartedEvent = {
      fileId,
      originalName,
      size,
      timestamp: new Date()
    }

    console.log(
      `📤 Upload started: ${originalName} (${this.formatBytes(size)})`
    )
    this.emit('upload:started', event)
  }

  /**
   * Emit upload progress event
   * @param progress - Upload progress data
   */
  emitUploadProgress(progress: FileUploadProgress): void {
    const event: UploadProgressEvent = {
      fileId: progress.fileId,
      progress,
      timestamp: new Date()
    }

    console.log(
      `⏳ Upload progress: ${progress.stage} - ${progress.percentage}%`
    )
    this.emit('upload:progress', event)
  }

  /**
   * Emit upload completed event
   * @param fileId - ID of the uploaded file
   * @param originalName - Original filename
   * @param finalPath - Final storage path
   * @param compressionRatio - Compression ratio achieved
   */
  emitUploadCompleted(
    fileId: string,
    originalName: string,
    finalPath: string,
    compressionRatio: number
  ): void {
    const event: UploadCompletedEvent = {
      fileId,
      originalName,
      finalPath,
      compressionRatio,
      timestamp: new Date()
    }

    console.log(
      `✅ Upload completed: ${originalName} (compression: ${compressionRatio.toFixed(2)}x)`
    )
    this.emit('upload:completed', event)
  }

  /**
   * Emit upload error event
   * @param fileId - ID of the file that failed
   * @param originalName - Original filename
   * @param error - Error that occurred
   */
  emitUploadError(fileId: string, originalName: string, error: Error): void {
    const event: UploadErrorEvent = {
      fileId,
      originalName,
      error,
      timestamp: new Date()
    }

    console.error(`❌ Upload error: ${originalName} - ${error.message}`)
    this.emit('upload:error', event)
  }

  /**
   * Emit file download started event
   * @param fileId - ID of the file being downloaded
   * @param originalName - Original filename
   */
  emitDownloadStarted(fileId: string, originalName: string): void {
    const event = {
      fileId,
      originalName,
      timestamp: new Date()
    }

    console.log(`📥 Download started: ${originalName}`)
    this.emit('download:started', event)
  }

  /**
   * Emit file download completed event
   * @param fileId - ID of the downloaded file
   * @param originalName - Original filename
   * @param bytesTransferred - Number of bytes transferred
   */
  emitDownloadCompleted(
    fileId: string,
    originalName: string,
    bytesTransferred: number
  ): void {
    const event = {
      fileId,
      originalName,
      bytesTransferred,
      timestamp: new Date()
    }

    console.log(
      `✅ Download completed: ${originalName} (${this.formatBytes(bytesTransferred)})`
    )
    this.emit('download:completed', event)
  }

  /**
   * Emit file download error event
   * @param fileId - ID of the file that failed to download
   * @param originalName - Original filename
   * @param error - Error that occurred
   */
  emitDownloadError(fileId: string, originalName: string, error: Error): void {
    const event = {
      fileId,
      originalName,
      error,
      timestamp: new Date()
    }

    console.error(`❌ Download error: ${originalName} - ${error.message}`)
    this.emit('download:error', event)
  }

  /**
   * Register event listeners
   * @param event - Event name to listen for
   * @param listener - Event listener function
   */
  on(event: FileEventType, listener: (...args: any[]) => void): this {
    return super.on(event, listener)
  }

  /**
   * Remove event listeners
   * @param event - Event name to remove listener from
   * @param listener - Event listener function to remove
   */
  off(event: FileEventType, listener: (...args: any[]) => void): this {
    return super.off(event, listener)
  }

  /**
   * Register one-time event listener
   * @param event - Event name to listen for
   * @param listener - Event listener function
   */
  once(event: FileEventType, listener: (...args: any[]) => void): this {
    return super.once(event, listener)
  }

  /**
   * Get event listener count for a specific event
   * @param event - Event name
   * @returns Number of listeners
   */
  getListenerCount(event: FileEventType): number {
    return this.listenerCount(event)
  }

  /**
   * Get all registered events
   * @returns Array of event names
   */
  getRegisteredEvents(): FileEventType[] {
    return this.eventNames() as FileEventType[]
  }

  /**
   * Remove all listeners for a specific event or all events
   * @param event - Optional event name to remove listeners from
   */
  removeAllListeners(event?: FileEventType): this {
    return super.removeAllListeners(event)
  }

  /**
   * Setup default event listeners for logging and monitoring
   */
  private setupDefaultListeners(): void {
    // Storage full warning
    this.on('storage:full', (event) => {
      console.warn('⚠️  Storage is running low on space!', event)
    })

    // Storage error handling
    this.on('storage:error', (event) => {
      console.error('💾 Storage error occurred:', event)
    })

    // File deletion tracking
    this.on('file:deleted', (event) => {
      console.log(`🗑️  File deleted: ${event.originalName}`)
    })

    // Upload statistics tracking
    let uploadCount = 0
    let totalUploadSize = 0
    let totalCompressionSaved = 0

    this.on('upload:completed', (event: UploadCompletedEvent) => {
      uploadCount++

      // Estimate original size from compression ratio and final path
      // This is a simplified calculation
      const estimatedOriginalSize = event.compressionRatio * 1024 * 1024 // Placeholder
      totalUploadSize += estimatedOriginalSize
      totalCompressionSaved +=
        estimatedOriginalSize * (1 - 1 / event.compressionRatio)

      // Log statistics every 10 uploads
      if (uploadCount % 10 === 0) {
        console.log(`📊 Upload Statistics:
          - Total uploads: ${uploadCount}
          - Total size: ${this.formatBytes(totalUploadSize)}
          - Space saved by compression: ${this.formatBytes(totalCompressionSaved)}
          - Average compression ratio: ${(totalUploadSize / (totalUploadSize - totalCompressionSaved)).toFixed(2)}x`)
      }
    })

    // Error rate monitoring
    let errorCount = 0
    this.on('upload:error', () => {
      errorCount++
      if (errorCount % 5 === 0) {
        console.warn(
          `⚠️  High error rate detected: ${errorCount} upload errors`
        )
      }
    })
  }

  /**
   * Format bytes to human readable format
   * @param bytes - Number of bytes
   * @returns Formatted string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Emit storage full warning
   * @param availableSpace - Available space in bytes
   * @param threshold - Threshold percentage (0-1)
   */
  emitStorageFull(availableSpace: number, threshold: number = 0.1): void {
    const event = {
      availableSpace,
      threshold,
      timestamp: new Date()
    }

    this.emit('storage:full', event)
  }

  /**
   * Emit storage error
   * @param error - Storage error that occurred
   */
  emitStorageError(error: Error): void {
    const event = {
      error,
      timestamp: new Date()
    }

    this.emit('storage:error', event)
  }

  /**
   * Emit file deleted event
   * @param fileId - ID of the deleted file
   * @param originalName - Original filename
   */
  emitFileDeleted(fileId: string, originalName: string): void {
    const event = {
      fileId,
      originalName,
      timestamp: new Date()
    }

    this.emit('file:deleted', event)
  }
}
