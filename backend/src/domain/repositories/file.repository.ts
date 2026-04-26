import { File, CreateFileData, UpdateFileData } from '../entities/file.entity'

/**
 * File Repository Interface - Defines contract for file data persistence
 * This is part of the Domain layer in Clean Architecture
 * Abstracts file metadata storage operations from implementation details
 */
export interface IFileRepository {
  /**
   * Create a new file record
   * @param fileData - Data to create the file record
   * @returns Promise that resolves to the created File
   */
  create(fileData: CreateFileData): Promise<File>

  /**
   * Find a file by its ID
   * @param id - File ID to search for
   * @returns Promise that resolves to File or null if not found
   */
  findById(id: string): Promise<File | null>

  /**
   * Find files by user ID
   * @param userId - User ID to search for
   * @returns Promise that resolves to array of Files
   */
  findByUserId(userId: string): Promise<File[]>

  /**
   * Find files by original name pattern
   * @param namePattern - Pattern to match against original filename
   * @returns Promise that resolves to array of Files
   */
  findByNamePattern(namePattern: string): Promise<File[]>

  /**
   * Update an existing file record
   * @param id - File ID to update
   * @param fileData - Data to update
   * @returns Promise that resolves to updated File or null if not found
   */
  update(id: string, fileData: UpdateFileData): Promise<File | null>

  /**
   * Delete a file record by ID
   * @param id - File ID to delete
   * @returns Promise that resolves to boolean indicating success
   */
  delete(id: string): Promise<boolean>

  /**
   * Get all files (useful for admin operations)
   * @returns Promise that resolves to array of all files
   */
  findAll(): Promise<File[]>

  /**
   * Get files with pagination
   * @param offset - Number of records to skip
   * @param limit - Maximum number of records to return
   * @returns Promise that resolves to array of Files
   */
  findWithPagination(offset: number, limit: number): Promise<File[]>

  /**
   * Get total count of files
   * @returns Promise that resolves to total number of files
   */
  count(): Promise<number>

  /**
   * Find files by MIME type
   * @param mimeType - MIME type to filter by
   * @returns Promise that resolves to array of Files
   */
  findByMimeType(mimeType: string): Promise<File[]>
}
