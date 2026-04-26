/**
 * File Entity - Core business object representing a file in our system
 * This is part of the Domain layer in Clean Architecture
 * Contains only business logic and no external dependencies
 */
export interface File {
  id: string
  originalName: string // Original filename when uploaded
  filename: string // Stored filename on disk
  mimeType: string // MIME type of the file
  size: number // Original file size in bytes
  compressedSize: number // Compressed file size in bytes
  path: string // Storage path on disk
  uploadedBy?: string // User ID who uploaded the file
  isCompressed: boolean // Whether the file is compressed
  compressionRatio: number // Compression ratio (original/compressed)
  checksum: string // File checksum for integrity verification
  storageType: 'local' | 'cloudinary' // Storage type
  cloudinaryId?: string // Cloudinary public ID if stored in cloud
  createdAt: Date
  updatedAt: Date
  secure_url?: string
}

/**
 * File creation data - what we need to create a new file record
 */
export interface CreateFileData {
  originalName: string
  filename: string
  mimeType: string
  size: number
  compressedSize: number
  path: string
  uploadedBy?: string
  isCompressed: boolean
  compressionRatio: number
  checksum: string
  storageType: 'local' | 'cloudinary'
  cloudinaryId?: string
}

/**
 * File update data - what can be updated for a file
 */
export interface UpdateFileData {
  originalName?: string
  mimeType?: string
  uploadedBy?: string
}

/**
 * File upload progress data
 */
export interface FileUploadProgress {
  fileId: string
  bytesReceived: number
  totalBytes: number
  percentage: number
  stage: 'receiving' | 'compressing' | 'saving' | 'completed' | 'error'
}
