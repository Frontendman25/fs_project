import { apiClient } from './client'
import {
  ApiResponse,
  FileMetadata,
  StorageStats,
  PaginationParams,
  SearchParams
} from '../types/api'

/**
 * Files API service for handling file operations
 * Provides methods for upload, download, search, and management of files
 */
export const filesApi = {
  /**
   * Upload a file to the server
   * @param file - File to upload
   * @returns Promise with file metadata
   */
  async uploadFile(file: File): Promise<ApiResponse<FileMetadata>> {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.uploadFile('/upload', formData)
  },

  /**
   * Download a file by ID
   * @param fileId - ID of the file to download
   * @returns Promise with file blob
   */
  async downloadFile(fileId: string): Promise<Blob> {
    return apiClient.downloadFile(`/files/${fileId}`)
  },

  /**
   * Get file metadata by ID
   * @param fileId - ID of the file
   * @returns Promise with file metadata
   */
  async getFileMetadata(fileId: string): Promise<ApiResponse<FileMetadata>> {
    return apiClient.get(`/files/${fileId}/metadata`)
  },

  /**
   * Get files uploaded by a specific user
   * @param userId - ID of the user
   * @returns Promise with array of file metadata
   */
  async getUserFiles(userId: string): Promise<ApiResponse<FileMetadata[]>> {
    return apiClient.get(`/files/user/${userId}`)
  },

  /**
   * Search files by query and type
   * @param params - Search parameters (query and type)
   * @returns Promise with array of matching files
   */
  async searchFiles(
    params: SearchParams
  ): Promise<ApiResponse<FileMetadata[]>> {
    const queryParams: Record<string, string> = {}
    if (params.q) queryParams.q = params.q
    if (params.type) queryParams.type = params.type

    return apiClient.get('/files/search', queryParams)
  },

  /**
   * Get files with pagination
   * @param params - Pagination parameters (page and limit)
   * @returns Promise with paginated files data
   */
  async getFiles(params: PaginationParams = {}): Promise<
    ApiResponse<{
      files: FileMetadata[]
      total: number
      page: number
      totalPages: number
    }>
  > {
    const queryParams: Record<string, string> = {}
    if (params.page) queryParams.page = params.page.toString()
    if (params.limit) queryParams.limit = params.limit.toString()

    return apiClient.get('/files', queryParams)
  },

  /**
   * Delete a file by ID
   * @param fileId - ID of the file to delete
   * @returns Promise with deletion result
   */
  async deleteFile(fileId: string): Promise<ApiResponse> {
    return apiClient.delete(`/files/${fileId}`)
  },

  /**
   * Get storage statistics
   * @returns Promise with storage stats
   */
  async getStorageStats(): Promise<ApiResponse<StorageStats>> {
    return apiClient.get('/files/stats')
  }
}
