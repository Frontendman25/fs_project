import { apiClient } from './client'
import { ApiResponse, User } from '../types/api'

/**
 * Avatar API service for handling user avatar operations.
 * Focuses specifically on avatar upload, delete, and management.
 */
export const avatarApi = {
  /**
   * Upload user avatar image file.
   * Expects backend to handle multipart/form-data under the "avatar" field.
   * @param userId - User ID for whom to upload the avatar
   * @param formData - FormData containing the avatar file under key "avatar"
   * @returns Promise with uploaded avatar metadata including URL
   */
  async uploadAvatar(
    userId: string,
    formData: FormData
  ): Promise<
    ApiResponse<
      | { url: string }
      | { avatarUrl: string }
      | { user: User }
      | { data?: { url?: string; avatarUrl?: string } }
    >
  > {
    return apiClient.uploadFile(`/api/users/${userId}/avatar`, formData)
  },

  /**
   * Delete user avatar.
   * @param userId - User ID to delete avatar for
   * @returns Promise indicating success
   */
  async deleteAvatar(userId: string): Promise<ApiResponse> {
    return apiClient.delete(`/api/users/${userId}/avatar`)
  }
}
