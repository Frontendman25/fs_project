import { FileUploadProgress } from '../entities/file.entity'

/**
 * File Event Service Interface - Defines contract for file-related event handling
 * This is part of the Domain layer in Clean Architecture
 * Abstracts event emission and handling from implementation details
 */
export interface IFileEventService {
  /**
   * Emit upload started event
   * @param fileId - ID of the file being uploaded
   * @param originalName - Original filename
   * @param size - File size in bytes
   */
  emitUploadStarted(fileId: string, originalName: string, size: number): void

  /**
   * Emit upload progress event
   * @param progress - Upload progress data
   */
  emitUploadProgress(progress: FileUploadProgress): void

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
  ): void

  /**
   * Emit upload error event
   * @param fileId - ID of the file that failed
   * @param originalName - Original filename
   * @param error - Error that occurred
   */
  emitUploadError(fileId: string, originalName: string, error: Error): void

  /**
   * Emit file download started event
   * @param fileId - ID of the file being downloaded
   * @param originalName - Original filename
   */
  emitDownloadStarted(fileId: string, originalName: string): void

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
  ): void

  /**
   * Emit file download error event
   * @param fileId - ID of the file that failed to download
   * @param originalName - Original filename
   * @param error - Error that occurred
   */
  emitDownloadError(fileId: string, originalName: string, error: Error): void

  /**
   * Register event listeners
   * @param event - Event name to listen for
   * @param listener - Event listener function
   */
  on(event: FileEventType, listener: (...args: any[]) => void): void

  /**
   * Remove event listeners
   * @param event - Event name to remove listener from
   * @param listener - Event listener function to remove
   */
  off(event: FileEventType, listener: (...args: any[]) => void): void

  /**
   * Register one-time event listener
   * @param event - Event name to listen for
   * @param listener - Event listener function
   */
  once(event: FileEventType, listener: (...args: any[]) => void): void
}

/**
 * File event types
 */
export type FileEventType =
  | 'upload:started'
  | 'upload:progress'
  | 'upload:completed'
  | 'upload:error'
  | 'download:started'
  | 'download:completed'
  | 'download:error'
  | 'file:deleted'
  | 'storage:full'
  | 'storage:error'

/**
 * Event data interfaces
 */
export interface UploadStartedEvent {
  fileId: string
  originalName: string
  size: number
  timestamp: Date
}

export interface UploadProgressEvent {
  fileId: string
  progress: FileUploadProgress
  timestamp: Date
}

export interface UploadCompletedEvent {
  fileId: string
  originalName: string
  finalPath: string
  compressionRatio: number
  timestamp: Date
}

export interface UploadErrorEvent {
  fileId: string
  originalName: string
  error: Error
  timestamp: Date
}
