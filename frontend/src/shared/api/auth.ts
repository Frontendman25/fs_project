import { apiClient } from './client'
import {
  ApiResponse,
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest
} from '../types/api'

/**
 * Authentication API service for handling user authentication operations
 * Provides methods for login, registration, token management, and user profile
 */
export const authApi = {
  /**
   * Authenticate user with credentials
   * @param credentials - User login credentials (username and password)
   * @returns Promise with authentication tokens and user data
   */
  async login(
    credentials: LoginRequest
  ): Promise<ApiResponse<AuthTokens & { user: User }>> {
    return apiClient.post('/auth/login', credentials)
  },

  /**
   * Register a new user account
   * @param userData - User registration data (username, password, optional email)
   * @returns Promise with created user data
   */
  async register(
    userData: RegisterRequest
  ): Promise<ApiResponse<{ user: User }>> {
    return apiClient.post('/auth/register', userData)
  },

  /**
   * Refresh access token using refresh token
   * @returns Promise with new authentication tokens
   */
  async refreshToken(): Promise<ApiResponse<AuthTokens>> {
    return apiClient.post('/auth/refresh')
  },

  /**
   * Logout user from current session
   * @returns Promise with logout result
   */
  async logout(): Promise<ApiResponse> {
    return apiClient.post('/auth/logout')
  },

  /**
   * Logout user from all devices/sessions
   * @returns Promise with logout result
   */
  async logoutAll(): Promise<ApiResponse> {
    return apiClient.post('/auth/logout-all')
  },

  /**
   * Get current user profile information
   * @returns Promise with user profile data
   */
  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get('/auth/profile')
  },

  /**
   * Check authentication service health
   * @returns Promise with health status
   */
  async checkHealth(): Promise<ApiResponse> {
    return apiClient.get('/auth/health')
  }
}
