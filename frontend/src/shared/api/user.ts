import { apiClient } from './client'
import { ApiResponse, User } from '../types/api'

/**
 * User API service for handling user operations.
 * Manages user profile, user data, and user-related requests.
 */
export const userApi = {
  /**
   * Get user profile with avatar URL.
   * @param userId - User ID to get profile for
   * @returns Promise with user data including avatarUrl
   */
  async getUserProfile(userId: string): Promise<ApiResponse<User>> {
    return apiClient.get(`/api/users/${userId}`)
  },

  /**
   * Update user profile information.
   * @param userId - User ID to update
   * @param userData - User data to update
   * @returns Promise with updated user data
   */
  async updateUserProfile(userId: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.put(`/api/users/${userId}`, userData)
  }
}